import { describe, expect, it } from "vitest";
import { evaluateAnswer, isDeadlineExpired, rankPlayers } from "@/lib/game-rules";
import type { PlayerRow } from "@/types/game";

const baseSession = {
  points_per_correct: 10,
  bonus_time_seconds: 30,
  wrong_answer_penalty_seconds: 0,
};

describe("isDeadlineExpired (T-001)", () => {
  it("returns false when now <= deadline and true when now > deadline", () => {
    const deadline = "2026-11-17T12:02:00.000Z";
    expect(isDeadlineExpired(deadline, new Date("2026-11-17T12:01:59.999Z"))).toBe(false);
    expect(isDeadlineExpired(deadline, new Date("2026-11-17T12:02:00.000Z"))).toBe(false);
    expect(isDeadlineExpired(deadline, new Date("2026-11-17T12:02:00.001Z"))).toBe(true);
    expect(isDeadlineExpired(null, new Date("2026-11-17T12:02:00.000Z"))).toBe(true);
  });
});

describe("evaluateAnswer (T-001)", () => {
  it("awards +10 points and +30s on a correct answer", () => {
    const result = evaluateAnswer({
      isCorrect: true,
      currentScore: 0,
      currentStreak: 0,
      bestStreak: 0,
      currentDeadlineIso: "2026-11-17T12:02:00.000Z",
      session: baseSession,
    });

    expect(result).toEqual({
      newScore: 10,
      newStreak: 1,
      bestStreak: 1,
      streakBonusAwarded: 0,
      penaltySecondsApplied: 0,
      consecutiveWrongCount: 0,
      newDeadline: "2026-11-17T12:02:30.000Z",
    });
  });

  it("awards one-time streak bonuses at 3 (+5), 5 (+10), and 10 (+20) without repeating after reset", () => {
    // First time reaching streak 3 -> +5
    const hit3 = evaluateAnswer({
      isCorrect: true,
      currentScore: 20,
      currentStreak: 2,
      bestStreak: 2,
      currentDeadlineIso: "2026-11-17T12:02:00.000Z",
      session: baseSession,
    });
    expect(hit3.streakBonusAwarded).toBe(5);
    expect(hit3.newScore).toBe(35);
    expect(hit3.bestStreak).toBe(3);

    // Wrong answer resets streak, keeps bestStreak=3
    const wrong = evaluateAnswer({
      isCorrect: false,
      currentScore: 35,
      currentStreak: 3,
      bestStreak: 3,
      currentDeadlineIso: "2026-11-17T12:02:30.000Z",
      session: baseSession,
    });
    expect(wrong.newStreak).toBe(0);
    expect(wrong.bestStreak).toBe(3);
    expect(wrong.newScore).toBe(35);

    // Reaching streak 3 a second time does NOT award +5 again
    const secondHit3 = evaluateAnswer({
      isCorrect: true,
      currentScore: 55,
      currentStreak: 2,
      bestStreak: 3,
      currentDeadlineIso: "2026-11-17T12:03:00.000Z",
      session: baseSession,
    });
    expect(secondHit3.streakBonusAwarded).toBe(0);
    expect(secondHit3.newScore).toBe(65);

    // First time reaching streak 5 -> +10; streak 10 -> +20
    const hit5 = evaluateAnswer({
      isCorrect: true,
      currentScore: 75,
      currentStreak: 4,
      bestStreak: 4,
      currentDeadlineIso: "2026-11-17T12:03:30.000Z",
      session: baseSession,
    });
    expect(hit5.streakBonusAwarded).toBe(10);
    expect(hit5.newScore).toBe(95);

    const hit10 = evaluateAnswer({
      isCorrect: true,
      currentScore: 135,
      currentStreak: 9,
      bestStreak: 9,
      currentDeadlineIso: "2026-11-17T12:05:00.000Z",
      session: baseSession,
    });
    expect(hit10.streakBonusAwarded).toBe(20);
    expect(hit10.newScore).toBe(165);
  });

  it("applies accumulating wrong-answer penalty (-10s, -20s, -30s) and resets after a correct answer", () => {
    const wrong1 = evaluateAnswer({
      isCorrect: false,
      currentScore: 10,
      currentStreak: 1,
      bestStreak: 1,
      consecutiveWrongCount: 0,
      currentDeadlineIso: "2026-11-17T12:02:00.000Z",
      session: baseSession,
    });
    expect(wrong1.penaltySecondsApplied).toBe(10);
    expect(wrong1.consecutiveWrongCount).toBe(1);
    expect(wrong1.newDeadline).toBe("2026-11-17T12:01:50.000Z");

    const wrong2 = evaluateAnswer({
      isCorrect: false,
      currentScore: 10,
      currentStreak: 0,
      bestStreak: 1,
      consecutiveWrongCount: wrong1.consecutiveWrongCount,
      currentDeadlineIso: wrong1.newDeadline,
      session: baseSession,
    });
    expect(wrong2.penaltySecondsApplied).toBe(20);
    expect(wrong2.consecutiveWrongCount).toBe(2);
    expect(wrong2.newDeadline).toBe("2026-11-17T12:01:30.000Z");

    const right = evaluateAnswer({
      isCorrect: true,
      currentScore: 10,
      currentStreak: 0,
      bestStreak: 1,
      consecutiveWrongCount: wrong2.consecutiveWrongCount,
      currentDeadlineIso: wrong2.newDeadline,
      session: baseSession,
    });
    expect(right.penaltySecondsApplied).toBe(0);
    expect(right.consecutiveWrongCount).toBe(0);
    expect(right.newDeadline).toBe("2026-11-17T12:02:00.000Z");
  });

  it("applies custom positive wrong_answer_penalty_seconds when configured", () => {
    const result = evaluateAnswer({
      isCorrect: false,
      currentScore: 10,
      currentStreak: 1,
      bestStreak: 1,
      consecutiveWrongCount: 1,
      currentDeadlineIso: "2026-11-17T12:02:00.000Z",
      session: { ...baseSession, wrong_answer_penalty_seconds: 5 },
    });

    expect(result.penaltySecondsApplied).toBe(10);
    expect(result.consecutiveWrongCount).toBe(2);
    expect(result.newDeadline).toBe("2026-11-17T12:01:50.000Z");
    expect(result.newScore).toBe(10);
    expect(result.newStreak).toBe(0);
  });
});

describe("rankPlayers (tie-breaker)", () => {
  const makePlayer = (overrides: Partial<PlayerRow>): PlayerRow => ({
    id: "p1",
    session_id: "s1",
    name: "Cadet",
    score: 0,
    correct_count: 0,
    wrong_count: 0,
    streak: 0,
    best_streak: 0,
    deadline: "2026-11-17T12:02:00.000Z",
    status: "exploded",
    finished_at: "2026-11-17T12:02:00.000Z",
    joined_at: "2026-11-17T11:59:00.000Z",
    ...overrides,
  });

  it("ranks by score DESC, then correct_count DESC, then longest survival_time DESC", () => {
    const startedAt = "2026-11-17T12:00:00.000Z";
    const now = new Date("2026-11-17T12:04:00.000Z");
    const players = [
      makePlayer({ id: "short-tie", score: 50, correct_count: 5, finished_at: "2026-11-17T12:02:30.000Z" }),
      makePlayer({ id: "long-tie", score: 50, correct_count: 5, finished_at: "2026-11-17T12:03:10.000Z" }),
      makePlayer({ id: "more-correct", score: 50, correct_count: 6, finished_at: "2026-11-17T12:02:00.000Z" }),
      makePlayer({ id: "top-score", score: 80, correct_count: 7, finished_at: "2026-11-17T12:02:00.000Z" }),
    ];

    expect(rankPlayers(players, startedAt, now).map((p) => p.id)).toEqual([
      "top-score",
      "more-correct",
      "long-tie",
      "short-tie",
    ]);
  });
});
