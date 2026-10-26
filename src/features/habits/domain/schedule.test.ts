import { describe, expect, it } from "vitest";
import { isHabitScheduledOnDate } from "./schedule";

describe("habit schedule versions", () => {
  const versions = [
    { effectiveFrom: "2026-10-26", scheduleDays: [1, 3, 5] },
    { effectiveFrom: "2026-10-29", scheduleDays: [2, 4, 6, 7] },
  ];

  it("uses the latest schedule effective on a local calendar date", () => {
    expect(isHabitScheduledOnDate(versions, "2026-10-28")).toBe(true);
    expect(isHabitScheduledOnDate(versions, "2026-10-27")).toBe(false);
    expect(isHabitScheduledOnDate(versions, "2026-10-29")).toBe(true);
    expect(isHabitScheduledOnDate(versions, "2026-11-01")).toBe(true);
  });

  it("returns false when no schedule version applies", () => {
    expect(isHabitScheduledOnDate([], "2026-10-26")).toBe(false);
  });
});
