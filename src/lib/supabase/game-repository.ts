import type { GameRepository, PlayerProgressPatch } from "@/lib/game-service";
import { createServiceClient } from "@/lib/supabase/server";
import type { PlayerRow, QuestionRow, SessionRow } from "@/types/game";

/** Production Supabase implementation of `GameRepository` using `service_role`. */
export function createSupabaseGameRepository(): GameRepository {
  const db = createServiceClient();

  return {
    async getLatestSession() {
      const { data, error } = await db
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<SessionRow>();
      if (error) throw error;
      return data;
    },

    async getSessionById(sessionId) {
      const { data, error } = await db
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle<SessionRow>();
      if (error) throw error;
      return data;
    },

    async getPlayerById(playerId) {
      const { data, error } = await db
        .from("players")
        .select("*")
        .eq("id", playerId)
        .maybeSingle<PlayerRow>();
      if (error) throw error;
      return data;
    },

    async createPlayer(sessionId, name) {
      const { data, error } = await db
        .from("players")
        .insert({ session_id: sessionId, name })
        .select("*")
        .single<PlayerRow>();
      if (error) throw error;
      return data;
    },

    async listActiveQuestions() {
      const { data, error } = await db
        .from("questions")
        .select("id, question, options, correct_index, category, difficulty, is_active")
        .eq("is_active", true)
        .returns<QuestionRow[]>();
      if (error) throw error;
      return data ?? [];
    },

    async getQuestionById(questionId) {
      const { data, error } = await db
        .from("questions")
        .select("id, question, options, correct_index, category, difficulty, is_active")
        .eq("id", questionId)
        .maybeSingle<QuestionRow>();
      if (error) throw error;
      return data;
    },

    async listAnsweredQuestionIds(playerId) {
      const { data, error } = await db
        .from("player_answers")
        .select("question_id")
        .eq("player_id", playerId)
        .returns<Array<{ question_id: string }>>();
      if (error) throw error;
      return (data ?? []).map((row) => row.question_id);
    },

    async insertPlayerAnswer(row) {
      const { error } = await db.from("player_answers").insert({
        player_id: row.playerId,
        question_id: row.questionId,
        selected_index: row.selectedIndex,
        is_correct: row.isCorrect,
        answered_at: row.answeredAt,
      });
      if (error) {
        if (error.code === "23505") return "duplicate";
        throw error;
      }
      return "inserted";
    },

    async updatePlayerProgress(playerId, patch: PlayerProgressPatch) {
      const { data, error } = await db
        .from("players")
        .update(patch)
        .eq("id", playerId)
        .select("*")
        .single<PlayerRow>();
      if (error) throw error;
      return data;
    },
  };
}
