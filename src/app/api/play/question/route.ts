import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getNextQuestion } from "@/lib/game-service";
import { apiError, fromServiceResult, PLAYER_COOKIE_NAME } from "@/lib/http";
import { createSupabaseGameRepository } from "@/lib/supabase/game-repository";

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(PLAYER_COOKIE_NAME)?.value;

  try {
    const repo = createSupabaseGameRepository();
    const result = await getNextQuestion(repo, playerId);
    return fromServiceResult(result);
  } catch (err) {
    console.error("[GET /api/play/question]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to load question.");
  }
}
