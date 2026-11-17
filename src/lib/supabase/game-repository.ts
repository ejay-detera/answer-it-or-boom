import type { AdminRepository, QuestionCreateInput } from "@/lib/admin-service";
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

/** Production Supabase implementation of `AdminRepository` using `service_role`. */
export function createSupabaseAdminRepository(): AdminRepository {
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

    async listPlayersBySession(sessionId) {
      const { data, error } = await db
        .from("players")
        .select("*")
        .eq("session_id", sessionId)
        .order("joined_at", { ascending: true })
        .returns<PlayerRow[]>();
      if (error) throw error;
      return data ?? [];
    },

    async startSession(sessionId, startedAtIso, deadlineIso) {
      const { data: session, error: sessErr } = await db
        .from("sessions")
        .update({
          status: "countdown",
          started_at: startedAtIso,
          lobby_locked: true,
        })
        .eq("id", sessionId)
        .select("*")
        .single<SessionRow>();
      if (sessErr) throw sessErr;

      const { error: playersErr } = await db
        .from("players")
        .update({ status: "playing", deadline: deadlineIso })
        .eq("session_id", sessionId)
        .eq("status", "waiting");
      if (playersErr) throw playersErr;

      return session;
    },

    async setLobbyLocked(sessionId, locked) {
      const { data, error } = await db
        .from("sessions")
        .update({ lobby_locked: locked })
        .eq("id", sessionId)
        .select("*")
        .single<SessionRow>();
      if (error) throw error;
      return data;
    },

    async endSessionEarly(sessionId, finishedAtIso) {
      const { error: playersErr } = await db
        .from("players")
        .update({ status: "exploded", finished_at: finishedAtIso })
        .eq("session_id", sessionId)
        .in("status", ["waiting", "playing"]);
      if (playersErr) throw playersErr;

      const { data: session, error: sessErr } = await db
        .from("sessions")
        .update({ status: "finished" })
        .eq("id", sessionId)
        .select("*")
        .single<SessionRow>();
      if (sessErr) throw sessErr;

      return session;
    },

    async resetSession(sessionId) {
      const { error: delErr } = await db
        .from("players")
        .delete()
        .eq("session_id", sessionId);
      if (delErr) throw delErr;

      const { data: session, error: sessErr } = await db
        .from("sessions")
        .update({
          status: "waiting",
          started_at: null,
          lobby_locked: false,
        })
        .eq("id", sessionId)
        .select("*")
        .single<SessionRow>();
      if (sessErr) throw sessErr;

      return session;
    },

    async deletePlayerById(playerId) {
      const { data, error } = await db
        .from("players")
        .delete()
        .eq("id", playerId)
        .select("id");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },

    async listAllQuestions() {
      const { data, error } = await db
        .from("questions")
        .select("id, question, options, correct_index, category, difficulty, is_active")
        .order("category", { ascending: true })
        .order("question", { ascending: true })
        .returns<QuestionRow[]>();
      if (error) throw error;
      return data ?? [];
    },

    async createQuestion(input: QuestionCreateInput) {
      const { data, error } = await db
        .from("questions")
        .insert(input)
        .select("*")
        .single<QuestionRow>();
      if (error) throw error;
      return data;
    },

    async updateQuestion(id, patch) {
      const { data, error } = await db
        .from("questions")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle<QuestionRow>();
      if (error) throw error;
      return data;
    },

    async deleteQuestion(id) {
      const { data, error } = await db
        .from("questions")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  };
}
