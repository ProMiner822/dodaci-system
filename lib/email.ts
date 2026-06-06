import nodemailer from "nodemailer";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import { escapeHtml } from "@/lib/sanitize";
import { generateDeliveryPDF } from "@/lib/pdf";
import type { DeliveryPayload } from "@/lib/types";

// Build the CC list from the global EMAIL_CC plus any per-customer extras,
// keeping only valid-looking addresses and removing duplicates.
export function buildCcList(extra?: string): string[] {
  const raw = `${process.env.EMAIL_CC ?? ""},${extra ?? ""}`;
  const seen = new Set<string>();
  for (const part of raw.split(/[,;]/)) {
    const addr = part.trim();
    if (addr && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) seen.add(addr);
  }
  return [...seen];
}

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
  const cc = buildCcList(payload.ccEmails);
  const safeDeliveryNumber = payload.deliveryNumber.replace(/[^a-zA-Z0-9\-]/g, "");

  const result = await transporter.sendMail({
    from: emailFrom,
    to: payload.customerEmail,
    cc: cc.length ? cc : undefined,
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
