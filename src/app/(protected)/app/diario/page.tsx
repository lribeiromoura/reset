import Link from "next/link";
import { redirect } from "next/navigation";
import { getReflectionForToday } from "@/features/journal/application/reflection-service";
import { ReflectionEditor } from "@/features/journal/ui/reflection-editor";
import { getJourneyOverview } from "@/features/journey/application/journey-service";
import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { createDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const user = await requireAuthenticatedUser();
  const db = createDb();
  const overview = await getJourneyOverview(db, user.id);
  if (!overview.profile || !overview.journey) redirect("/onboarding");
  const { reflection } = await getReflectionForToday(db, user.id);

  return (
    <main className="today-page">
      <header className="today-header">
        <Link className="brand" href="/" aria-label="Reset, início"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
        <nav className="today-user" aria-label="Navegação do aplicativo">
          <Link className="today-nav-link" href="/app">Hoje</Link>
          <Link className="today-nav-link" href="/app/habitos">Hábitos</Link>
          <Link className="today-nav-link" href="/app/progresso">Progresso</Link>
          <Link className="today-nav-link" href="/app/configuracoes">Configurações</Link>
          <span>{user.name}</span>
          <SignOutButton />
        </nav>
      </header>
      <section className="today-content journal-page-content">
        <span className="auth-kicker">SEU DIÁRIO</span>
        <h1>Um espaço só seu.</h1>
        <p className="today-greeting">Uma pequena pausa para perceber como foi o seu dia. Você pode voltar e atualizar este registro quando quiser.</p>
        <ReflectionEditor initialReflection={reflection ? { mood: reflection.mood, text: reflection.text } : null} />
      </section>
      <footer className="auth-footer">Pequenas ações, progresso real. <span>© 2026 Reset</span></footer>
    </main>
  );
}
