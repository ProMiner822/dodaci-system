import { NextResponse } from "next/server";
import { getDelivery } from "@/lib/storage";
import { generateDeliveryPDF } from "@/lib/pdf";

// Regenerate and download the PDF for a past delivery from its stored payload.
export async function GET(
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

    const pdfBytes = await generateDeliveryPDF(payload);
    const safe = number.replace(/[^a-zA-Z0-9\-]/g, "");
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dodaci-list-${safe}.pdf"`,
      },
    });
  } catch (error) {
    console.error("DELIVERY PDF ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { ok: false, error: "Chyba pri generovaní PDF." },
      { status: 500 },
    );
  }
}
