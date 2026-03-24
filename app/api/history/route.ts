import { NextResponse } from "next/server";
import { getHistory, addHistory } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/storage";

export async function GET() {
  try {
    const history = await getHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error("GET HISTORY ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const entry: HistoryEntry = await request.json();
    if (!entry.deliveryNumber || !entry.date || !entry.company) {
      return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
    }
    await addHistory(entry);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ADD HISTORY ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
