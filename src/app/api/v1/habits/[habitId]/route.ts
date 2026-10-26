import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { archiveHabitForUser, HabitServiceError, updateHabitForUser } from "@/features/habits/application/habit-service";
import { updateHabitSchema } from "@/features/habits/domain/habit-schema";
import { requireVerifiedPrincipal, UnauthorizedError } from "@/features/auth/domain/session-policy";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const habitIdSchema = z.string().uuid();

function errorResponse(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status, headers: { "Cache-Control": "no-store" } });
}

function domainErrorResponse(error: unknown, requestId: string) {
  if (error instanceof UnauthorizedError) return errorResponse(401, "UNAUTHORIZED", "Entre na sua conta para continuar.", requestId);
  if (error instanceof HabitServiceError) {
    const message = error.code === "ACTIVE_HABIT_LIMIT"
      ? "Você pode manter até cinco hábitos ativos nesta jornada."
      : "Você precisa de uma jornada ativa para gerenciar hábitos.";
    return errorResponse(409, error.code, message, requestId);
  }
  return errorResponse(500, "INTERNAL_ERROR", "Não foi possível atualizar este hábito agora. Tente novamente.", requestId);
}

async function parseId(context: RouteContext<"/api/v1/habits/[habitId]">) {
  const { habitId } = await context.params;
  return habitIdSchema.safeParse(habitId);
}

async function parseBody(request: Request, requestId: string) {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false as const, error: errorResponse(400, "INVALID_CONTENT_TYPE", "Envie os dados em formato JSON.", requestId) };
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 16_384) return { ok: false as const, error: errorResponse(400, "PAYLOAD_TOO_LARGE", "O formulário excede o limite permitido.", requestId) };
  try {
    return { ok: true as const, body: JSON.parse(rawBody) as unknown };
  } catch {
    return { ok: false as const, error: errorResponse(400, "INVALID_JSON", "Não foi possível ler os dados enviados.", requestId) };
  }
}

export async function PATCH(request: Request, context: RouteContext<"/api/v1/habits/[habitId]">) {
  const requestId = randomUUID();
  const parsedId = await parseId(context);
  if (!parsedId.success) return errorResponse(400, "INVALID_HABIT_ID", "O identificador do hábito é inválido.", requestId);
  const parsedBody = await parseBody(request, requestId);
  if (!parsedBody.ok) return parsedBody.error;
  const parsed = updateHabitSchema.safeParse(parsedBody.body);
  if (!parsed.success) return errorResponse(422, "VALIDATION_ERROR", "Revise as informações do hábito.", requestId);

  try {
    const principal = requireVerifiedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await updateHabitForUser(createDb(), principal.id, parsedId.data, parsed.data);
    if (!data) return errorResponse(404, "HABIT_NOT_FOUND", "Hábito não encontrado.", requestId);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}

export async function DELETE(request: Request, context: RouteContext<"/api/v1/habits/[habitId]">) {
  const requestId = randomUUID();
  const parsedId = await parseId(context);
  if (!parsedId.success) return errorResponse(400, "INVALID_HABIT_ID", "O identificador do hábito é inválido.", requestId);

  try {
    const principal = requireVerifiedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await archiveHabitForUser(createDb(), principal.id, parsedId.data);
    if (!data) return errorResponse(404, "HABIT_NOT_FOUND", "Hábito não encontrado.", requestId);
    return NextResponse.json({ data: { ...data, status: "archived" } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}
