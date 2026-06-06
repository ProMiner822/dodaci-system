import { NextResponse } from "next/server";
import { nextDeliveryNumber, peekDeliveryNumber } from "@/lib/storage";

function fallbackNumber(): string {
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" })
    .format(new Date())
    .replace(/-/g, "");
  return `DL-${dateKey}-001`;
}

// Peek the next number for display — does NOT increment the counter.
export async function GET() {
  try {
    return NextResponse.json({ number: await peekDeliveryNumber() });
  } catch (error) {
    console.error("PEEK NUMBER ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json({ number: fallbackNumber() });
  }
}

// Commit the next number at send time — increments the counter.
export async function POST() {
  try {
    return NextResponse.json({ number: await nextDeliveryNumber() });
  } catch (error) {
    console.error("DELIVERY NUMBER ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json({ number: fallbackNumber() });
  }
}
