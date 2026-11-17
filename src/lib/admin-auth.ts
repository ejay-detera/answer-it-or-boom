import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "boom_admin_token";
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getAdminSecret(): string {
  const passcode = process.env.ADMIN_PASSCODE;
  if (!passcode) {
    throw new Error("Missing ADMIN_PASSCODE environment variable.");
  }
  return createHash("sha256")
    .update(`boom-admin:${passcode}`)
    .digest("hex");
}

function sha256Buffer(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Verifies the candidate passcode against `ADMIN_PASSCODE` in constant time. */
export function verifyAdminPasscode(
  candidate: unknown,
  expectedPasscode: string | undefined = process.env.ADMIN_PASSCODE
): boolean {
  if (typeof candidate !== "string" || candidate.length === 0 || !expectedPasscode) {
    return false;
  }
  return timingSafeEqual(sha256Buffer(candidate), sha256Buffer(expectedPasscode));
}

/** Creates an HMAC-SHA256 signed admin session token expiring in 12 hours. */
export function createAdminSessionToken(
  nowMs: number = Date.now(),
  secret: string = getAdminSecret()
): string {
  const expiresAt = String(nowMs + ADMIN_SESSION_TTL_MS);
  const sig = createHmac("sha256", secret).update(expiresAt).digest("base64url");
  return `${expiresAt}.${sig}`;
}

/** Verifies signature and expiry of an admin session token. */
export function verifyAdminSessionToken(
  token: string | undefined,
  nowMs: number = Date.now(),
  secret: string = getAdminSecret()
): boolean {
  if (!token) return false;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return false;

  const expiresAtStr = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || nowMs > expiresAt) {
    return false;
  }

  const expectedSig = createHmac("sha256", secret)
    .update(expiresAtStr)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

/** Reads and validates the `boom_admin_token` cookie on the Next.js server. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}
