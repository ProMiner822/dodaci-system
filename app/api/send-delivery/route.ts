import { NextResponse } from "next/server";
import { deliveryPayloadSchema } from "@/lib/schemas";
import { calculateDeliveryPrices } from "@/lib/calculations";
import { VAT_RATE } from "@/lib/constants";
import { sendDeliveryEmail } from "@/lib/email";
import { addHistory, saveDelivery } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

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
      const { messageId } = await sendDeliveryEmail(body);

      if (!skipHistory) {
        // Persist the full payload (for re-send/download) and a sent summary.
        await saveDelivery(body);
        await addHistory(summary("sent", { messageId }));
      }

      return NextResponse.json({ ok: true, messageId });
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
