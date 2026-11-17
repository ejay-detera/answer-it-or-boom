import { NextResponse } from "next/server";
import type { ServiceResult } from "@/lib/game-service";
import type { ApiErrorCode, ApiErrorEnvelope } from "@/types/game";

export const PLAYER_COOKIE_NAME = "boom_player_id";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function fromServiceResult<T>(result: ServiceResult<T>): NextResponse {
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json(result.data, { status: result.status });
}
