import { describe, expect, it } from "vitest";
import {
  createAdminQuestion,
  deleteAdminQuestion,
  kickAdminPlayer,
  runAdminSessionAction,
  updateAdminQuestion,
  type AdminRepository,
} from "@/lib/admin-service";
import type { PlayerRow, QuestionRow, SessionRow } from "@/types/game";

function makeInMemoryAdminRepo(seed?: {
  session?: SessionRow | null;
  players?: PlayerRow[];
  questions?: QuestionRow[];
}): AdminRepository & {
  session: SessionRow | null;
  players: PlayerRow[];
  questions: QuestionRow[];
} {
  const state = {
    session: seed?.session ? { ...seed.session } : null,
    players: [...(seed?.players ?? [])],
    questions: [...(seed?.questions ?? [])],
  };

  return {
    get session() {
      return state.session;
    },
    get players() {
      return state.players;
    },
    get questions() {
      return state.questions;
    },
    async getLatestSession() {
      return state.session;
    },
    async createWaitingSession() {
      state.session = { ...baseSession, id: "sess-created" };
      return state.session;
    },
    async listPlayersBySession(sessionId) {
      return state.players.filter((p) => p.session_id === sessionId);
    },
    async startSession(sessionId, startedAtIso, deadlineIso) {
      if (!state.session || state.session.id !== sessionId) throw new Error("No session");
      state.session = {
        ...state.session,
        status: "countdown",
        started_at: startedAtIso,
        lobby_locked: true,
      };
      state.players = state.players.map((p) =>
        p.session_id === sessionId && p.status === "waiting"
          ? { ...p, status: "playing", deadline: deadlineIso }
          : p
      );
      return state.session;
    },
    async setLobbyLocked(sessionId, locked) {
      if (!state.session || state.session.id !== sessionId) throw new Error("No session");
      state.session = { ...state.session, lobby_locked: locked };
      return state.session;
    },
    async endSessionEarly(sessionId, finishedAtIso) {
      if (!state.session || state.session.id !== sessionId) throw new Error("No session");
      state.players = state.players.map((p) =>
        p.session_id === sessionId && (p.status === "waiting" || p.status === "playing")
          ? { ...p, status: "exploded", finished_at: finishedAtIso }
          : p
      );
      state.session = { ...state.session, status: "finished" };
      return state.session;
    },
    async resetSession(sessionId) {
      if (!state.session || state.session.id !== sessionId) throw new Error("No session");
      state.players = state.players.filter((p) => p.session_id !== sessionId);
      state.session = {
        ...state.session,
        status: "waiting",
        started_at: null,
        lobby_locked: false,
      };
      return state.session;
    },
    async deletePlayerById(playerId) {
      const idx = state.players.findIndex((p) => p.id === playerId);
      if (idx === -1) return false;
      state.players.splice(idx, 1);
      return true;
    },
    async listAllQuestions() {
      return state.questions;
    },
    async createQuestion(input) {
      const created: QuestionRow = { id: `q-${state.questions.length + 1}`, ...input };
      state.questions.push(created);
      return created;
    },
    async updateQuestion(id, patch) {
      const idx = state.questions.findIndex((q) => q.id === id);
      if (idx === -1) return null;
      state.questions[idx] = { ...state.questions[idx], ...patch };
      return state.questions[idx];
    },
    async deleteQuestion(id) {
      const idx = state.questions.findIndex((q) => q.id === id);
      if (idx === -1) return false;
      state.questions.splice(idx, 1);
      return true;
    },
  };
}

const baseSession: SessionRow = {
  id: "sess-1",
  status: "waiting",
  base_time_seconds: 120,
  bonus_time_seconds: 30,
  points_per_correct: 10,
  wrong_answer_penalty_seconds: 0,
  lobby_locked: false,
  started_at: null,
  created_at: "2026-11-17T12:00:00.000Z",
};

const waitingPlayer: PlayerRow = {
  id: "p-1",
  session_id: "sess-1",
  name: "Ada",
  score: 0,
  correct_count: 0,
  wrong_count: 0,
  streak: 0,
  best_streak: 0,
  deadline: null,
  status: "waiting",
  finished_at: null,
  joined_at: "2026-11-17T12:00:01.000Z",
};

describe("admin-service session controls (T-006 / API-05, API-06)", () => {
  it("blocks start with 0 players, then starts countdown, ends early, and resets", async () => {
    const emptyRepo = makeInMemoryAdminRepo({ session: baseSession, players: [] });
    expect(
      await runAdminSessionAction(emptyRepo, "start", new Date("2026-11-17T12:01:00.000Z"))
    ).toMatchObject({ ok: false, status: 400, error: { code: "INVALID_INPUT" } });

    const repo = makeInMemoryAdminRepo({
      session: baseSession,
      players: [waitingPlayer],
    });

    const locked = await runAdminSessionAction(repo, "lock");
    expect(locked.ok && locked.data.lobby_locked).toBe(true);

    const started = await runAdminSessionAction(
      repo,
      "start",
      new Date("2026-11-17T12:01:00.000Z")
    );
    expect(started.ok).toBe(true);
    expect(repo.session?.status).toBe("countdown");
    expect(repo.session?.started_at).toBe("2026-11-17T12:01:03.000Z");
    expect(repo.players[0].status).toBe("playing");
    expect(repo.players[0].deadline).toBe("2026-11-17T12:03:03.000Z");

    const ended = await runAdminSessionAction(
      repo,
      "end",
      new Date("2026-11-17T12:01:30.000Z")
    );
    expect(ended.ok).toBe(true);
    expect(repo.session?.status).toBe("finished");
    expect(repo.players[0].status).toBe("exploded");
    expect(repo.players[0].finished_at).toBe("2026-11-17T12:01:30.000Z");

    const reset = await runAdminSessionAction(repo, "reset");
    expect(reset.ok).toBe(true);
    expect(repo.session?.status).toBe("waiting");
    expect(repo.session?.started_at).toBeNull();
    expect(repo.session?.lobby_locked).toBe(false);
    expect(repo.players).toHaveLength(0);
  });

  it("kicks a player by id", async () => {
    const repo = makeInMemoryAdminRepo({
      session: baseSession,
      players: [waitingPlayer],
    });
    expect(await kickAdminPlayer(repo, "p-1")).toMatchObject({ ok: true, status: 200 });
    expect(repo.players).toHaveLength(0);
    expect(await kickAdminPlayer(repo, "missing")).toMatchObject({
      ok: false,
      status: 404,
      error: { code: "INVALID_INPUT" },
    });
  });

  it("creates a fresh waiting session on reset when the sessions table is empty", async () => {
    const emptyNoSession = makeInMemoryAdminRepo({ session: null });
    const created = await runAdminSessionAction(emptyNoSession, "reset");
    expect(created.ok).toBe(true);
    expect(emptyNoSession.session?.status).toBe("waiting");
    expect(emptyNoSession.session?.id).toBe("sess-created");
  });
});

describe("admin-service question CRUD (T-006 / API-07)", () => {
  it("validates, creates, toggles/updates, and deletes questions", async () => {
    const repo = makeInMemoryAdminRepo({ session: baseSession });

    expect(
      await createAdminQuestion(repo, {
        question: "Bad",
        options: ["Only one"],
        correct_index: 0,
        category: "software",
      })
    ).toMatchObject({ ok: false, status: 400, error: { code: "INVALID_INPUT" } });

    const created = await createAdminQuestion(repo, {
      question: "What does HTTP 200 mean?",
      options: ["OK", "Not Found", "Server Error", "Redirect"],
      correct_index: 0,
      category: "software",
      difficulty: "easy",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("Expected question created");

    const toggled = await updateAdminQuestion(repo, {
      id: created.data.id,
      is_active: false,
    });
    expect(toggled.ok && toggled.data.is_active).toBe(false);

    const deleted = await deleteAdminQuestion(repo, created.data.id);
    expect(deleted).toMatchObject({ ok: true, status: 200 });
    expect(repo.questions).toHaveLength(0);
  });
});
