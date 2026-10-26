import { and, eq, inArray } from "drizzle-orm";
import { createDb } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { habitScheduleVersions, habits, journeys, userProfiles } from "@/lib/db/domain-schema";
import { addCalendarDays, getLocalDate } from "@/features/journey/domain/calendar";
import type { CreateHabitInput, UpdateHabitInput } from "@/features/habits/domain/habit-schema";

type Database = ReturnType<typeof createDb>;

export class HabitServiceError extends Error {
  constructor(readonly code: "NO_ACTIVE_JOURNEY" | "ACTIVE_HABIT_LIMIT") {
    super(code);
    this.name = "HabitServiceError";
  }
}

export async function listHabitsForUser(db: Database, userId: string, includeArchived = false, now = new Date()) {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const [journey] = await db.select().from(journeys)
    .where(and(eq(journeys.userId, userId), eq(journeys.status, "active")))
    .limit(1);

  if (!journey || !profile) return { journey: null, habits: [] };

  const localDate = getLocalDate(profile.timezone, now);
  const habitFilter = includeArchived
    ? and(eq(habits.userId, userId), eq(habits.journeyId, journey.id))
    : and(eq(habits.userId, userId), eq(habits.journeyId, journey.id), eq(habits.status, "active"));
  const ownedHabits = await db.select().from(habits).where(habitFilter);
  const ids = ownedHabits.map(({ id }) => id);
  const schedules = ids.length
    ? await db.select().from(habitScheduleVersions).where(inArray(habitScheduleVersions.habitId, ids))
    : [];

  return {
    journey: { id: journey.id, startDate: journey.startDate, endDate: journey.endDate, status: journey.status },
    habits: ownedHabits.map((habit) => {
      const habitSchedules = schedules
        .filter((schedule) => schedule.habitId === habit.id)
        .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));
      const currentSchedule = habitSchedules.filter((schedule) => schedule.effectiveFrom <= localDate).at(-1);
      return {
        id: habit.id,
        title: habit.title,
        emoji: habit.emoji,
        status: habit.status,
        archivedOn: habit.archivedOn,
        scheduleDays: currentSchedule?.scheduleDays ?? [],
        schedules: habitSchedules.map(({ effectiveFrom, scheduleDays }) => ({ effectiveFrom, scheduleDays })),
      };
    }),
  };
}

export async function createHabitForUser(db: Database, userId: string, input: CreateHabitInput, now = new Date()) {
  return db.transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const [profile] = await tx.select({ timezone: userProfiles.timezone })
      .from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const [journey] = await tx.select({ id: journeys.id })
      .from(journeys)
      .where(and(eq(journeys.userId, userId), eq(journeys.status, "active")))
      .limit(1);
    if (!profile || !journey) throw new HabitServiceError("NO_ACTIVE_JOURNEY");

    const activeHabits = await tx.select({ id: habits.id }).from(habits).where(and(
      eq(habits.userId, userId),
      eq(habits.journeyId, journey.id),
      eq(habits.status, "active"),
    ));
    if (activeHabits.length >= 5) throw new HabitServiceError("ACTIVE_HABIT_LIMIT");

    const [habit] = await tx.insert(habits).values({
      userId,
      journeyId: journey.id,
      title: input.title,
      emoji: input.emoji?.trim() || null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    }).returning();
    const localDate = getLocalDate(profile.timezone, now);
    const [schedule] = await tx.insert(habitScheduleVersions).values({
      habitId: habit.id,
      effectiveFrom: localDate,
      scheduleDays: [...input.scheduleDays].sort((left, right) => left - right),
      createdAt: now,
    }).returning();

    return { ...habit, scheduleDays: schedule.scheduleDays, schedules: [{ effectiveFrom: schedule.effectiveFrom, scheduleDays: schedule.scheduleDays }] };
  });
}

export async function updateHabitForUser(db: Database, userId: string, habitId: string, input: UpdateHabitInput, now = new Date()) {
  return db.transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const [profile] = await tx.select({ timezone: userProfiles.timezone })
      .from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const [journey] = await tx.select({ id: journeys.id })
      .from(journeys)
      .where(and(eq(journeys.userId, userId), eq(journeys.status, "active")))
      .limit(1);
    if (!profile || !journey) throw new HabitServiceError("NO_ACTIVE_JOURNEY");

    const [habit] = await tx.select().from(habits).where(and(
      eq(habits.id, habitId),
      eq(habits.userId, userId),
      eq(habits.journeyId, journey.id),
      eq(habits.status, "active"),
    )).limit(1);
    if (!habit) return null;

    const updates: Partial<typeof habits.$inferInsert> = { updatedAt: now };
    if (input.title !== undefined) updates.title = input.title;
    if (input.emoji !== undefined) updates.emoji = input.emoji?.trim() || null;
    const [updatedHabit] = await tx.update(habits).set(updates).where(eq(habits.id, habitId)).returning();

    let schedules = await tx.select().from(habitScheduleVersions).where(eq(habitScheduleVersions.habitId, habitId));
    if (input.scheduleDays) {
      const effectiveFrom = addCalendarDays(getLocalDate(profile.timezone, now), 1);
      const scheduleDays = [...input.scheduleDays].sort((left, right) => left - right);
      const [futureVersion] = await tx.select({ id: habitScheduleVersions.id })
        .from(habitScheduleVersions)
        .where(and(eq(habitScheduleVersions.habitId, habitId), eq(habitScheduleVersions.effectiveFrom, effectiveFrom)))
        .limit(1);
      if (futureVersion) {
        await tx.update(habitScheduleVersions).set({ scheduleDays }).where(eq(habitScheduleVersions.id, futureVersion.id));
      } else {
        await tx.insert(habitScheduleVersions).values({ habitId, effectiveFrom, scheduleDays, createdAt: now });
      }
      schedules = await tx.select().from(habitScheduleVersions).where(eq(habitScheduleVersions.habitId, habitId));
    }

    return {
      ...updatedHabit,
      scheduleDays: input.scheduleDays ? [...input.scheduleDays].sort((left, right) => left - right) : undefined,
      schedules: schedules.sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom))
        .map(({ effectiveFrom, scheduleDays }) => ({ effectiveFrom, scheduleDays })),
    };
  });
}

export async function archiveHabitForUser(db: Database, userId: string, habitId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const [profile] = await tx.select({ timezone: userProfiles.timezone })
      .from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const [journey] = await tx.select({ id: journeys.id })
      .from(journeys)
      .where(and(eq(journeys.userId, userId), eq(journeys.status, "active")))
      .limit(1);
    if (!profile || !journey) throw new HabitServiceError("NO_ACTIVE_JOURNEY");

    const archivedOn = getLocalDate(profile.timezone, now);
    const [archivedHabit] = await tx.update(habits).set({
      status: "archived",
      archivedAt: now,
      archivedOn,
      updatedAt: now,
    }).where(and(
      eq(habits.id, habitId),
      eq(habits.userId, userId),
      eq(habits.journeyId, journey.id),
      eq(habits.status, "active"),
    )).returning({ id: habits.id });

    return archivedHabit ? { id: archivedHabit.id, archivedOn } : null;
  });
}
