import { NextResponse } from "next/server";
import { getCompanies, saveCompanies } from "@/lib/storage";
import { defaultCompanies } from "@/lib/constants";

export async function GET() {
  try {
    const companies = await getCompanies();
    return NextResponse.json(companies.length > 0 ? companies : defaultCompanies);
  } catch (error) {
    console.error("GET COMPANIES ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json(defaultCompanies);
  }
}

export async function PUT(request: Request) {
  try {
    const companies = await request.json();
    if (!Array.isArray(companies)) {
      return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
    }
    await saveCompanies(companies);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SAVE COMPANIES ERROR:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
