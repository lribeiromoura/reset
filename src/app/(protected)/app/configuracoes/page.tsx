import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/features/account/ui/account-settings";
import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { createDb } from "@/lib/db";
import { getAccountProfile } from "@/features/account/application/profile-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const sessionUser = await requireAuthenticatedUser();
  const account = await getAccountProfile(createDb(), sessionUser.id);
  if (!account) redirect("/entrar");
  if (!account.onboardingCompleted) redirect("/onboarding");

  return (
    <main className="today-page">
      <header className="today-header">
        <Link className="brand" href="/" aria-label="Reset, início"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
        <nav className="today-user" aria-label="Navegação do aplicativo">
          <Link className="today-nav-link" href="/app">Hoje</Link>
          <Link className="today-nav-link" href="/app/habitos">Hábitos</Link>
          <Link className="today-nav-link" href="/app/progresso">Progresso</Link>
          <Link className="today-nav-link" href="/app/diario">Diário</Link>
          <SignOutButton />
        </nav>
      </header>
      <section className="today-content settings-content">
        <span className="auth-kicker">CONFIGURAÇÕES</span>
        <h1>Seu espaço, suas escolhas.</h1>
        <p className="today-greeting">Revise suas informações ou leve seus dados com você.</p>
        <AccountSettings initialName={account.user.name} initialTimezone={account.profile?.timezone ?? "America/Sao_Paulo"} email={account.user.email} />
      </section>
      <footer className="auth-footer">Pequenas ações, progresso real. <span>© 2026 Reset</span></footer>
    </main>
  );
}
