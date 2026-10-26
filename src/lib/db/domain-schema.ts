import { relations, sql } from "drizzle-orm";
import {
  date,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const journeyStatus = pgEnum("journey_status", ["active", "completed", "abandoned"]);
export const habitStatus = pgEnum("habit_status", ["active", "archived"]);

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  goal: varchar("goal", { length: 120 }),
  focusAreas: jsonb("focus_areas").$type<string[]>().notNull().default([]),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const journeys = pgTable("journeys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  status: journeyStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("journeys_user_id_idx").on(table.userId),
  uniqueIndex("journeys_one_active_per_user_idx").on(table.userId).where(sql`${table.status} = 'active'`),
]);

export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 80 }).notNull(),
  emoji: varchar("emoji", { length: 16 }),
  status: habitStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  archivedOn: date("archived_on", { mode: "string" }),
}, (table) => [
  index("habits_user_status_idx").on(table.userId, table.status),
  index("habits_journey_id_idx").on(table.journeyId),
]);

export const habitScheduleVersions = pgTable("habit_schedule_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  habitId: uuid("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
  scheduleDays: smallint("schedule_days").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("habit_schedule_versions_habit_effective_idx").on(table.habitId, table.effectiveFrom),
]);

export const habitCompletions = pgTable("habit_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  habitId: uuid("habit_id").notNull().references(() => habits.id),
  localDate: date("local_date", { mode: "string" }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("habit_completions_habit_local_date_idx").on(table.habitId, table.localDate),
  index("habit_completions_user_date_idx").on(table.userId, table.localDate),
]);

export const dailyReflections = pgTable("daily_reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  localDate: date("local_date", { mode: "string" }).notNull(),
  mood: smallint("mood").notNull(),
  text: varchar("text", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("daily_reflections_user_local_date_idx").on(table.userId, table.localDate),
  check("daily_reflections_mood_range_check", sql`${table.mood} between 1 and 5`),
]);

export const journeysRelations = relations(journeys, ({ many }) => ({ habits: many(habits) }));
export const habitsRelations = relations(habits, ({ one, many }) => ({
  journey: one(journeys, { fields: [habits.journeyId], references: [journeys.id] }),
  scheduleVersions: many(habitScheduleVersions),
  completions: many(habitCompletions),
}));
export const habitScheduleVersionsRelations = relations(habitScheduleVersions, ({ one }) => ({
  habit: one(habits, { fields: [habitScheduleVersions.habitId], references: [habits.id] }),
}));
export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, { fields: [habitCompletions.habitId], references: [habits.id] }),
}));
