import Link from "next/link";
import { redirect } from "next/navigation";
import { getTodayDashboard } from "@/features/habits/application/completion-service";
import { TodayMissions } from "@/features/habits/ui/today-missions";
import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { createDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireAuthenticatedUser();
  const dashboard = await getTodayDashboard(createDb(), user.id);
  if (!dashboard.journey || !dashboard.profile) redirect("/onboarding");
  const displayDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dashboard.localDate}T00:00:00Z`));

  return (
    <main className="today-page">
      <header className="today-header">
        <Link className="brand" href="/" aria-label="Reset, início"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
        <nav className="today-user" aria-label="Navegação do aplicativo"><Link className="today-nav-link" href="/app/habitos">Hábitos</Link><Link className="today-nav-link" href="/app/progresso">Progresso</Link><Link className="today-nav-link" href="/app/diario">Diário</Link><Link className="today-nav-link" href="/app/configuracoes">Configurações</Link><span>{user.name}</span><SignOutButton /></nav>
      </header>
      <section className="today-content">
        <span className="auth-kicker">{displayDate}</span>
        <h1>Seu dia, no seu ritmo.</h1>
        <p className="today-greeting">Olá, {user.name.split(" ")[0]}. Sua jornada começou com uma intenção: <strong>{dashboard.profile.goal}</strong></p>
        <div className="journey-summary-card">
          <div className="journey-summary-heading"><div><span>JORNADA DE 66 DIAS</span><h2>Um passo de cada vez.</h2></div><span className="journey-day">Dia {dashboard.journey.day}<small>/ 66</small></span></div>
          <div className="journey-summary-track" aria-label={`Dia ${dashboard.journey.day} de 66`}><span style={{ width: `${(dashboard.journey.day / dashboard.journey.durationDays) * 100}%` }} /></div>
        </div>
        <div className="today-list-heading"><div><span className="auth-kicker">HOJE</span><h2>Um pouco já conta.</h2></div><span>{dashboard.today.scheduled} {dashboard.today.scheduled === 1 ? "missão prevista" : "missões previstas"}</span></div>
        {dashboard.today.habits.length ? (
          <TodayMissions
            habits={dashboard.today.habits}
            scheduledCount={dashboard.today.scheduled}
            completedCount={dashboard.today.completed}
            totalXp={dashboard.journey.totalXp}
          />
        ) : <div className="today-empty"><span aria-hidden="true">✳</span><p>Hoje é um dia de pausa na sua agenda. Você pode retomar quando seu próximo hábito estiver previsto.</p></div>}
        <p className="today-next-step">Cada missão concluída vale 10 XP. Você pode desfazer uma marcação feita por engano.</p>
      </section>
      <footer className="auth-footer">Pequenas ações, progresso real. <span>© 2026 Reset</span></footer>
    </main>
  );
}
