import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createHabitForUser, HabitServiceError, listHabitsForUser } from "@/features/habits/application/habit-service";
import { createHabitSchema } from "@/features/habits/domain/habit-schema";
import { requireAuthenticatedPrincipal, UnauthorizedError } from "@/features/auth/domain/session-policy";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  return errorResponse(500, "INTERNAL_ERROR", "Não foi possível atualizar seus hábitos agora. Tente novamente.", requestId);
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

export async function GET(request: Request) {
  const requestId = randomUUID();
  const url = new URL(request.url);
  const includeArchivedValue = url.searchParams.get("includeArchived");
  if (includeArchivedValue !== null && includeArchivedValue !== "true" && includeArchivedValue !== "false") {
    return errorResponse(400, "INVALID_QUERY", "O filtro de hábitos arquivados é inválido.", requestId);
  }

  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await listHabitsForUser(createDb(), principal.id, includeArchivedValue === "true");
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const parsedBody = await parseBody(request, requestId);
  if (!parsedBody.ok) return parsedBody.error;
  const parsed = createHabitSchema.safeParse(parsedBody.body);
  if (!parsed.success) return errorResponse(422, "VALIDATION_ERROR", "Revise o nome e os dias escolhidos para o hábito.", requestId);

  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await createHabitForUser(createDb(), principal.id, parsed.data);
    return NextResponse.json({ data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}
