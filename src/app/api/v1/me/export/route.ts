import { randomUUID } from "node:crypto";
import { asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthenticatedPrincipal, UnauthorizedError } from "@/features/auth/domain/session-policy";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { dailyReflections, habitCompletions, habitScheduleVersions, habits, journeys, userProfiles } from "@/lib/db/domain-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const principal = requireAuthenticatedPrincipal(await auth.api.getSession({ headers: request.headers }));
    const db = createDb();
    const [identity] = await db.select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
      .from(user).where(eq(user.id, principal.id)).limit(1);
    if (!identity) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Conta não encontrada.", requestId } }, { status: 404, headers: { "Cache-Control": "no-store" } });

    const [profile, userJourneys, userHabits, completions, reflections] = await Promise.all([
      db.select().from(userProfiles).where(eq(userProfiles.userId, principal.id)).limit(1),
      db.select().from(journeys).where(eq(journeys.userId, principal.id)).orderBy(asc(journeys.startDate)),
      db.select().from(habits).where(eq(habits.userId, principal.id)).orderBy(asc(habits.createdAt)),
      db.select().from(habitCompletions).where(eq(habitCompletions.userId, principal.id)).orderBy(asc(habitCompletions.localDate)),
      db.select().from(dailyReflections).where(eq(dailyReflections.userId, principal.id)).orderBy(asc(dailyReflections.localDate)),
    ]);
    const habitIds = userHabits.map((habit) => habit.id);
    const schedules = habitIds.length
      ? await db.select().from(habitScheduleVersions).where(inArray(habitScheduleVersions.habitId, habitIds)).orderBy(asc(habitScheduleVersions.effectiveFrom))
      : [];

    return new NextResponse(JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      account: identity,
      profile: profile[0] ?? null,
      journeys: userJourneys,
      habits: userHabits,
      habitScheduleVersions: schedules,
      habitCompletions: completions,
      dailyReflections: reflections,
    }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="reset-dados-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Entre na sua conta para continuar.", requestId } }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Não foi possível exportar seus dados agora.", requestId } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
