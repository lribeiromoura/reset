import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAccountProfile, updateAccountProfile } from "@/features/account/application/profile-service";
import { profileUpdateSchema } from "@/features/account/domain/profile-schema";
import { requireVerifiedPrincipal, UnauthorizedError } from "@/features/auth/domain/session-policy";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status, headers: { "Cache-Control": "no-store" } });
}

async function parseBody(request: Request, requestId: string) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return { ok: false as const, response: errorResponse(400, "INVALID_CONTENT_TYPE", "Envie os dados em formato JSON.", requestId) };
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 16_384) {
    return { ok: false as const, response: errorResponse(400, "PAYLOAD_TOO_LARGE", "O formulário excede o limite permitido.", requestId) };
  }
  try {
    return { ok: true as const, body: JSON.parse(body) as unknown };
  } catch {
    return { ok: false as const, response: errorResponse(400, "INVALID_JSON", "Não foi possível ler os dados enviados.", requestId) };
  }
}

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const principal = requireVerifiedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await getAccountProfile(createDb(), principal.id);
    if (!data) return errorResponse(404, "NOT_FOUND", "Perfil não encontrado.", requestId);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorResponse(401, "UNAUTHORIZED", "Entre na sua conta para continuar.", requestId);
    return errorResponse(500, "INTERNAL_ERROR", "Não foi possível carregar seu perfil agora.", requestId);
  }
}

export async function PATCH(request: Request) {
  const requestId = randomUUID();
  const parsedBody = await parseBody(request, requestId);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = profileUpdateSchema.safeParse(parsedBody.body);
  if (!parsed.success) return errorResponse(422, "VALIDATION_ERROR", "Confira o nome e o fuso horário informados.", requestId);
  try {
    const principal = requireVerifiedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const data = await updateAccountProfile(createDb(), principal.id, parsed.data);
    if (!data) return errorResponse(404, "NOT_FOUND", "Perfil não encontrado.", requestId);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorResponse(401, "UNAUTHORIZED", "Entre na sua conta para continuar.", requestId);
    return errorResponse(500, "INTERNAL_ERROR", "Não foi possível salvar seu perfil agora.", requestId);
  }
}
