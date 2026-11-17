import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminPasscode,
} from "@/lib/admin-auth";
import { apiError } from "@/lib/http";

export async function POST(request: Request): Promise<NextResponse> {
  let body: { passcode?: unknown };
  try {
    body = (await request.json()) as { passcode?: unknown };
  } catch {
    return apiError(400, "INVALID_INPUT", "Invalid JSON payload.");
  }

  try {
    if (!verifyAdminPasscode(body?.passcode)) {
      return apiError(401, "UNAUTHORIZED", "Invalid facilitator passcode.");
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (err) {
    console.error("[POST /api/admin/login]", err);
    return apiError(500, "INTERNAL_ERROR", "Unable to verify passcode.");
  }
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
