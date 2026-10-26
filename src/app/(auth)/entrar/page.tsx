import { AuthForm } from "@/features/auth/ui/auth-form";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";

export default async function EntrarPage() {
  const session = await getServerSession();
  if (session) redirect("/onboarding");
  return <AuthForm mode="signin" />;
}
