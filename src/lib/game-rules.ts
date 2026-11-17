import { GAME_CONFIG } from "@/config/game-config";
import type { PlayerRow, SessionRow } from "@/types/game";

export interface EvaluateAnswerInput {
  isCorrect: boolean;
  currentScore: number;
  currentStreak: number;
  bestStreak: number;
  currentDeadlineIso: string;
  session: Pick<
    SessionRow,
    "points_per_correct" | "bonus_time_seconds" | "wrong_answer_penalty_seconds"
  >;
}

export interface EvaluateAnswerResult {
  newScore: number;
  newStreak: number;
  bestStreak: number;
  streakBonusAwarded: number;
  newDeadline: string;
}

/** Returns true when `deadlineIso` is missing, invalid, or strictly earlier than `now`. */
export function isDeadlineExpired(
  deadlineIso: string | null,
  now: Date
): boolean {
  if (!deadlineIso) return true;
  const deadlineMs = Date.parse(deadlineIso);
  if (Number.isNaN(deadlineMs)) return true;
  return now.getTime() > deadlineMs;
}

/** Computes updated score, one-time milestone streak bonus, and deadline after an answer. */
export function evaluateAnswer(
  input: EvaluateAnswerInput
): EvaluateAnswerResult {
  const deadlineMs = Date.parse(input.currentDeadlineIso);

  if (!input.isCorrect) {
    const penaltyMs = input.session.wrong_answer_penalty_seconds * 1000;
    return {
      newScore: input.currentScore,
      newStreak: 0,
      bestStreak: input.bestStreak,
      streakBonusAwarded: 0,
      newDeadline: new Date(deadlineMs - penaltyMs).toISOString(),
    };
  }

  const newStreak = input.currentStreak + 1;
  const bestStreak = Math.max(input.bestStreak, newStreak);
  const milestone = GAME_CONFIG.streakMilestones.find(
    (entry) => entry.streak === newStreak && input.bestStreak < entry.streak
  );
  const streakBonusAwarded = milestone ? milestone.bonus : 0;

  return {
    newScore: input.currentScore + input.session.points_per_correct + streakBonusAwarded,
    newStreak,
    bestStreak,
    streakBonusAwarded,
    newDeadline: new Date(
      deadlineMs + input.session.bonus_time_seconds * 1000
    ).toISOString(),
  };
}

function getSurvivalMs(
  player: PlayerRow,
  sessionStartedAtIso: string | null,
  fallbackNowMs?: number
): number {
  const startMs = sessionStartedAtIso
    ? Date.parse(sessionStartedAtIso)
    : Date.parse(player.joined_at);
  const endMs = player.finished_at
    ? Date.parse(player.finished_at)
    : (fallbackNowMs ?? Date.parse(player.deadline ?? player.joined_at));
  return Math.max(0, endMs - startMs);
}

/** Ranks players by score DESC, correct_count DESC, then longest survival time DESC. */
export function rankPlayers(
  players: readonly PlayerRow[],
  sessionStartedAtIso: string | null,
  now?: Date
): PlayerRow[] {
  const fallbackNowMs = now?.getTime();
  return [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correct_count !== a.correct_count) {
      return b.correct_count - a.correct_count;
    }
    const survivalDiff =
      getSurvivalMs(b, sessionStartedAtIso, fallbackNowMs) -
      getSurvivalMs(a, sessionStartedAtIso, fallbackNowMs);
    if (survivalDiff !== 0) return survivalDiff;
    const joinedDiff = Date.parse(a.joined_at) - Date.parse(b.joined_at);
    return joinedDiff !== 0 ? joinedDiff : a.id.localeCompare(b.id);
  });
}
