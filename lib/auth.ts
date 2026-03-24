import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("dodaci-system")
    .sign(secret);
}

export async function verifyToken(
  token: string,
): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "dodaci-system",
    });
    return payload as unknown as { username: string };
  } catch {
    return null;
  }
}
