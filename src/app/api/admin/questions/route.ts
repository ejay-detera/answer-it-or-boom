import { NextResponse } from "next/server";
import {
  createAdminQuestion,
  deleteAdminQuestion,
  updateAdminQuestion,
} from "@/lib/admin-service";
import { apiError, fromServiceResult, requireAdmin } from "@/lib/http";
import { createSupabaseAdminRepository } from "@/lib/supabase/game-repository";

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const repo = createSupabaseAdminRepository();
    const questions = await repo.listAllQuestions();
    return NextResponse.json({ questions }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/admin/questions]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to load questions.");
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_INPUT", "Invalid JSON payload.");
  }

  try {
    const repo = createSupabaseAdminRepository();
    const result = await createAdminQuestion(repo, body);
    return fromServiceResult(result);
  } catch (err) {
    console.error("[POST /api/admin/questions]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to create question.");
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_INPUT", "Invalid JSON payload.");
  }

  try {
    const repo = createSupabaseAdminRepository();
    const result = await updateAdminQuestion(repo, body);
    return fromServiceResult(result);
  } catch (err) {
    console.error("[PATCH /api/admin/questions]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to update question.");
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const queryId = url.searchParams.get("id");
  let id: unknown = queryId;

  if (!id) {
    try {
      const body = (await request.json()) as { id?: unknown };
      id = body?.id;
    } catch {
      id = null;
    }
  }

  try {
    const repo = createSupabaseAdminRepository();
    const result = await deleteAdminQuestion(repo, id);
    return fromServiceResult(result);
  } catch (err) {
    console.error("[DELETE /api/admin/questions]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to delete question.");
  }
}
