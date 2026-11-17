export type SessionStatus = "waiting" | "countdown" | "running" | "finished";

export type PlayerStatus = "waiting" | "playing" | "exploded" | "completed";

export type QuestionCategory = "software" | "general" | "fun";

export type QuestionDifficulty = "easy" | "medium";

export interface SessionRow {
  id: string;
  status: SessionStatus;
  base_time_seconds: number;
  bonus_time_seconds: number;
  points_per_correct: number;
  wrong_answer_penalty_seconds: number;
  lobby_locked: boolean;
  started_at: string | null;
  created_at: string;
}

export interface PlayerRow {
  id: string;
  session_id: string;
  name: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  streak: number;
  best_streak: number;
  deadline: string | null;
  status: PlayerStatus;
  finished_at: string | null;
  joined_at: string;
}

export interface QuestionRow {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  is_active: boolean;
}

/** Client-safe question payload; never includes `correct_index`. */
export type PublicQuestion = Pick<
  QuestionRow,
  "id" | "question" | "options" | "category" | "difficulty"
>;

export interface PlayerAnswerRow {
  id: string;
  player_id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
  answered_at: string;
}

export type ApiErrorCode =
  | "INVALID_NAME"
  | "DUPLICATE_NAME"
  | "LOBBY_LOCKED"
  | "TIME_EXPIRED"
  | "ALREADY_PLAYED"
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "NO_SESSION"
  | "NOT_RUNNING"
  | "INTERNAL_ERROR";

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface JoinSessionResponse {
  playerId: string;
  sessionId: string;
  name: string;
  status: PlayerStatus;
}

export type NextQuestionResponse =
  | {
      status: "playing";
      question: PublicQuestion;
      serverNow: string;
      deadline: string;
      score: number;
      streak: number;
      answeredCount: number;
    }
  | {
      status: "completed";
      serverNow: string;
      score: number;
      bestStreak: number;
    };

export interface SubmitAnswerResponse {
  correct: boolean;
  alreadyAnswered: boolean;
  newScore: number;
  newStreak: number;
  bestStreak: number;
  streakBonusAwarded: number;
  newDeadline: string;
  serverNow: string;
  status: PlayerStatus;
}
