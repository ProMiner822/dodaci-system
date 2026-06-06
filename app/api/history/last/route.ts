import { NextResponse } from "next/server";
import { lastSentForCompany } from "@/lib/storage";

// Most recent successful delivery for a customer, used to pre-fill "repeat
// last order".
export async function GET(req: Request) {
  const company = new URL(req.url).searchParams.get("company") ?? "";
  if (!company) return NextResponse.json({ last: null });
  try {
    return NextResponse.json({ last: await lastSentForCompany(company) });
  } catch (error) {
    console.error("LAST DELIVERY ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json({ last: null });
  }
}
