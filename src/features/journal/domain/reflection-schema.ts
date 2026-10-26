import { z } from "zod";

export const reflectionSchema = z.object({
  mood: z.number().int().min(1).max(5),
  text: z.string().trim().max(500).nullable().optional(),
}).strict();

export type ReflectionInput = z.infer<typeof reflectionSchema>;
