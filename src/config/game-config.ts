export const GAME_CONFIG = {
  baseTimeSeconds: 120,
  bonusTimeSeconds: 30,
  pointsPerCorrect: 10,
  wrongAnswerPenaltySeconds: 10,
  countdownSeconds: 3,
  playerNameMin: 2,
  playerNameMax: 20,
  streakMilestones: [
    { streak: 3, bonus: 5 },
    { streak: 5, bonus: 10 },
    { streak: 10, bonus: 20 },
  ] as const,
} as const;
