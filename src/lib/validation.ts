import { GAME_CONFIG } from "@/config/game-config";

const PROFANITY_LIST = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "pussy",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "cock",
  "porn",
] as const;

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
};

function normalizeForProfanityCheck(value: string): string {
  return value
    .toLowerCase()
    .replace(/[013457@$]/g, (ch) => LEET_MAP[ch] ?? ch)
    .replace(/[^a-z]/g, "");
}

export type NameValidationResult =
  | { ok: true; name: string }
  | { ok: false; code: "INVALID_NAME"; message: string };

/** Validates and trims a cadet display name against length, control-char, and profanity rules. */
export function validatePlayerName(rawName: unknown): NameValidationResult {
  if (typeof rawName !== "string") {
    return { ok: false, code: "INVALID_NAME", message: "Name is required." };
  }

  if (/[\u0000-\u001F\u007F]/.test(rawName)) {
    return {
      ok: false,
      code: "INVALID_NAME",
      message: "Name contains invalid characters.",
    };
  }

  const trimmed = rawName.trim();
  if (
    trimmed.length < GAME_CONFIG.playerNameMin ||
    trimmed.length > GAME_CONFIG.playerNameMax
  ) {
    return {
      ok: false,
      code: "INVALID_NAME",
      message: `Name must be ${GAME_CONFIG.playerNameMin}–${GAME_CONFIG.playerNameMax} characters.`,
    };
  }

  const normalized = normalizeForProfanityCheck(trimmed);
  if (PROFANITY_LIST.some((word) => normalized.includes(word))) {
    return {
      ok: false,
      code: "INVALID_NAME",
      message: "Please choose a classroom-friendly name.",
    };
  }

  return { ok: true, name: trimmed };
}
