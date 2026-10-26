import { z } from "zod";

export const focusAreaValues = ["health", "focus", "studies", "organization", "wellbeing"] as const;
export type FocusArea = (typeof focusAreaValues)[number];

export const habitInputSchema = z.object({
  title: z.string().trim().min(1).max(80),
  emoji: z.string().max(16).optional(),
  scheduleDays: z.array(z.number().int().min(1).max(7)).min(1).max(7)
    .refine((days) => new Set(days).size === days.length, "Os dias da semana não podem se repetir."),
});

export const onboardingSchema = z.object({
  goal: z.string().trim().min(1).max(120),
  focusAreas: z.array(z.enum(focusAreaValues)).min(1).max(2)
    .refine((areas) => new Set(areas).size === areas.length, "Escolha áreas diferentes."),
  timezone: z.string().trim().min(1).max(80).refine(isValidTimezone, "Escolha um fuso horário IANA válido."),
  habits: z.array(habitInputSchema).min(1).max(3),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}
