import { evaluateAnswer, isDeadlineExpired } from "@/lib/game-rules";
import { validatePlayerName } from "@/lib/validation";
import type {
  ApiErrorCode,
  ApiErrorEnvelope,
  JoinSessionResponse,
  NextQuestionResponse,
  PlayerRow,
  PublicQuestion,
  QuestionRow,
  SessionMeResponse,
  SessionRow,
  SubmitAnswerResponse,
} from "@/types/game";

export type PlayerProgressPatch = Partial<
  Pick<
    PlayerRow,
    | "score"
    | "correct_count"
    | "wrong_count"
    | "streak"
    | "best_streak"
    | "deadline"
    | "status"
    | "finished_at"
  >
>;

export interface GameRepository {
  getLatestSession(): Promise<SessionRow | null>;
  getSessionById(sessionId: string): Promise<SessionRow | null>;
  getPlayerById(playerId: string): Promise<PlayerRow | null>;
  createPlayer(sessionId: string, name: string): Promise<PlayerRow>;
  listActiveQuestions(): Promise<QuestionRow[]>;
  getQuestionById(questionId: string): Promise<QuestionRow | null>;
  listAnsweredQuestionIds(playerId: string): Promise<string[]>;
  insertPlayerAnswer(row: {
    playerId: string;
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
    answeredAt: string;
  }): Promise<"inserted" | "duplicate">;
  updatePlayerProgress(
    playerId: string,
    patch: PlayerProgressPatch
  ): Promise<PlayerRow>;
}

export type ServiceFailure = {
  ok: false;
  status: number;
  error: ApiErrorEnvelope["error"];
};

export type ServiceResult<T> =
  | { ok: true; status: number; data: T }
  | ServiceFailure;

function fail(
  status: number,
  code: ApiErrorCode,
  message: string
): ServiceFailure {
  return { ok: false, status, error: { code, message } };
}

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

/** Validates cadet name and joins the active unlocked waiting session. */
export async function joinSession(
  repo: GameRepository,
  rawName: unknown
): Promise<ServiceResult<JoinSessionResponse>> {
  const nameCheck = validatePlayerName(rawName);
  if (!nameCheck.ok) {
    return fail(400, nameCheck.code, nameCheck.message);
  }

  const session = await repo.getLatestSession();
  if (!session) {
    return fail(404, "NO_SESSION", "No active session is available right now.");
  }

  if (session.status !== "waiting" || session.lobby_locked) {
    return fail(
      403,
      "LOBBY_LOCKED",
      "The lobby is locked or the game has already started."
    );
  }

  try {
    const player = await repo.createPlayer(session.id, nameCheck.name);
    return {
      ok: true,
      status: 201,
      data: {
        playerId: player.id,
        sessionId: player.session_id,
        name: player.name,
        status: player.status,
      },
    };
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      return fail(
        409,
        "DUPLICATE_NAME",
        "That name is already taken in this session."
      );
    }
    throw err;
  }
}

function isSessionLive(session: SessionRow, now: Date): boolean {
  if (session.status === "running") return true;
  if (
    session.status === "countdown" &&
    session.started_at !== null &&
    now.getTime() >= Date.parse(session.started_at)
  ) {
    return true;
  }
  return false;
}

async function syncPlayerLifecycle(
  repo: GameRepository,
  player: PlayerRow,
  session: SessionRow,
  now: Date
): Promise<PlayerRow> {
  let current = player;
  const sessionLive = isSessionLive(session, now);

  if (
    current.status === "waiting" &&
    sessionLive &&
    session.started_at !== null
  ) {
    const deadline =
      current.deadline ??
      new Date(
        Date.parse(session.started_at) + session.base_time_seconds * 1000
      ).toISOString();
    current = await repo.updatePlayerProgress(current.id, {
      status: "playing",
      deadline,
    });
  }

  if (
    current.status === "playing" &&
    (session.status === "finished" || isDeadlineExpired(current.deadline, now))
  ) {
    current = await repo.updatePlayerProgress(current.id, {
      status: "exploded",
      finished_at: now.toISOString(),
    });
  }

  return current;
}

/** Returns current session & authenticated player state (or `player: null` if missing/kicked). */
export async function getCurrentPlayerState(
  repo: GameRepository,
  playerId: string | null | undefined,
  now: Date = new Date()
): Promise<ServiceResult<SessionMeResponse>> {
  const serverNow = now.toISOString();

  if (!playerId) {
    return {
      ok: true,
      status: 200,
      data: {
        session: await repo.getLatestSession(),
        player: null,
        serverNow,
      },
    };
  }

  const player = await repo.getPlayerById(playerId);
  if (!player) {
    return {
      ok: true,
      status: 200,
      data: {
        session: await repo.getLatestSession(),
        player: null,
        serverNow,
      },
    };
  }

  const session = await repo.getSessionById(player.session_id);
  if (!session) {
    return {
      ok: true,
      status: 200,
      data: {
        session: await repo.getLatestSession(),
        player: null,
        serverNow,
      },
    };
  }

  const syncedPlayer = await syncPlayerLifecycle(repo, player, session, now);
  return {
    ok: true,
    status: 200,
    data: {
      session,
      player: syncedPlayer,
      serverNow,
    },
  };
}

async function loadPlayingPlayerContext(
  repo: GameRepository,
  playerId: string | null | undefined,
  now: Date
): Promise<
  | { ok: true; player: PlayerRow; session: SessionRow }
  | ServiceFailure
> {
  if (!playerId) {
    return fail(401, "UNAUTHORIZED", "Missing player session.");
  }

  const rawPlayer = await repo.getPlayerById(playerId);
  if (!rawPlayer) {
    return fail(401, "UNAUTHORIZED", "Player session not found.");
  }

  const session = await repo.getSessionById(rawPlayer.session_id);
  if (!session) {
    return fail(409, "NOT_RUNNING", "The session is not currently running.");
  }

  const player = await syncPlayerLifecycle(repo, rawPlayer, session, now);

  if (player.status === "exploded" || player.status === "completed") {
    if (
      rawPlayer.status === "playing" &&
      player.status === "exploded" &&
      session.status !== "finished"
    ) {
      return fail(409, "TIME_EXPIRED", "BOOM! Your bomb fuse expired.");
    }
    return fail(403, "ALREADY_PLAYED", "You have already completed this session.");
  }

  if (!isSessionLive(session, now) || player.status !== "playing") {
    return fail(409, "NOT_RUNNING", "The session is not currently running.");
  }

  return { ok: true, player, session };
}

function toPublicQuestion(question: QuestionRow): PublicQuestion {
  return {
    id: question.id,
    question: question.question,
    options: question.options,
    category: question.category,
    difficulty: question.difficulty,
  };
}

/** Returns a random unseen active question (without `correct_index`) or marks the player completed. */
export async function getNextQuestion(
  repo: GameRepository,
  playerId: string | null | undefined,
  now: Date = new Date()
): Promise<ServiceResult<NextQuestionResponse>> {
  const ctx = await loadPlayingPlayerContext(repo, playerId, now);
  if (!ctx.ok) return ctx;

  const { player } = ctx;
  const [activeQuestions, answeredIds] = await Promise.all([
    repo.listActiveQuestions(),
    repo.listAnsweredQuestionIds(player.id),
  ]);

  const seen = new Set(answeredIds);
  const unseen = activeQuestions.filter((q) => !seen.has(q.id));
  const serverNow = now.toISOString();

  if (unseen.length === 0) {
    await repo.updatePlayerProgress(player.id, {
      status: "completed",
      finished_at: serverNow,
    });
    return {
      ok: true,
      status: 200,
      data: {
        status: "completed",
        serverNow,
        score: player.score,
        bestStreak: player.best_streak,
      },
    };
  }

  const pick = unseen[Math.floor(Math.random() * unseen.length)];
  return {
    ok: true,
    status: 200,
    data: {
      status: "playing",
      question: toPublicQuestion(pick),
      serverNow,
      deadline: player.deadline!,
      score: player.score,
      streak: player.streak,
      answeredCount: seen.size,
    },
  };
}

export interface SubmitAnswerInput {
  playerId: string | null | undefined;
  questionId: unknown;
  selectedIndex: unknown;
}

/** Validates an answer submission server-side, enforces idempotency, and updates player state. */
export async function submitAnswer(
  repo: GameRepository,
  input: SubmitAnswerInput,
  now: Date = new Date()
): Promise<ServiceResult<SubmitAnswerResponse>> {
  if (
    typeof input.questionId !== "string" ||
    input.questionId.trim().length === 0 ||
    typeof input.selectedIndex !== "number" ||
    !Number.isInteger(input.selectedIndex) ||
    input.selectedIndex < 0
  ) {
    return fail(400, "INVALID_INPUT", "Invalid questionId or selectedIndex.");
  }

  const ctx = await loadPlayingPlayerContext(repo, input.playerId, now);
  if (!ctx.ok) return ctx;

  const { player, session } = ctx;
  const question = await repo.getQuestionById(input.questionId);
  if (!question || !question.is_active || input.selectedIndex >= question.options.length) {
    return fail(400, "INVALID_INPUT", "Question or selected option is invalid.");
  }

  const serverNow = now.toISOString();
  const isCorrect = input.selectedIndex === question.correct_index;

  const insertStatus = await repo.insertPlayerAnswer({
    playerId: player.id,
    questionId: question.id,
    selectedIndex: input.selectedIndex,
    isCorrect,
    answeredAt: serverNow,
  });

  if (insertStatus === "duplicate") {
    return {
      ok: true,
      status: 200,
      data: {
        correct: false,
        alreadyAnswered: true,
        newScore: player.score,
        newStreak: player.streak,
        bestStreak: player.best_streak,
        streakBonusAwarded: 0,
        newDeadline: player.deadline!,
        serverNow,
        status: player.status,
      },
    };
  }

  const evaluated = evaluateAnswer({
    isCorrect,
    currentScore: player.score,
    currentStreak: player.streak,
    bestStreak: player.best_streak,
    currentDeadlineIso: player.deadline!,
    session,
  });

  const penaltyExpired = isDeadlineExpired(evaluated.newDeadline, now);
  const nextStatus = penaltyExpired ? "exploded" : "playing";

  await repo.updatePlayerProgress(player.id, {
    score: evaluated.newScore,
    correct_count: player.correct_count + (isCorrect ? 1 : 0),
    wrong_count: player.wrong_count + (isCorrect ? 0 : 1),
    streak: evaluated.newStreak,
    best_streak: evaluated.bestStreak,
    deadline: evaluated.newDeadline,
    ...(penaltyExpired ? { status: "exploded", finished_at: serverNow } : {}),
  });

  return {
    ok: true,
    status: 200,
    data: {
      correct: isCorrect,
      alreadyAnswered: false,
      newScore: evaluated.newScore,
      newStreak: evaluated.newStreak,
      bestStreak: evaluated.bestStreak,
      streakBonusAwarded: evaluated.streakBonusAwarded,
      newDeadline: evaluated.newDeadline,
      serverNow,
      status: nextStatus,
    },
  };
}
