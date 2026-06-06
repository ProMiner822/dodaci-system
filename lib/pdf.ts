import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import { supplier, VAT_RATE } from "@/lib/constants";
import { readFile } from "fs/promises";
import { join } from "path";

export interface PDFData {
  deliveryNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  address: string;
  ico: string;
  icdph: string;
  quantity: number;
  freeQuantity: number;
  priceWithVat: number;
  totalWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
  signatureData: string;
}

export async function generateDeliveryPDF(data: PDFData): Promise<Uint8Array> {
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
  draw(`k faktúre č. ${data.deliveryNumber}`, 360, 774, 12, true);

  draw("Odberateľ", 340, 650, 12, true);
  draw(data.customerName, 340, 628, 14, true);
  draw(data.address || "", 340, 608);
  draw(`IČO: ${data.ico || ""}`, 340, 588);
  draw(`IČ DPH: ${data.icdph || ""}`, 340, 572);
  draw(`Email: ${data.customerEmail || ""}`, 340, 556);

  draw(`Dátum: ${formatDateSK(data.date)}`, 24, 610, 12, true);

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
  draw(String(data.quantity), 255, 475);
  draw(formatEUR(data.priceWithVat), 320, 475);
  draw(formatEUR(data.totalWithoutVat), 400, 475);
  draw(formatEUR(data.vatAmount), 480, 475);
  draw(formatEUR(data.totalWithVat), 530, 475);

  if (data.freeQuantity > 0) {
    draw("Avokado hass grátis", 30, 450);
    draw(String(data.freeQuantity), 255, 450);
    draw(formatEUR(0), 320, 450);
    draw(formatEUR(0), 400, 450);
    draw(formatEUR(0), 480, 450);
    draw(formatEUR(0), 530, 450);
  }

  draw(
    `Suma bez DPH: ${formatEUR(data.totalWithoutVat)}`,
    24,
    380,
    12,
    true,
  );
  draw(`DPH ${Math.round(VAT_RATE * 100)} %: ${formatEUR(data.vatAmount)}`, 24, 358, 12, true);
  draw(`Suma spolu: ${formatEUR(data.totalWithVat)}`, 24, 336, 14, true);

  draw("Prevzal:", 24, 220, 12, true);
  draw("______________________________", 24, 200);
  draw("Dňa:", 24, 168, 12, true);
  draw("______________________________", 24, 148);

  if (data.signatureData) {
    const base64 = data.signatureData.replace(/^data:image\/png;base64,/, "");
    const sigBytes = Buffer.from(base64, "base64");
    const sigImage = await pdfDoc.embedPng(sigBytes);
    // Scale to fit a generous box while preserving aspect ratio, then place it
    // to the right of the "Prevzal:" label (x24, y220), sitting on its line.
    const fit = sigImage.scaleToFit(230, 70);
    page.drawImage(sigImage, { x: 200, y: 200, width: fit.width, height: fit.height });
  }

  return pdfDoc.save();
}
