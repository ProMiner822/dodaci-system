import { NextResponse } from "next/server";
import { getDelivery } from "@/lib/storage";
import { sendDeliveryEmail } from "@/lib/email";

// Re-send a past delivery's email from its stored payload. Does not create a
// new history record.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  try {
    const { number } = await params;
    const payload = await getDelivery(number);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Dodací list sa nenašiel." },
        { status: 404 },
      );
    }

    const { messageId } = await sendDeliveryEmail(payload);
    return NextResponse.json({ ok: true, messageId });
  } catch (error) {
    console.error("RESEND ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { ok: false, error: "Email sa nepodarilo odoslať." },
      { status: 500 },
    );
  }
}
