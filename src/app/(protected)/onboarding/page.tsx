import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/journey/ui/onboarding-wizard";
import { getJourneyOverview } from "@/features/journey/application/journey-service";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { createDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireAuthenticatedUser();
  const overview = await getJourneyOverview(createDb(), user.id);
  if (overview.profile?.onboardingCompletedAt || overview.journey) redirect("/app");
  return <OnboardingWizard name={user.name} />;
}
