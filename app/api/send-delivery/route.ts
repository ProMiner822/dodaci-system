import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { deliveryPayloadSchema } from "@/lib/schemas";
import { calculateDeliveryPrices } from "@/lib/calculations";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import { escapeHtml } from "@/lib/sanitize";
import { supplier, VAT_RATE } from "@/lib/constants";
import type { DeliveryPayload } from "@/lib/types";
import { readFile } from "fs/promises";
import { join } from "path";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function createPdf(payload: DeliveryPayload) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const page = pdfDoc.addPage([595, 842]);

  const fontsDir = join(process.cwd(), "public", "fonts");
  const regularBytes = await readFile(join(fontsDir, "Roboto-Regular.ttf"));
  const boldBytes = await readFile(join(fontsDir, "Roboto-Bold.ttf"));
  const font = await pdfDoc.embedFont(regularBytes);
  const bold = await pdfDoc.embedFont(boldBytes);

  const draw = (
    text: string,
    x: number,
    y: number,
    size = 11,
    isBold = false,
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? bold : font,
      color: rgb(0, 0, 0),
    });
  };

  draw("Dodávateľ", 24, 800, 12, true);
  draw(supplier.name, 24, 778, 14, true);
  draw(supplier.address1, 24, 758);
  draw(supplier.address2, 24, 742);
  draw(supplier.country, 24, 726);
  draw(`IČO: ${supplier.ico}`, 24, 700);
  draw(`IČ DPH: ${supplier.icdph}`, 120, 700);
  draw(`DIČ: ${supplier.dic}`, 280, 700);

  draw("Kontaktné údaje", 24, 662, 12, true);
  draw(`E-mail: ${supplier.email}`, 24, 640);
  draw(`Telefón: ${supplier.phone}`, 24, 624);

  draw("Dodací list", 390, 800, 20, true);
  draw(`k faktúre č. ${payload.deliveryNumber}`, 360, 774, 12, true);

  draw("Odberateľ", 340, 650, 12, true);
  draw(payload.customerName, 340, 628, 14, true);
  draw(payload.address || "", 340, 608);
  draw(`IČO: ${payload.ico || ""}`, 340, 588);
  draw(`IČ DPH: ${payload.icdph || ""}`, 340, 572);
  draw(`Email: ${payload.customerEmail || ""}`, 340, 556);

  draw(`Dátum: ${formatDateSK(payload.date)}`, 24, 610, 12, true);

  page.drawRectangle({
    x: 24,
    y: 500,
    width: 547,
    height: 28,
    color: rgb(0.88, 0.88, 0.88),
  });

  draw("Označenie dodávky", 30, 510, 10, true);
  draw("Počet", 250, 510, 10, true);
  draw("Cena/ks", 320, 510, 10, true);
  draw("Bez DPH", 400, 510, 10, true);
  draw("DPH", 480, 510, 10, true);
  draw("Spolu", 530, 510, 10, true);

  draw("Avokado hass", 30, 475);
  draw(String(payload.quantity), 255, 475);
  draw(formatEUR(payload.priceWithVat), 320, 475);
  draw(formatEUR(payload.totalWithoutVat), 400, 475);
  draw(formatEUR(payload.vatAmount), 480, 475);
  draw(formatEUR(payload.totalWithVat), 530, 475);

  if (payload.freeQuantity > 0) {
    draw("Avokado hass grátis", 30, 450);
    draw(String(payload.freeQuantity), 255, 450);
    draw(formatEUR(0), 320, 450);
    draw(formatEUR(0), 400, 450);
    draw(formatEUR(0), 480, 450);
    draw(formatEUR(0), 530, 450);
  }

  draw(
    `Suma bez DPH: ${formatEUR(payload.totalWithoutVat)}`,
    24,
    380,
    12,
    true,
  );
  draw(`DPH 19 %: ${formatEUR(payload.vatAmount)}`, 24, 358, 12, true);
  draw(`Suma spolu: ${formatEUR(payload.totalWithVat)}`, 24, 336, 14, true);

  draw("Prevzal:", 24, 220, 12, true);
  draw("______________________________", 24, 200);
  draw("Dňa:", 24, 168, 12, true);
  draw("______________________________", 24, 148);

  if (payload.signatureData) {
    const base64 = payload.signatureData.replace(/^data:image\/png;base64,/, "");
    const sigBytes = Buffer.from(base64, "base64");
    const sigImage = await pdfDoc.embedPng(sigBytes);
    page.drawImage(sigImage, { x: 200, y: 180, width: 150, height: 55 });
  }

  return Buffer.from(await pdfDoc.save());
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    const parsed = deliveryPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request data." },
        { status: 400 },
      );
    }

    const body = parsed.data;

    // Recalculate financial totals server-side to prevent manipulation
    const calc = calculateDeliveryPrices(body.quantity, body.priceWithVat, VAT_RATE);
    body.totalWithoutVat = calc.totalWithoutVat;
    body.vatAmount = calc.vatAmount;
    body.totalWithVat = calc.totalWithVat;

    const pdfBuffer = await createPdf(body);

    const emailFrom =
      process.env.EMAIL_FROM ?? process.env.GMAIL_USER ?? "";
    const emailCc = process.env.EMAIL_CC ?? "";

    // Sanitize filename
    const safeDeliveryNumber = body.deliveryNumber.replace(/[^a-zA-Z0-9\-]/g, "");

    const result = await transporter.sendMail({
      from: emailFrom,
      to: body.customerEmail,
      cc: emailCc || undefined,
      subject: `Avokádo dodací list ${formatDateSK(body.date)}`,
      html: `
        <p>Dobrý deň,</p>
        <p>v prílohe posielame dodací list <strong>${escapeHtml(body.deliveryNumber)}</strong>.</p>
        <p>Odberateľ: ${escapeHtml(body.customerName)}</p>
        <p>Počet kusov: ${body.quantity}</p>
        <p>Suma spolu: ${formatEUR(body.totalWithVat)}</p>
      `,
      attachments: [
        {
          filename: `dodaci-list-${safeDeliveryNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error: unknown) {
    console.error(
      "SEND DELIVERY ERROR:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      { ok: false, error: "An internal error occurred. Please try again." },
      { status: 500 },
    );
  }
}
