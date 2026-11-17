import { NextResponse } from "next/server";
import { joinSession } from "@/lib/game-service";
import { apiError, fromServiceResult, PLAYER_COOKIE_NAME } from "@/lib/http";
import { createSupabaseGameRepository } from "@/lib/supabase/game-repository";

export async function POST(request: Request): Promise<NextResponse> {
  let body: { name?: unknown };
  try {
    body = (await request.json()) as { name?: unknown };
  } catch {
    return apiError(400, "INVALID_INPUT", "Invalid JSON payload.");
  }

  try {
    const repo = createSupabaseGameRepository();
    const result = await joinSession(repo, body?.name);
    const response = fromServiceResult(result);

    if (result.ok) {
      response.cookies.set(PLAYER_COOKIE_NAME, result.data.playerId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 12,
      });
    }

    return response;
  } catch (err) {
    console.error("[POST /api/session/join]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to join session right now.");
  }
}
