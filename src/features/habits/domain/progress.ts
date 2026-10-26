import { addCalendarDays } from "@/features/journey/domain/calendar";
import { isHabitScheduledOnDate, type ScheduleVersion } from "@/features/habits/domain/schedule";

export type ProgressHabit = {
  id: string;
  status: "active" | "archived";
  archivedOn: string | null;
  schedules: ScheduleVersion[];
};

export type HabitCompletionDate = {
  habitId: string;
  localDate: string;
};

function isActiveOnDate(habit: ProgressHabit, date: string, journeyStart: string, journeyEnd: string) {
  if (date < journeyStart || date > journeyEnd) return false;
  if (habit.status === "archived") return Boolean(habit.archivedOn && date < habit.archivedOn);
  return true;
}

function isDueOnDate(habit: ProgressHabit, date: string, journeyStart: string, journeyEnd: string) {
  return isActiveOnDate(habit, date, journeyStart, journeyEnd) && isHabitScheduledOnDate(habit.schedules, date);
}

export function buildWeeklyProgress(
  habits: ProgressHabit[],
  completions: HabitCompletionDate[],
  today: string,
  journeyStart: string,
  journeyEnd: string,
) {
  const completionKeys = new Set(completions.map(({ habitId, localDate }) => `${habitId}:${localDate}`));
  const days = Array.from({ length: 7 }, (_, index) => addCalendarDays(today, index - 6)).map((date) => {
    const due = habits.filter((habit) => isDueOnDate(habit, date, journeyStart, journeyEnd));
    const completed = due.filter((habit) => completionKeys.has(`${habit.id}:${date}`)).length;
    return {
      date,
      scheduled: due.length,
      completed,
      completionRate: due.length === 0 ? null : completed / due.length,
    };
  });
  const scheduled = days.reduce((total, day) => total + day.scheduled, 0);
  const completed = days.reduce((total, day) => total + day.completed, 0);

  return { scheduled, completed, completionRate: scheduled === 0 ? null : completed / scheduled, days };
}

export function getHabitStreak(
  habit: ProgressHabit,
  completions: HabitCompletionDate[],
  today: string,
  journeyStart: string,
  journeyEnd: string,
) {
  const completionDates = new Set(completions.filter(({ habitId }) => habitId === habit.id).map(({ localDate }) => localDate));
  let date = today;
  if (isDueOnDate(habit, today, journeyStart, journeyEnd) && !completionDates.has(today)) {
    date = addCalendarDays(today, -1);
  }

  let streak = 0;
  while (date >= journeyStart && date <= journeyEnd) {
    if (isDueOnDate(habit, date, journeyStart, journeyEnd)) {
      if (!completionDates.has(date)) break;
      streak += 1;
    }
    date = addCalendarDays(date, -1);
  }
  return streak;
}
