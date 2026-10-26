import { describe, expect, it } from "vitest";
import { addCalendarDays, getIsoWeekday, getJourneyDay, getLocalDate } from "./calendar";

describe("journey calendar", () => {
  it("uses the user's local calendar date around UTC midnight", () => {
    const instant = new Date("2026-10-26T02:30:00.000Z");
    expect(getLocalDate("America/Sao_Paulo", instant)).toBe("2026-10-25");
    expect(getLocalDate("Pacific/Auckland", instant)).toBe("2026-10-26");
  });

  it("adds calendar days across month and year boundaries", () => {
    expect(addCalendarDays("2026-10-28", 65)).toBe("2027-01-01");
  });

  it("uses ISO weekdays and clamps the current day to the journey", () => {
    expect(getIsoWeekday("2026-11-01")).toBe(7);
    expect(getJourneyDay("2026-10-25", "2026-10-26")).toBe(2);
    expect(getJourneyDay("2026-10-25", "2027-02-01")).toBe(66);
  });
});
