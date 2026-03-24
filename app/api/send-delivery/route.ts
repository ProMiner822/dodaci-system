import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { deliveryPayloadSchema } from "@/lib/schemas";
import { calculateDeliveryPrices } from "@/lib/calculations";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import { escapeHtml } from "@/lib/sanitize";
import { VAT_RATE } from "@/lib/constants";
import { generateDeliveryPDF } from "@/lib/pdf";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

    const pdfBytes = await generateDeliveryPDF(body);
    const pdfBuffer = Buffer.from(pdfBytes);

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
