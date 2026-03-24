import { NextResponse } from "next/server";
import { nextDeliveryNumber } from "@/lib/storage";

export async function POST() {
  try {
    const number = await nextDeliveryNumber();
    return NextResponse.json({ number });
  } catch (error) {
    console.error("DELIVERY NUMBER ERROR:", error instanceof Error ? error.message : error);
    // Fallback to client-side format
    const d = new Date();
    const dateKey = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return NextResponse.json({ number: `DL-${dateKey}-001` });
  }
}
