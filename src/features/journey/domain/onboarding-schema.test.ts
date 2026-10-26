import { describe, expect, it } from "vitest";
import { onboardingSchema } from "./onboarding-schema";

const validInput = {
  goal: "Ler mais e caminhar",
  focusAreas: ["studies", "wellbeing"],
  timezone: "America/Sao_Paulo",
  habits: [{ title: "Ler por 10 minutos", emoji: "📚", scheduleDays: [1, 2, 3, 4, 5] }],
};

describe("onboarding schema", () => {
  it("accepts the specified onboarding payload and trims text", () => {
    expect(onboardingSchema.parse({ ...validInput, goal: "  Ler mais e caminhar  " }).goal).toBe("Ler mais e caminhar");
  });

  it("rejects more than two focus areas and duplicate schedule days", () => {
    expect(onboardingSchema.safeParse({ ...validInput, focusAreas: ["health", "focus", "studies"] }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validInput, habits: [{ ...validInput.habits[0], scheduleDays: [1, 1] }] }).success).toBe(false);
  });

  it("rejects invalid IANA zones, blank goals and zero habits", () => {
    expect(onboardingSchema.safeParse({ ...validInput, timezone: "Mars/Olympus" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validInput, goal: "  " }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validInput, habits: [] }).success).toBe(false);
  });
});
