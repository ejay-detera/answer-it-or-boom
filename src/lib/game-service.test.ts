import { describe, expect, it } from "vitest";
import {
  getCurrentPlayerState,
  getNextQuestion,
  joinSession,
  leaveWaitingLobby,
  submitAnswer,
  type GameRepository,
} from "@/lib/game-service";
import type { PlayerRow, QuestionRow, SessionRow } from "@/types/game";

function makeInMemoryRepo(seed?: {
  session?: SessionRow | null;
  players?: PlayerRow[];
  questions?: QuestionRow[];
}): GameRepository & {
  players: PlayerRow[];
  answers: Array<{ playerId: string; questionId: string; selectedIndex: number; isCorrect: boolean }>;
} {
  const session = seed?.session ?? null;
  const players: PlayerRow[] = [...(seed?.players ?? [])];
  const questions: QuestionRow[] = [...(seed?.questions ?? [])];
  const answers: Array<{
    playerId: string;
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
  }> = [];

  return {
    players,
    answers,
    async getLatestSession() {
      return session;
    },
    async getSessionById(sessionId) {
      return session && session.id === sessionId ? session : null;
    },
    async getPlayerById(playerId) {
      return players.find((p) => p.id === playerId) ?? null;
    },
    async createPlayer(sessionId, name) {
      const normalized = name.trim().toLowerCase();
      if (
        players.some(
          (p) => p.session_id === sessionId && p.name.trim().toLowerCase() === normalized
        )
      ) {
        const err = new Error("duplicate key value violates unique constraint") as Error & {
          code?: string;
        };
        err.code = "23505";
        throw err;
      }
      const created: PlayerRow = {
        id: `player-${players.length + 1}`,
        session_id: sessionId,
        name,
        score: 0,
        correct_count: 0,
        wrong_count: 0,
        streak: 0,
        best_streak: 0,
        deadline: null,
        status: "waiting",
        finished_at: null,
        joined_at: "2026-11-17T12:00:00.000Z",
      };
      players.push(created);
      return created;
    },
    async listActiveQuestions() {
      return questions.filter((q) => q.is_active);
    },
    async getQuestionById(questionId) {
      return questions.find((q) => q.id === questionId) ?? null;
    },
    async listPlayerAnswerHistory(playerId) {
      return answers
        .filter((a) => a.playerId === playerId)
        .map((a) => ({ questionId: a.questionId, isCorrect: a.isCorrect }));
    },
    async insertPlayerAnswer(row) {
      if (
        answers.some(
          (a) => a.playerId === row.playerId && a.questionId === row.questionId
        )
      ) {
        return "duplicate";
      }
      answers.push({
        playerId: row.playerId,
        questionId: row.questionId,
        selectedIndex: row.selectedIndex,
        isCorrect: row.isCorrect,
      });
      return "inserted";
    },
    async updatePlayerProgress(playerId, patch) {
      const idx = players.findIndex((p) => p.id === playerId);
      if (idx === -1) throw new Error("Player not found");
      players[idx] = { ...players[idx], ...patch };
      return players[idx];
    },
    async deleteWaitingPlayer(playerId) {
      const idx = players.findIndex(
        (p) => p.id === playerId && p.status === "waiting"
      );
      if (idx === -1) return false;
      players.splice(idx, 1);
      return true;
    },
  };
}

const waitingSession: SessionRow = {
  id: "sess-1",
  status: "waiting",
  base_time_seconds: 120,
  bonus_time_seconds: 30,
  points_per_correct: 10,
  wrong_answer_penalty_seconds: 0,
  lobby_locked: false,
  started_at: null,
  created_at: "2026-11-17T11:55:00.000Z",
};

describe("joinSession (T-002 / API-01)", () => {
  it("creates a waiting player for an unlocked waiting session and rejects case-insensitive duplicates", async () => {
    const repo = makeInMemoryRepo({ session: waitingSession });

    const first = await joinSession(repo, "  Ada  ");
    expect(first).toEqual({
      ok: true,
      status: 201,
      data: {
        playerId: "player-1",
        sessionId: "sess-1",
        name: "Ada",
        status: "waiting",
      },
    });

    const dup = await joinSession(repo, "ada");
    expect(dup).toMatchObject({
      ok: false,
      status: 409,
      error: { code: "DUPLICATE_NAME" },
    });
  });

  it("rejects joins when lobby is locked or session is already running", async () => {
    const lockedRepo = makeInMemoryRepo({
      session: { ...waitingSession, lobby_locked: true },
    });
    expect(await joinSession(lockedRepo, "Grace")).toMatchObject({
      ok: false,
      status: 403,
      error: { code: "LOBBY_LOCKED" },
    });

    const runningRepo = makeInMemoryRepo({
      session: { ...waitingSession, status: "running" },
    });
    expect(await joinSession(runningRepo, "Grace")).toMatchObject({
      ok: false,
      status: 403,
      error: { code: "LOBBY_LOCKED" },
    });
  });
});

const runningSession: SessionRow = {
  ...waitingSession,
  status: "running",
  started_at: "2026-11-17T12:00:00.000Z",
};

const sampleQuestions: QuestionRow[] = [
  {
    id: "q-1",
    question: "What does HTML stand for?",
    options: ["HyperText Markup Language", "High Tech", "Home Tool", "Hyperlink"],
    correct_index: 0,
    category: "software",
    difficulty: "easy",
    is_active: true,
  },
  {
    id: "q-2",
    question: "Which HTTP code means Not Found?",
    options: ["200", "301", "404", "500"],
    correct_index: 2,
    category: "software",
    difficulty: "easy",
    is_active: true,
  },
];

const playingPlayer: PlayerRow = {
  id: "p-1",
  session_id: "sess-1",
  name: "Ada",
  score: 10,
  correct_count: 1,
  wrong_count: 0,
  streak: 1,
  best_streak: 1,
  deadline: "2026-11-17T12:02:30.000Z",
  status: "playing",
  finished_at: null,
  joined_at: "2026-11-17T11:58:00.000Z",
};

describe("getNextQuestion (T-003, T-004 / API-02)", () => {
  it("returns an unseen active question without correct_index", async () => {
    const repo = makeInMemoryRepo({
      session: runningSession,
      players: [playingPlayer],
      questions: sampleQuestions,
    });
    repo.answers.push({
      playerId: "p-1",
      questionId: "q-1",
      selectedIndex: 0,
      isCorrect: true,
    });

    const res = await getNextQuestion(
      repo,
      "p-1",
      new Date("2026-11-17T12:01:00.000Z")
    );
    expect(res.ok).toBe(true);
    if (!res.ok || res.data.status !== "playing") throw new Error("Expected playing question");
    expect(res.data.question.id).toBe("q-2");
    expect(res.data.upcomingQuestions).toEqual([]);
    expect("correct_index" in res.data.question).toBe(false);
    expect(res.data.answeredCount).toBe(1);
    expect(res.data.serverNow).toBe("2026-11-17T12:01:00.000Z");
  });

  it("marks player completed when all active questions are exhausted", async () => {
    const repo = makeInMemoryRepo({
      session: runningSession,
      players: [playingPlayer],
      questions: [sampleQuestions[0]],
    });
    repo.answers.push({
      playerId: "p-1",
      questionId: "q-1",
      selectedIndex: 0,
      isCorrect: true,
    });

    const res = await getNextQuestion(
      repo,
      "p-1",
      new Date("2026-11-17T12:01:00.000Z")
    );
    expect(res).toEqual({
      ok: true,
      status: 200,
      data: {
        status: "completed",
        serverNow: "2026-11-17T12:01:00.000Z",
        score: 10,
        bestStreak: 1,
      },
    });
    expect(repo.players[0].status).toBe("completed");
    expect(repo.players[0].finished_at).toBe("2026-11-17T12:01:00.000Z");
  });

  it("expires player to exploded when server deadline has passed and blocks replay", async () => {
    const repo = makeInMemoryRepo({
      session: runningSession,
      players: [playingPlayer],
      questions: sampleQuestions,
    });

    const expired = await getNextQuestion(
      repo,
      "p-1",
      new Date("2026-11-17T12:02:31.000Z")
    );
    expect(expired).toMatchObject({
      ok: false,
      status: 409,
      error: { code: "TIME_EXPIRED" },
    });
    expect(repo.players[0].status).toBe("exploded");

    const replay = await getNextQuestion(
      repo,
      "p-1",
      new Date("2026-11-17T12:02:32.000Z")
    );
    expect(replay).toMatchObject({
      ok: false,
      status: 403,
      error: { code: "ALREADY_PLAYED" },
    });

    const unauth = await getNextQuestion(
      repo,
      null,
      new Date("2026-11-17T12:01:00.000Z")
    );
    expect(unauth).toMatchObject({
      ok: false,
      status: 401,
      error: { code: "UNAUTHORIZED" },
    });
  });
});

describe("submitAnswer (T-001, T-003, T-004 / API-03)", () => {
  it("evaluates correct/wrong answers, persists stats, and ignores duplicate submits idempotently", async () => {
    const repo = makeInMemoryRepo({
      session: runningSession,
      players: [{ ...playingPlayer, score: 0, correct_count: 0, streak: 0, best_streak: 0 }],
      questions: sampleQuestions,
    });

    const right = await submitAnswer(
      repo,
      { playerId: "p-1", questionId: "q-1", selectedIndex: 0 },
      new Date("2026-11-17T12:01:00.000Z")
    );
    expect(right).toEqual({
      ok: true,
      status: 200,
      data: {
        correct: true,
        alreadyAnswered: false,
        newScore: 10,
        newStreak: 1,
        bestStreak: 1,
        streakBonusAwarded: 0,
        bonusTimeSecondsApplied: 30,
        penaltySecondsApplied: 0,
        consecutiveWrongCount: 0,
        newDeadline: "2026-11-17T12:03:00.000Z",
        serverNow: "2026-11-17T12:01:00.000Z",
        status: "playing",
        nextQuestion: {
          id: "q-2",
          question: "Which HTTP code means Not Found?",
          options: ["200", "301", "404", "500"],
          category: "software",
          difficulty: "easy",
        },
        answeredCount: 1,
      },
    });
    expect(repo.players[0].correct_count).toBe(1);

    // Duplicate submit for q-1 must not add points or extend deadline
    const dup = await submitAnswer(
      repo,
      { playerId: "p-1", questionId: "q-1", selectedIndex: 0 },
      new Date("2026-11-17T12:01:05.000Z")
    );
    expect(dup).toEqual({
      ok: true,
      status: 200,
      data: {
        correct: false,
        alreadyAnswered: true,
        newScore: 10,
        newStreak: 1,
        bestStreak: 1,
        streakBonusAwarded: 0,
        bonusTimeSecondsApplied: 0,
        penaltySecondsApplied: 0,
        consecutiveWrongCount: 0,
        newDeadline: "2026-11-17T12:03:00.000Z",
        serverNow: "2026-11-17T12:01:05.000Z",
        status: "playing",
        nextQuestion: {
          id: "q-2",
          question: "Which HTTP code means Not Found?",
          options: ["200", "301", "404", "500"],
          category: "software",
          difficulty: "easy",
        },
        answeredCount: 1,
      },
    });

    // Wrong answer on last active q-2 deducts -10s and marks run completed in one trip
    const wrong = await submitAnswer(
      repo,
      { playerId: "p-1", questionId: "q-2", selectedIndex: 0 },
      new Date("2026-11-17T12:01:10.000Z")
    );
    expect(wrong).toMatchObject({
      ok: true,
      status: 200,
      data: {
        correct: false,
        alreadyAnswered: false,
        newScore: 10,
        newStreak: 0,
        bestStreak: 1,
        penaltySecondsApplied: 10,
        consecutiveWrongCount: 1,
        newDeadline: "2026-11-17T12:02:50.000Z",
        status: "completed",
        nextQuestion: null,
        answeredCount: 2,
      },
    });
    expect(repo.players[0].wrong_count).toBe(1);
    expect(repo.players[0].status).toBe("completed");
  });

  it("accumulates consecutive wrong penalties (-10s, -20s) and explodes if deadline drops past now", async () => {
    const extraQuestions: QuestionRow[] = [
      ...sampleQuestions,
      {
        id: "q-3",
        question: "What does CSS stand for?",
        options: ["Cascading Style Sheets", "Code Style System"],
        correct_index: 0,
        category: "software",
        difficulty: "easy",
        is_active: true,
      },
    ];
    const repo = makeInMemoryRepo({
      session: runningSession,
      players: [
        {
          ...playingPlayer,
          deadline: "2026-11-17T12:01:25.000Z",
        },
      ],
      questions: extraQuestions,
    });

    // 1st wrong at 12:01:00 -> -10s => 12:01:15 (still playing)
    const w1 = await submitAnswer(
      repo,
      { playerId: "p-1", questionId: "q-1", selectedIndex: 1 },
      new Date("2026-11-17T12:01:00.000Z")
    );
    expect(w1).toMatchObject({
      ok: true,
      data: {
        correct: false,
        penaltySecondsApplied: 10,
        consecutiveWrongCount: 1,
        newDeadline: "2026-11-17T12:01:15.000Z",
        status: "playing",
      },
    });

    // 2nd consecutive wrong at 12:01:02 -> -20s => 12:00:55 < 12:01:02 => exploded immediately
    const w2 = await submitAnswer(
      repo,
      { playerId: "p-1", questionId: "q-2", selectedIndex: 0 },
      new Date("2026-11-17T12:01:02.000Z")
    );
    expect(w2).toMatchObject({
      ok: true,
      data: {
        correct: false,
        penaltySecondsApplied: 20,
        consecutiveWrongCount: 2,
        newDeadline: "2026-11-17T12:00:55.000Z",
        status: "exploded",
        nextQuestion: null,
      },
    });
    expect(repo.players[0].status).toBe("exploded");
  });

  it("rejects out-of-range selectedIndex, expired deadline, and already-finished players", async () => {
    const repo = makeInMemoryRepo({
      session: runningSession,
      players: [playingPlayer],
      questions: sampleQuestions,
    });

    expect(
      await submitAnswer(
        repo,
        { playerId: "p-1", questionId: "q-1", selectedIndex: 99 },
        new Date("2026-11-17T12:01:00.000Z")
      )
    ).toMatchObject({ ok: false, status: 400, error: { code: "INVALID_INPUT" } });

    expect(
      await submitAnswer(
        repo,
        { playerId: "p-1", questionId: "q-1", selectedIndex: 0 },
        new Date("2026-11-17T12:02:31.000Z")
      )
    ).toMatchObject({ ok: false, status: 409, error: { code: "TIME_EXPIRED" } });

    expect(
      await submitAnswer(
        repo,
        { playerId: "p-1", questionId: "q-1", selectedIndex: 0 },
        new Date("2026-11-17T12:02:32.000Z")
      )
    ).toMatchObject({ ok: false, status: 403, error: { code: "ALREADY_PLAYED" } });
  });
});

describe("getCurrentPlayerState & countdown transition (T-003)", () => {
  it("returns null player when cookie is missing or kicked, while still returning latest session", async () => {
    const repo = makeInMemoryRepo({ session: waitingSession });
    const res = await getCurrentPlayerState(
      repo,
      undefined,
      new Date("2026-11-17T11:59:00.000Z")
    );
    expect(res).toEqual({
      ok: true,
      status: 200,
      data: {
        session: waitingSession,
        player: null,
        serverNow: "2026-11-17T11:59:00.000Z",
      },
    });
  });

  it("activates waiting player into playing once countdown started_at arrives and expires overdue runs", async () => {
    const countdownSession: SessionRow = {
      ...waitingSession,
      status: "countdown",
      started_at: "2026-11-17T12:00:00.000Z",
    };
    const waitingPlayer: PlayerRow = {
      ...playingPlayer,
      status: "waiting",
      deadline: null,
      score: 0,
      correct_count: 0,
      streak: 0,
      best_streak: 0,
    };
    const repo = makeInMemoryRepo({
      session: countdownSession,
      players: [waitingPlayer],
      questions: sampleQuestions,
    });

    // Before started_at: stays waiting
    const before = await getCurrentPlayerState(
      repo,
      "p-1",
      new Date("2026-11-17T11:59:58.000Z")
    );
    expect(before.ok && before.data.player?.status).toBe("waiting");

    // At started_at: transitions to playing with 120s deadline, and getNextQuestion works
    const atStart = await getCurrentPlayerState(
      repo,
      "p-1",
      new Date("2026-11-17T12:00:00.000Z")
    );
    expect(atStart.ok && atStart.data.player?.status).toBe("playing");
    expect(atStart.ok && atStart.data.player?.deadline).toBe(
      "2026-11-17T12:02:00.000Z"
    );

    const qRes = await getNextQuestion(
      repo,
      "p-1",
      new Date("2026-11-17T12:00:05.000Z")
    );
    expect(qRes.ok && qRes.data.status).toBe("playing");

    // Past deadline: flips to exploded
    const afterDeadline = await getCurrentPlayerState(
      repo,
      "p-1",
      new Date("2026-11-17T12:02:01.000Z")
    );
    expect(afterDeadline.ok && afterDeadline.data.player?.status).toBe("exploded");
  });

  it("allows a waiting cadet to leave the lobby and blocks leaving once playing", async () => {
    const repo = makeInMemoryRepo({
      session: waitingSession,
      players: [
        {
          id: "p-wait",
          session_id: waitingSession.id,
          name: "trial",
          score: 0,
          correct_count: 0,
          wrong_count: 0,
          streak: 0,
          best_streak: 0,
          deadline: null,
          status: "waiting",
          finished_at: null,
          joined_at: "2026-11-17T11:58:00.000Z",
        },
        {
          id: "p-play",
          session_id: waitingSession.id,
          name: "active",
          score: 10,
          correct_count: 1,
          wrong_count: 0,
          streak: 1,
          best_streak: 1,
          deadline: "2026-11-17T12:02:30.000Z",
          status: "playing",
          finished_at: null,
          joined_at: "2026-11-17T11:58:00.000Z",
        },
      ],
    });

    const leftRes = await leaveWaitingLobby(repo, "p-wait");
    expect(leftRes.ok && leftRes.data.left).toBe(true);
    expect(repo.players.some((p) => p.id === "p-wait")).toBe(false);

    const blockedRes = await leaveWaitingLobby(repo, "p-play");
    expect(blockedRes.ok).toBe(false);
    if (!blockedRes.ok) {
      expect(blockedRes.error.code).toBe("ALREADY_PLAYED");
    }
  });
});
