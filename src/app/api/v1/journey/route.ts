import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { requireAuthenticatedPrincipal, UnauthorizedError } from "@/features/auth/domain/session-policy";
import { createJourneyForUser, getJourneyOverview, JourneyConflictError } from "@/features/journey/application/journey-service";
import { onboardingSchema } from "@/features/journey/domain/onboarding-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json({ error: { code, message, requestId } }, { status, headers: { "Cache-Control": "no-store" } });
}

async function getPrincipal(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return requireAuthenticatedPrincipal(session);
}

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const principal = await getPrincipal(request);
    const data = await getJourneyOverview(createDb(), principal.id);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorResponse(401, "UNAUTHORIZED", "Entre na sua conta para continuar.", requestId);
    return errorResponse(500, "INTERNAL_ERROR", "Não foi possível carregar sua jornada agora.", requestId);
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
      return errorResponse(400, "INVALID_CONTENT_TYPE", "Envie os dados em formato JSON.", requestId);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
      return errorResponse(400, "PAYLOAD_TOO_LARGE", "O formulário excede o limite permitido.", requestId);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse(400, "INVALID_JSON", "Não foi possível ler os dados enviados.", requestId);
    }

    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(422, "VALIDATION_ERROR", "Revise os campos do seu objetivo e dos hábitos.", requestId);
    }

    const principal = await getPrincipal(request);
    const data = await createJourneyForUser(createDb(), principal.id, parsed.data);
    return NextResponse.json({ data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorResponse(401, "UNAUTHORIZED", "Entre na sua conta para continuar.", requestId);
    if (error instanceof JourneyConflictError) {
      const isActive = error.code === "JOURNEY_ALREADY_ACTIVE";
      return errorResponse(409, error.code, isActive ? "Você já tem uma jornada ativa." : "Sua configuração já foi concluída.", requestId);
    }
    if (hasUniqueViolation(error)) {
      return errorResponse(409, "JOURNEY_ALREADY_ACTIVE", "Você já tem uma jornada ativa.", requestId);
    }
    return errorResponse(500, "INTERNAL_ERROR", "Não foi possível iniciar sua jornada agora. Tente novamente.", requestId);
  }
}

function hasUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}
