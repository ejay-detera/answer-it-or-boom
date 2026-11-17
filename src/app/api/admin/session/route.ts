import { NextResponse } from "next/server";
import { runAdminSessionAction } from "@/lib/admin-service";
import { apiError, fromServiceResult, requireAdmin } from "@/lib/http";
import { createSupabaseAdminRepository } from "@/lib/supabase/game-repository";

export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { action?: unknown };
  try {
    body = (await request.json()) as { action?: unknown };
  } catch {
    return apiError(400, "INVALID_INPUT", "Invalid JSON payload.");
  }

  try {
    const repo = createSupabaseAdminRepository();
    const result = await runAdminSessionAction(repo, body?.action);
    return fromServiceResult(result);
  } catch (err) {
    console.error("[POST /api/admin/session]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to update session.");
  }
}
