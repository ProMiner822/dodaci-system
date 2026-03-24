import { NextResponse } from "next/server";
import { z } from "zod";

const sheetPayloadSchema = z.object({
  datum: z.string().min(1),
  firma: z.string().min(1).max(200),
  pocetKs: z.number().int().min(0),
  cenaZaKsSDPH: z.number().min(0),
  cisloDodaciehoListu: z.string().min(1).max(30),
  emailFirmy: z.string().email().max(254),
  podpisane: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    const parsed = sheetPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request data." },
        { status: 400 },
      );
    }

    const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!googleScriptUrl) {
      console.error("GOOGLE_SCRIPT_URL is not configured");
      return NextResponse.json(
        { ok: false, error: "Google Sheets integration not configured." },
        { status: 500 },
      );
    }

    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(parsed.data),
    });

    const text = await response.text();

    return NextResponse.json({ ok: true, response: text });
  } catch (error: unknown) {
    console.error(
      "SAVE TO SHEET ERROR:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      { ok: false, error: "Failed to save to Google Sheets." },
      { status: 500 },
    );
  }
}
