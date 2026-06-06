import { NextResponse } from "next/server";
import { getHistory } from "@/lib/storage";

// History is written server-side by /api/send-delivery (with real send status).
export async function GET() {
  try {
    const history = await getHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error("GET HISTORY ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json([]);
  }
}
