import nodemailer from "nodemailer";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import { escapeHtml } from "@/lib/sanitize";
import { generateDeliveryPDF } from "@/lib/pdf";
import type { DeliveryPayload } from "@/lib/types";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Generate the PDF and email it to the customer. Shared by the initial send
// and re-sends from history.
export async function sendDeliveryEmail(
  payload: DeliveryPayload,
): Promise<{ messageId: string }> {
  const pdfBytes = await generateDeliveryPDF(payload);
  const pdfBuffer = Buffer.from(pdfBytes);

  const emailFrom = process.env.EMAIL_FROM ?? process.env.GMAIL_USER ?? "";
  const emailCc = process.env.EMAIL_CC ?? "";
  const safeDeliveryNumber = payload.deliveryNumber.replace(/[^a-zA-Z0-9\-]/g, "");

  const result = await transporter.sendMail({
    from: emailFrom,
    to: payload.customerEmail,
    cc: emailCc || undefined,
    subject: `Avokádo dodací list ${formatDateSK(payload.date)}`,
    html: `
      <p>Dobrý deň,</p>
      <p>v prílohe posielame dodací list <strong>${escapeHtml(payload.deliveryNumber)}</strong>.</p>
      <p>Odberateľ: ${escapeHtml(payload.customerName)}</p>
      <p>Počet kusov: ${payload.quantity}</p>
      <p>Suma spolu: ${formatEUR(payload.totalWithVat)}</p>
    `,
    attachments: [
      { filename: `dodaci-list-${safeDeliveryNumber}.pdf`, content: pdfBuffer },
    ],
  });

  return { messageId: result.messageId };
}
