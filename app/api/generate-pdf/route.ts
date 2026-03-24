import { NextResponse } from "next/server";
import { generateDeliveryPDF } from "@/lib/pdf";
import { deliveryPayloadSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = deliveryPayloadSchema.safeParse(body);
    if (!parsed.success) {
      console.error("VALIDATION ERRORS:", JSON.stringify(parsed.error.flatten().fieldErrors));
      return NextResponse.json(
        { ok: false, error: "Neplatné údaje.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const pdfBytes = await generateDeliveryPDF(parsed.data);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dodaci-list-${parsed.data.deliveryNumber.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`,
      },
    });
  } catch (error) {
    console.error(
      "GENERATE PDF ERROR:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { ok: false, error: "Chyba pri generovaní PDF." },
      { status: 500 },
    );
  }
}
