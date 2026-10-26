import { getIsoWeekday } from "@/features/journey/domain/calendar";

export type ScheduleVersion = {
  effectiveFrom: string;
  scheduleDays: number[];
};

export function isHabitScheduledOnDate(versions: ScheduleVersion[], date: string): boolean {
  const applicable = versions
    .filter((version) => version.effectiveFrom <= date)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0];

  return applicable?.scheduleDays.includes(getIsoWeekday(date)) ?? false;
}
