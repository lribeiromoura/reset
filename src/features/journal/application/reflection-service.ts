import { and, eq } from "drizzle-orm";
import { createDb } from "@/lib/db";
import { dailyReflections, userProfiles } from "@/lib/db/domain-schema";
import { getLocalDate } from "@/features/journey/domain/calendar";
import type { ReflectionInput } from "@/features/journal/domain/reflection-schema";

type Database = ReturnType<typeof createDb>;

async function getReflectionContext(db: Database, userId: string, now: Date) {
  const [profile] = await db.select({ timezone: userProfiles.timezone })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  return { localDate: getLocalDate(timezone, now), hasProfile: Boolean(profile) };
}

export async function getReflectionForToday(db: Database, userId: string, now = new Date()) {
  const { localDate, hasProfile } = await getReflectionContext(db, userId, now);
  if (!hasProfile) return { localDate, reflection: null };

  const [reflection] = await db.select({
    id: dailyReflections.id,
    localDate: dailyReflections.localDate,
    mood: dailyReflections.mood,
    text: dailyReflections.text,
    updatedAt: dailyReflections.updatedAt,
  }).from(dailyReflections).where(and(
    eq(dailyReflections.userId, userId),
    eq(dailyReflections.localDate, localDate),
  )).limit(1);

  return { localDate, reflection: reflection ?? null };
}

export async function saveReflectionForToday(db: Database, userId: string, input: ReflectionInput, now = new Date()) {
  const { localDate, hasProfile } = await getReflectionContext(db, userId, now);
  if (!hasProfile) throw new Error("ONBOARDING_REQUIRED");

  const text = input.text?.trim() || null;
  const [reflection] = await db.insert(dailyReflections).values({
    userId,
    localDate,
    mood: input.mood,
    text,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [dailyReflections.userId, dailyReflections.localDate],
    set: { mood: input.mood, text, updatedAt: now },
  }).returning({
    id: dailyReflections.id,
    localDate: dailyReflections.localDate,
    mood: dailyReflections.mood,
    text: dailyReflections.text,
    updatedAt: dailyReflections.updatedAt,
  });

  return reflection;
}

export async function deleteReflectionForToday(db: Database, userId: string, now = new Date()) {
  const { localDate, hasProfile } = await getReflectionContext(db, userId, now);
  if (!hasProfile) throw new Error("ONBOARDING_REQUIRED");
  const removed = await db.delete(dailyReflections).where(and(
    eq(dailyReflections.userId, userId),
    eq(dailyReflections.localDate, localDate),
  )).returning({ id: dailyReflections.id });
  return { deleted: removed.length > 0, localDate };
}
