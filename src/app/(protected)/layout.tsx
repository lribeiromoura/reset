import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession();
  if (!session) redirect("/entrar");
  return children;
}
