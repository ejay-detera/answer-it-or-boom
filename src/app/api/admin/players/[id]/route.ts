import { NextResponse } from "next/server";
import { kickAdminPlayer } from "@/lib/admin-service";
import { apiError, fromServiceResult, requireAdmin } from "@/lib/http";
import { createSupabaseAdminRepository } from "@/lib/supabase/game-repository";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  try {
    const repo = createSupabaseAdminRepository();
    const result = await kickAdminPlayer(repo, id);
    return fromServiceResult(result);
  } catch (err) {
    console.error("[DELETE /api/admin/players/[id]]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to remove player.");
  }
}
