import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { deliveryPayloadSchema } from "@/lib/schemas";
import { calculateDeliveryPrices } from "@/lib/calculations";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import { escapeHtml } from "@/lib/sanitize";
import { VAT_RATE } from "@/lib/constants";
import { generateDeliveryPDF } from "@/lib/pdf";
import { addHistory, saveDelivery } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

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
    // Re-sends pass skipHistory so they don't create a duplicate record.
    const skipHistory = raw?.skipHistory === true;

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

    const summary = (status: HistoryEntry["status"], extra: Partial<HistoryEntry>): HistoryEntry => ({
      deliveryNumber: body.deliveryNumber,
      date: body.date,
      company: body.customerName,
      quantity: body.quantity,
      freeQuantity: body.freeQuantity,
      totalWithVat: body.totalWithVat,
      sentAt: new Date().toISOString(),
      status,
      ...extra,
    });

    try {
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

      if (!skipHistory) {
        // Persist the full payload (for re-send/download) and a sent summary.
        await saveDelivery(body);
        await addHistory(summary("sent", { messageId: result.messageId }));
      }

      return NextResponse.json({ ok: true, messageId: result.messageId });
    } catch (sendError: unknown) {
      // Record a failed send so it's visible, and keep the payload for retry.
      if (!skipHistory) {
        try {
          await saveDelivery(body);
          await addHistory(
            summary("failed", {
              error: sendError instanceof Error ? sendError.message : "send failed",
            }),
          );
        } catch (recordError) {
          console.error("RECORD FAILED SEND ERROR:", recordError);
        }
      }
      throw sendError;
    }
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
