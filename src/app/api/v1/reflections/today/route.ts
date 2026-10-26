import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { deleteReflectionForToday, getReflectionForToday, saveReflectionForToday } from "@/features/journal/application/reflection-service";
import { reflectionSchema } from "@/features/journal/domain/reflection-schema";
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
  if (error instanceof Error && error.message === "ONBOARDING_REQUIRED") return errorResponse(409, "ONBOARDING_REQUIRED", "Conclua sua configuração inicial antes de salvar uma reflexão.", requestId);
  return errorResponse(500, "INTERNAL_ERROR", "Não foi possível atualizar sua reflexão agora. Tente novamente.", requestId);
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
  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await getReflectionForToday(createDb(), principal.id);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}

export async function PUT(request: Request) {
  const requestId = randomUUID();
  const parsedBody = await parseBody(request, requestId);
  if (!parsedBody.ok) return parsedBody.error;
  const parsed = reflectionSchema.safeParse(parsedBody.body);
  if (!parsed.success) return errorResponse(422, "VALIDATION_ERROR", "Escolha um humor e limite sua reflexão a 500 caracteres.", requestId);

  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await saveReflectionForToday(createDb(), principal.id, parsed.data);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}

export async function DELETE(request: Request) {
  const requestId = randomUUID();
  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await deleteReflectionForToday(createDb(), principal.id);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return domainErrorResponse(error, requestId);
  }
}
