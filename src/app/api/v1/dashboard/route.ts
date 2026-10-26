import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getTodayDashboard } from "@/features/habits/application/completion-service";
import { requireVerifiedPrincipal, UnauthorizedError } from "@/features/auth/domain/session-policy";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const principal = requireVerifiedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await getTodayDashboard(createDb(), principal.id);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorResponse(401, "UNAUTHORIZED", "Entre na sua conta para continuar.", requestId);
    return errorResponse(500, "INTERNAL_ERROR", "Não foi possível carregar seu dia agora. Tente novamente.", requestId);
  }
}
