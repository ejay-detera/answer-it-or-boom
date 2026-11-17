import { describe, expect, it } from "vitest";
import { validatePlayerName } from "@/lib/validation";

describe("validatePlayerName (T-002)", () => {
  it("accepts and trims valid cadet names within 2..20 characters", () => {
    expect(validatePlayerName("  Ada Lovelace  ")).toEqual({
      ok: true,
      name: "Ada Lovelace",
    });
    expect(validatePlayerName("Bo")).toEqual({ ok: true, name: "Bo" });
    expect(validatePlayerName("12345678901234567890")).toEqual({
      ok: true,
      name: "12345678901234567890",
    });
  });

  it("rejects names shorter than 2 characters after trimming", () => {
    expect(validatePlayerName("   ")).toMatchObject({ ok: false, code: "INVALID_NAME" });
    expect(validatePlayerName(" A ")).toMatchObject({ ok: false, code: "INVALID_NAME" });
  });

  it("rejects names longer than 20 characters after trimming", () => {
    expect(validatePlayerName("123456789012345678901")).toMatchObject({
      ok: false,
      code: "INVALID_NAME",
    });
  });

  it("rejects control characters and newlines", () => {
    expect(validatePlayerName("Ada\nLovelace")).toMatchObject({
      ok: false,
      code: "INVALID_NAME",
    });
  });

  it("rejects profanity case-insensitively and with simple separator evasion", () => {
    expect(validatePlayerName("fuck")).toMatchObject({ ok: false, code: "INVALID_NAME" });
    expect(validatePlayerName("Sh1tHead")).toMatchObject({ ok: false, code: "INVALID_NAME" });
    expect(validatePlayerName("b.i.t.c.h")).toMatchObject({ ok: false, code: "INVALID_NAME" });
  });
});
