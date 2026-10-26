import Link from "next/link";
import { redirect } from "next/navigation";
import { listHabitsForUser } from "@/features/habits/application/habit-service";
import { HabitManager } from "@/features/habits/ui/habit-manager";
import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { createDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const user = await requireAuthenticatedUser();
  const data = await listHabitsForUser(createDb(), user.id, true);
  if (!data.journey) redirect("/onboarding");

  return (
    <main className="today-page">
      <header className="today-header">
        <Link className="brand" href="/" aria-label="Reset, início"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
        <nav className="today-user" aria-label="Navegação do aplicativo">
          <Link className="today-nav-link" href="/app">Hoje</Link>
          <Link className="today-nav-link" href="/app/progresso">Progresso</Link>
          <Link className="today-nav-link" href="/app/diario">Diário</Link>
          <Link className="today-nav-link" href="/app/configuracoes">Configurações</Link>
          <span>{user.name}</span>
          <SignOutButton />
        </nav>
      </header>
      <section className="today-content habit-page-content">
        <span className="auth-kicker">SUA ROTINA</span>
        <h1>Hábitos que cabem no seu dia.</h1>
        <p className="today-greeting">Ajuste sua agenda aos poucos. O que você já construiu continua no seu histórico.</p>
        <HabitManager initialHabits={data.habits} />
      </section>
      <footer className="auth-footer">Pequenas ações, progresso real. <span>© 2026 Reset</span></footer>
    </main>
  );
}
