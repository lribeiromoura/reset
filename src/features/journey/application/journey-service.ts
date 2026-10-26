import { and, eq, inArray } from "drizzle-orm";
import { createDb } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { habitScheduleVersions, habits, journeys, userProfiles } from "@/lib/db/domain-schema";
import type { OnboardingInput } from "@/features/journey/domain/onboarding-schema";
import { addCalendarDays, getLocalDate } from "@/features/journey/domain/calendar";

type Database = ReturnType<typeof createDb>;

export class JourneyConflictError extends Error {
  constructor(readonly code: "JOURNEY_ALREADY_ACTIVE" | "ONBOARDING_ALREADY_COMPLETED") {
    super(code);
    this.name = "JourneyConflictError";
  }
}

export async function createJourneyForUser(
  db: Database,
  userId: string,
  input: OnboardingInput,
  now = new Date(),
) {
  const startDate = getLocalDate(input.timezone, now);
  const endDate = addCalendarDays(startDate, 65);

  return db.transaction(async (tx) => {
    const [owner] = await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    if (!owner) throw new Error("AUTH_USER_NOT_FOUND");

    const [profile] = await tx.select({ onboardingCompletedAt: userProfiles.onboardingCompletedAt })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    if (profile?.onboardingCompletedAt) throw new JourneyConflictError("ONBOARDING_ALREADY_COMPLETED");

    const [activeJourney] = await tx.select({ id: journeys.id })
      .from(journeys)
      .where(and(eq(journeys.userId, userId), eq(journeys.status, "active")))
      .limit(1);
    if (activeJourney) throw new JourneyConflictError("JOURNEY_ALREADY_ACTIVE");

    const [journey] = await tx.insert(journeys).values({
      userId,
      startDate,
      endDate,
      status: "active",
    }).returning();

    await tx.insert(userProfiles).values({
      userId,
      timezone: input.timezone,
      goal: input.goal,
      focusAreas: input.focusAreas,
      onboardingCompletedAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        timezone: input.timezone,
        goal: input.goal,
        focusAreas: input.focusAreas,
        onboardingCompletedAt: now,
        updatedAt: now,
      },
    });

    const createdHabits = [];
    for (const habitInput of input.habits) {
      const [habit] = await tx.insert(habits).values({
        userId,
        journeyId: journey.id,
        title: habitInput.title,
        emoji: habitInput.emoji?.trim() || null,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }).returning();

      const [schedule] = await tx.insert(habitScheduleVersions).values({
        habitId: habit.id,
        effectiveFrom: startDate,
        scheduleDays: [...habitInput.scheduleDays].sort((left, right) => left - right),
        createdAt: now,
      }).returning();

      createdHabits.push({ ...habit, schedules: [schedule] });
    }

    return { journey, profile: { userId, timezone: input.timezone, goal: input.goal, focusAreas: input.focusAreas, onboardingCompletedAt: now }, habits: createdHabits };
  });
}

export async function getJourneyOverview(db: Database, userId: string) {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const [journey] = await db.select().from(journeys)
    .where(and(eq(journeys.userId, userId), eq(journeys.status, "active")))
    .limit(1);

  if (!journey) return { profile: profile ?? null, journey: null, habits: [] };

  const userHabits = await db.select().from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.journeyId, journey.id), eq(habits.status, "active")));
  const habitIds = userHabits.map(({ id }) => id);
  const schedules = habitIds.length
    ? await db.select().from(habitScheduleVersions).where(inArray(habitScheduleVersions.habitId, habitIds))
    : [];

  return {
    profile: profile ?? null,
    journey,
    habits: userHabits.map((habit) => ({
      ...habit,
      schedules: schedules.filter((schedule) => schedule.habitId === habit.id),
    })),
  };
}
