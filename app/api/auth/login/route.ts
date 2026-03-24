import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = loginSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Neplatné prihlasovacie údaje." },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;
    const validUsername = process.env.AUTH_USERNAME;
    const validHash = process.env.AUTH_PASSWORD_HASH;

    if (!validUsername || !validHash) {
      console.error("AUTH env vars not configured");
      return NextResponse.json(
        { ok: false, error: "Autentifikácia nie je nakonfigurovaná." },
        { status: 500 },
      );
    }

    const usernameMatch = username === validUsername;
    const passwordMatch = await bcrypt.compare(password, validHash);

    if (!usernameMatch || !passwordMatch) {
      return NextResponse.json(
        { ok: false, error: "Nesprávne meno alebo heslo." },
        { status: 401 },
      );
    }

    const token = await signToken(username);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error: unknown) {
    console.error(
      "LOGIN ERROR:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { ok: false, error: "Nastala chyba. Skúste to znova." },
      { status: 500 },
    );
  }
}
