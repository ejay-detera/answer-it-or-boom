import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentPlayerState } from "@/lib/game-service";
import { apiError, fromServiceResult, PLAYER_COOKIE_NAME } from "@/lib/http";
import { createSupabaseGameRepository } from "@/lib/supabase/game-repository";

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const playerId = cookieStore.get(PLAYER_COOKIE_NAME)?.value;

  try {
    const repo = createSupabaseGameRepository();
    const result = await getCurrentPlayerState(repo, playerId);
    const response = fromServiceResult(result);

    if (result.ok && playerId && !result.data.player) {
      response.cookies.delete(PLAYER_COOKIE_NAME);
    }

    return response;
  } catch (err) {
    console.error("[GET /api/session/me]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to load session state.");
  }
}
