import { AuthForm } from "@/features/auth/ui/auth-form";

export default async function RedefinirSenhaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthForm mode="reset" token={token ?? ""} />;
}
