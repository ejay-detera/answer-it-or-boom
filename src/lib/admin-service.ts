import { GAME_CONFIG } from "@/config/game-config";
import type { ServiceResult } from "@/lib/game-service";
import type {
  ApiErrorCode,
  PlayerRow,
  QuestionCategory,
  QuestionDifficulty,
  QuestionRow,
  SessionRow,
} from "@/types/game";

export type AdminSessionAction = "start" | "lock" | "unlock" | "end" | "reset";

export interface QuestionCreateInput {
  question: string;
  options: string[];
  correct_index: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  is_active: boolean;
}

export interface AdminRepository {
  getLatestSession(): Promise<SessionRow | null>;
  listPlayersBySession(sessionId: string): Promise<PlayerRow[]>;
  startSession(
    sessionId: string,
    startedAtIso: string,
    deadlineIso: string
  ): Promise<SessionRow>;
  setLobbyLocked(sessionId: string, locked: boolean): Promise<SessionRow>;
  endSessionEarly(sessionId: string, finishedAtIso: string): Promise<SessionRow>;
  resetSession(sessionId: string): Promise<SessionRow>;
  deletePlayerById(playerId: string): Promise<boolean>;
  listAllQuestions(): Promise<QuestionRow[]>;
  createQuestion(input: QuestionCreateInput): Promise<QuestionRow>;
  updateQuestion(
    id: string,
    patch: Partial<QuestionCreateInput>
  ): Promise<QuestionRow | null>;
  deleteQuestion(id: string): Promise<boolean>;
}

const VALID_CATEGORIES = new Set<QuestionCategory>(["software", "general", "fun"]);
const VALID_DIFFICULTIES = new Set<QuestionDifficulty>(["easy", "medium"]);

function fail(
  status: number,
  code: ApiErrorCode,
  message: string
): ServiceResult<never> {
  return { ok: false, status, error: { code, message } };
}

/** Executes facilitator session lifecycle commands (`start`, `lock`, `unlock`, `end`, `reset`). */
export async function runAdminSessionAction(
  repo: AdminRepository,
  action: unknown,
  now: Date = new Date()
): Promise<ServiceResult<SessionRow>> {
  const session = await repo.getLatestSession();
  if (!session) {
    return fail(404, "NO_SESSION", "No session exists.");
  }

  switch (action) {
    case "start": {
      if (session.status !== "waiting") {
        return fail(409, "INVALID_INPUT", "Session has already started.");
      }
      const players = await repo.listPlayersBySession(session.id);
      if (players.length === 0) {
        return fail(
          400,
          "INVALID_INPUT",
          "At least 1 cadet must join before starting."
        );
      }
      const startedAtMs = now.getTime() + GAME_CONFIG.countdownSeconds * 1000;
      const deadlineMs = startedAtMs + session.base_time_seconds * 1000;
      const updated = await repo.startSession(
        session.id,
        new Date(startedAtMs).toISOString(),
        new Date(deadlineMs).toISOString()
      );
      return { ok: true, status: 200, data: updated };
    }
    case "lock":
      return {
        ok: true,
        status: 200,
        data: await repo.setLobbyLocked(session.id, true),
      };
    case "unlock":
      return {
        ok: true,
        status: 200,
        data: await repo.setLobbyLocked(session.id, false),
      };
    case "end": {
      if (session.status !== "countdown" && session.status !== "running") {
        return fail(409, "NOT_RUNNING", "Only a live session can be ended early.");
      }
      return {
        ok: true,
        status: 200,
        data: await repo.endSessionEarly(session.id, now.toISOString()),
      };
    }
    case "reset":
      return {
        ok: true,
        status: 200,
        data: await repo.resetSession(session.id),
      };
    default:
      return fail(400, "INVALID_INPUT", "Unknown session action.");
  }
}

/** Removes a player row from the current session. */
export async function kickAdminPlayer(
  repo: AdminRepository,
  playerId: unknown
): Promise<ServiceResult<{ deleted: true }>> {
  if (typeof playerId !== "string" || playerId.trim().length === 0) {
    return fail(400, "INVALID_INPUT", "Invalid player id.");
  }
  const deleted = await repo.deletePlayerById(playerId);
  if (!deleted) {
    return fail(404, "INVALID_INPUT", "Player not found.");
  }
  return { ok: true, status: 200, data: { deleted: true } };
}

function parseQuestionCreate(raw: unknown): ServiceResult<QuestionCreateInput> {
  if (typeof raw !== "object" || raw === null) {
    return fail(400, "INVALID_INPUT", "Invalid question payload.");
  }
  const body = raw as Record<string, unknown>;
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (question.length === 0) {
    return fail(400, "INVALID_INPUT", "Question prompt is required.");
  }

  if (!Array.isArray(body.options)) {
    return fail(400, "INVALID_INPUT", "Options must be a list of 2–4 choices.");
  }
  const options = body.options
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  if (options.length < 2 || options.length > 4 || options.length !== body.options.length) {
    return fail(400, "INVALID_INPUT", "Provide 2–4 non-empty options.");
  }

  const correctIndex = body.correct_index;
  if (
    typeof correctIndex !== "number" ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return fail(400, "INVALID_INPUT", "Valid correct_index is required.");
  }

  const category = body.category;
  if (typeof category !== "string" || !VALID_CATEGORIES.has(category as QuestionCategory)) {
    return fail(400, "INVALID_INPUT", "Invalid category.");
  }

  const difficulty = body.difficulty ?? "easy";
  if (
    typeof difficulty !== "string" ||
    !VALID_DIFFICULTIES.has(difficulty as QuestionDifficulty)
  ) {
    return fail(400, "INVALID_INPUT", "Invalid difficulty.");
  }

  const isActive = body.is_active === undefined ? true : Boolean(body.is_active);

  return {
    ok: true,
    status: 200,
    data: {
      question,
      options,
      correct_index: correctIndex,
      category: category as QuestionCategory,
      difficulty: difficulty as QuestionDifficulty,
      is_active: isActive,
    },
  };
}

export async function createAdminQuestion(
  repo: AdminRepository,
  raw: unknown
): Promise<ServiceResult<QuestionRow>> {
  const parsed = parseQuestionCreate(raw);
  if (!parsed.ok) return parsed;
  const created = await repo.createQuestion(parsed.data);
  return { ok: true, status: 201, data: created };
}

export async function updateAdminQuestion(
  repo: AdminRepository,
  raw: unknown
): Promise<ServiceResult<QuestionRow>> {
  if (typeof raw !== "object" || raw === null) {
    return fail(400, "INVALID_INPUT", "Invalid question payload.");
  }
  const body = raw as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return fail(400, "INVALID_INPUT", "Question id is required.");
  }

  // Allow partial `is_active` toggle without requiring full question payload
  if (
    Object.keys(body).every((k) => k === "id" || k === "is_active") &&
    typeof body.is_active === "boolean"
  ) {
    const updated = await repo.updateQuestion(id, { is_active: body.is_active });
    return updated
      ? { ok: true, status: 200, data: updated }
      : fail(404, "INVALID_INPUT", "Question not found.");
  }

  const parsed = parseQuestionCreate(body);
  if (!parsed.ok) return parsed;

  const updated = await repo.updateQuestion(id, parsed.data);
  return updated
    ? { ok: true, status: 200, data: updated }
    : fail(404, "INVALID_INPUT", "Question not found.");
}

export async function deleteAdminQuestion(
  repo: AdminRepository,
  id: unknown
): Promise<ServiceResult<{ deleted: true }>> {
  if (typeof id !== "string" || id.trim().length === 0) {
    return fail(400, "INVALID_INPUT", "Question id is required.");
  }
  const deleted = await repo.deleteQuestion(id);
  return deleted
    ? { ok: true, status: 200, data: { deleted: true } }
    : fail(404, "INVALID_INPUT", "Question not found.");
}
