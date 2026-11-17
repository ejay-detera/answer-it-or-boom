import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/game-service";
import { apiError, fromServiceResult, PLAYER_COOKIE_NAME } from "@/lib/http";
import { createSupabaseGameRepository } from "@/lib/supabase/game-repository";

export async function POST(request: Request): Promise<NextResponse> {
  let body: { questionId?: unknown; selectedIndex?: unknown };
  try {
    body = (await request.json()) as {
      questionId?: unknown;
      selectedIndex?: unknown;
    };
  } catch {
    return apiError(400, "INVALID_INPUT", "Invalid JSON payload.");
  }

  const cookieStore = await cookies();
  const playerId = cookieStore.get(PLAYER_COOKIE_NAME)?.value;

  try {
    const repo = createSupabaseGameRepository();
    const result = await submitAnswer(repo, {
      playerId,
      questionId: body?.questionId,
      selectedIndex: body?.selectedIndex,
    });
    return fromServiceResult(result);
  } catch (err) {
    console.error("[POST /api/play/answer]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to record answer.");
  }
}
