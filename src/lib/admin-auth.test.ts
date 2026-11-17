import { describe, expect, it } from "vitest";
import {
  createAdminSessionToken,
  verifyAdminPasscode,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

describe("admin-auth (T-006 / ADR-0002)", () => {
  it("verifies ADMIN_PASSCODE with constant-time comparison and rejects mismatches", () => {
    expect(verifyAdminPasscode("secret-123", "secret-123")).toBe(true);
    expect(verifyAdminPasscode("secret-124", "secret-123")).toBe(false);
    expect(verifyAdminPasscode("short", "secret-123")).toBe(false);
    expect(verifyAdminPasscode("", "secret-123")).toBe(false);
    expect(verifyAdminPasscode(null, "secret-123")).toBe(false);
  });

  it("creates and validates HMAC-signed tokens and rejects tampered or expired tokens", () => {
    const secret = "test-admin-secret";
    const now = 1_700_000_000_000;
    const token = createAdminSessionToken(now, secret);

    expect(verifyAdminSessionToken(token, now + 1000, secret)).toBe(true);
    expect(verifyAdminSessionToken(token, now + 13 * 60 * 60 * 1000, secret)).toBe(false);
    expect(verifyAdminSessionToken(`${token}x`, now + 1000, secret)).toBe(false);
    expect(verifyAdminSessionToken(token, now + 1000, "wrong-secret")).toBe(false);
    expect(verifyAdminSessionToken(undefined, now + 1000, secret)).toBe(false);
  });
});
