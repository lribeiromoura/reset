import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CompletionConflictError, completeHabitForToday, HabitNotFoundError, uncompleteHabitForToday } from "@/features/habits/application/completion-service";
import { requireAuthenticatedPrincipal, UnauthorizedError } from "@/features/auth/domain/session-policy";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const habitIdSchema = z.string().uuid();
const emptyBodySchema = z.object({}).strict();

function errorResponse(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status, headers: { "Cache-Control": "no-store" } });
}

function domainErrorResponse(error: unknown, requestId: string) {
  if (error instanceof UnauthorizedError) return errorResponse(401, "UNAUTHORIZED", "Entre na sua conta para continuar.", requestId);
  if (error instanceof HabitNotFoundError) return errorResponse(404, "HABIT_NOT_FOUND", "Hábito não encontrado.", requestId);
  if (error instanceof CompletionConflictError) {
    const message = error.code === "NO_ACTIVE_JOURNEY"
      ? "Você não tem uma jornada ativa para registrar esta missão."
      : "Este hábito não está previsto para hoje.";
    return errorResponse(409, error.code, message, requestId);
  }
  return errorResponse(500, "INTERNAL_ERROR", "Não foi possível atualizar esta missão agora. Tente novamente.", requestId);
}

async function parseHabitId(context: RouteContext<"/api/v1/habits/[habitId]/completions/today">) {
  const { habitId } = await context.params;
  return habitIdSchema.safeParse(habitId);
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/habits/[habitId]/completions/today">,
) {
  const requestId = randomUUID();
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return errorResponse(400, "INVALID_CONTENT_TYPE", "Envie os dados em formato JSON.", requestId);

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 16_384) return errorResponse(400, "PAYLOAD_TOO_LARGE", "O formulário excede o limite permitido.", requestId);

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse(400, "INVALID_JSON", "Não foi possível ler os dados enviados.", requestId);
  }
  if (!emptyBodySchema.safeParse(body).success) return errorResponse(422, "VALIDATION_ERROR", "A conclusão não precisa de dados adicionais.", requestId);

  const parsedHabitId = await parseHabitId(context);
  if (!parsedHabitId.success) return errorResponse(400, "INVALID_HABIT_ID", "O identificador do hábito é inválido.", requestId);

  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await completeHabitForToday(createDb(), principal.id, parsedHabitId.data);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/v1/habits/[habitId]/completions/today">,
) {
  const requestId = randomUUID();
  const parsedHabitId = await parseHabitId(context);
  if (!parsedHabitId.success) return errorResponse(400, "INVALID_HABIT_ID", "O identificador do hábito é inválido.", requestId);

  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await uncompleteHabitForToday(createDb(), principal.id, parsedHabitId.data);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}
