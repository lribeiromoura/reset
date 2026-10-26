import { and, eq, gte, lte } from "drizzle-orm";
import { createDb } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { habitCompletions, habitScheduleVersions, habits, journeys, userProfiles } from "@/lib/db/domain-schema";
import { getJourneyDay, getLocalDate } from "@/features/journey/domain/calendar";
import { isHabitScheduledOnDate } from "@/features/habits/domain/schedule";
import { buildWeeklyProgress, getHabitStreak } from "@/features/habits/domain/progress";
import { getJourneyOverview } from "@/features/journey/application/journey-service";
import { listHabitsForUser } from "@/features/habits/application/habit-service";

type Database = ReturnType<typeof createDb>;
type QueryDatabase = Pick<Database, "select">;

export class CompletionConflictError extends Error {
  constructor(readonly code: "NO_ACTIVE_JOURNEY" | "HABIT_NOT_SCHEDULED") {
    super(code);
    this.name = "CompletionConflictError";
  }
}

export class HabitNotFoundError extends Error {
  constructor() {
    super("HABIT_NOT_FOUND");
    this.name = "HabitNotFoundError";
  }
}

async function findCompletionContext(db: QueryDatabase, userId: string, habitId: string, now: Date) {
  const [profile] = await db.select({ timezone: userProfiles.timezone })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  const [journey] = await db.select({ id: journeys.id, startDate: journeys.startDate, endDate: journeys.endDate })
    .from(journeys)
    .where(and(eq(journeys.userId, userId), eq(journeys.status, "active")))
    .limit(1);

  if (!profile || !journey) throw new CompletionConflictError("NO_ACTIVE_JOURNEY");
  const localDate = getLocalDate(profile.timezone, now);
  if (localDate < journey.startDate || localDate > journey.endDate) {
    throw new CompletionConflictError("NO_ACTIVE_JOURNEY");
  }

  const [habit] = await db.select({ id: habits.id })
    .from(habits)
    .where(and(
      eq(habits.id, habitId),
      eq(habits.userId, userId),
      eq(habits.journeyId, journey.id),
      eq(habits.status, "active"),
    ))
    .limit(1);

  if (!habit) throw new HabitNotFoundError();

  const schedules = await db.select({ effectiveFrom: habitScheduleVersions.effectiveFrom, scheduleDays: habitScheduleVersions.scheduleDays })
    .from(habitScheduleVersions)
    .where(and(eq(habitScheduleVersions.habitId, habit.id), lte(habitScheduleVersions.effectiveFrom, localDate)));

  if (!isHabitScheduledOnDate(schedules, localDate)) {
    throw new CompletionConflictError("HABIT_NOT_SCHEDULED");
  }

  return { localDate };
}

export async function completeHabitForToday(db: Database, userId: string, habitId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const { localDate } = await findCompletionContext(tx, userId, habitId, now);
    const [completion] = await tx.insert(habitCompletions).values({ userId, habitId, localDate, completedAt: now })
      .onConflictDoNothing({ target: [habitCompletions.habitId, habitCompletions.localDate] })
      .returning({ id: habitCompletions.id });

    return { habitId, localDate, completed: true as const, xpDelta: completion ? 10 : 0 };
  });
}

export async function uncompleteHabitForToday(db: Database, userId: string, habitId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const { localDate } = await findCompletionContext(tx, userId, habitId, now);
    const removed = await tx.delete(habitCompletions)
      .where(and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.localDate, localDate),
      ))
      .returning({ id: habitCompletions.id });

    return { habitId, localDate, completed: false as const, xpDelta: removed.length ? -10 : 0 };
  });
}

export async function getTodayDashboard(db: Database, userId: string, now = new Date()) {
  const overview = await getJourneyOverview(db, userId);
  const timezone = overview.profile?.timezone ?? "America/Sao_Paulo";
  const localDate = getLocalDate(timezone, now);

  if (!overview.journey || !overview.profile) {
    return {
      profile: overview.profile ? {
        timezone: overview.profile.timezone,
        goal: overview.profile.goal,
        focusAreas: overview.profile.focusAreas,
      } : null,
      localDate,
      journey: null,
      today: { scheduled: 0, completed: 0, habits: [] },
      week: { scheduled: 0, completed: 0, completionRate: null, days: [] },
      streaks: [],
    };
  }

  const inJourney = localDate >= overview.journey.startDate && localDate <= overview.journey.endDate;
  const dueHabits = inJourney ? overview.habits.filter((habit) => isHabitScheduledOnDate(habit.schedules, localDate)) : [];
  const journeyCompletions = await db.select({ habitId: habitCompletions.habitId, localDate: habitCompletions.localDate })
    .from(habitCompletions)
    .innerJoin(habits, eq(habitCompletions.habitId, habits.id))
    .where(and(
      eq(habitCompletions.userId, userId),
      eq(habits.journeyId, overview.journey.id),
      gte(habitCompletions.localDate, overview.journey.startDate),
      lte(habitCompletions.localDate, overview.journey.endDate),
    ));
  const completedIds = new Set(journeyCompletions.filter(({ localDate: date }) => date === localDate).map(({ habitId }) => habitId));
  const allHabits = await listHabitsForUser(db, userId, true, now);
  const week = buildWeeklyProgress(allHabits.habits, journeyCompletions, localDate, overview.journey.startDate, overview.journey.endDate);
  const streaks = overview.habits.map((habit) => ({
    habitId: habit.id,
    title: habit.title,
    count: getHabitStreak(habit, journeyCompletions, localDate, overview.journey.startDate, overview.journey.endDate),
  }));

  return {
    profile: {
      timezone: overview.profile.timezone,
      goal: overview.profile.goal,
      focusAreas: overview.profile.focusAreas,
    },
    localDate,
    journey: {
      startDate: overview.journey.startDate,
      endDate: overview.journey.endDate,
      status: overview.journey.status,
      day: getJourneyDay(overview.journey.startDate, localDate),
      durationDays: 66,
      totalXp: journeyCompletions.length * 10,
    },
    today: {
      scheduled: dueHabits.length,
      completed: dueHabits.filter(({ id }) => completedIds.has(id)).length,
      habits: dueHabits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        emoji: habit.emoji,
        completed: completedIds.has(habit.id),
      })),
    },
    week,
    streaks,
  };
}
