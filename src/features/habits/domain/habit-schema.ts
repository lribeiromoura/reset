import { z } from "zod";

const scheduleDaysSchema = z.array(z.number().int().min(1).max(7))
  .min(1)
  .max(7)
  .refine((days) => new Set(days).size === days.length, "Os dias não podem se repetir.");

const titleSchema = z.string().trim().min(1).max(80);
const emojiSchema = z.string().trim().max(16).nullable().optional();

export const createHabitSchema = z.object({
  title: titleSchema,
  emoji: emojiSchema,
  scheduleDays: scheduleDaysSchema,
}).strict();

export const updateHabitSchema = z.object({
  title: titleSchema.optional(),
  emoji: emojiSchema,
  scheduleDays: scheduleDaysSchema.optional(),
}).strict().refine((value) => Object.values(value).some((field) => field !== undefined), "Informe ao menos um campo.");

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
