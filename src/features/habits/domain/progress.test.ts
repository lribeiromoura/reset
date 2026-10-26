import { describe, expect, it } from "vitest";
import { buildWeeklyProgress, getHabitStreak } from "./progress";

describe("weekly progress", () => {
  it("uses the schedule version and ignores the archive date", () => {
    const habits = [
      { id: "habit-1", status: "archived" as const, archivedOn: "2026-10-29", schedules: [{ effectiveFrom: "2026-10-26", scheduleDays: [1, 2, 3, 4, 5, 6, 7] }] },
    ];
    const result = buildWeeklyProgress(habits, [{ habitId: "habit-1", localDate: "2026-10-28" }], "2026-10-31", "2026-10-26", "2026-12-30");
    expect(result.scheduled).toBe(3);
    expect(result.completed).toBe(1);
    expect(result.days.find(({ date }) => date === "2026-10-29")?.scheduled).toBe(0);
  });

  it("returns null consistency when no mission was due", () => {
    const result = buildWeeklyProgress([], [], "2026-10-31", "2026-10-26", "2026-12-30");
    expect(result.completionRate).toBeNull();
  });
});

describe("habit streak", () => {
  const habit = {
    id: "habit-1",
    status: "active" as const,
    archivedOn: null,
    schedules: [{ effectiveFrom: "2026-10-26", scheduleDays: [1, 3, 5] }],
  };

  it("counts only consecutive scheduled occurrences and starts before a pending due today", () => {
    const completions = [
      { habitId: "habit-1", localDate: "2026-10-26" },
      { habitId: "habit-1", localDate: "2026-10-28" },
    ];
    expect(getHabitStreak(habit, completions, "2026-10-29", "2026-10-26", "2026-12-30")).toBe(2);
  });

  it("resets when the last scheduled occurrence was missed", () => {
    expect(getHabitStreak(habit, [{ habitId: "habit-1", localDate: "2026-10-26" }], "2026-10-31", "2026-10-26", "2026-12-30")).toBe(0);
  });
});
