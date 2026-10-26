import Link from "next/link";
import { redirect } from "next/navigation";
import { getTodayDashboard } from "@/features/habits/application/completion-service";
import { SignOutButton } from "@/features/auth/ui/sign-out-button";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { createDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function displayDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit" })
    .format(new Date(`${date}T00:00:00Z`));
}

export default async function ProgressPage() {
  const user = await requireAuthenticatedUser();
  const dashboard = await getTodayDashboard(createDb(), user.id);
  if (!dashboard.journey || !dashboard.profile) redirect("/onboarding");
  const rate = dashboard.week.completionRate === null ? null : Math.round(dashboard.week.completionRate * 100);

  return (
    <main className="today-page">
      <header className="today-header">
        <Link className="brand" href="/" aria-label="Reset, início"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
        <nav className="today-user" aria-label="Navegação do aplicativo">
          <Link className="today-nav-link" href="/app">Hoje</Link>
          <Link className="today-nav-link" href="/app/habitos">Hábitos</Link>
          <Link className="today-nav-link" href="/app/diario">Diário</Link>
          <Link className="today-nav-link" href="/app/configuracoes">Configurações</Link>
          <span>{user.name}</span>
          <SignOutButton />
        </nav>
      </header>
      <section className="today-content progress-page-content">
        <span className="auth-kicker">SEU CAMINHO</span>
        <h1>Progresso, um dia de cada vez.</h1>
        <p className="today-greeting">Cada retorno conta. Veja o que você construiu nesta jornada sem precisar de uma sequência perfeita.</p>

        <div className="progress-summary-grid">
          <article className="progress-summary-card"><span>XP da jornada</span><strong>{dashboard.journey.totalXp}</strong><small>10 XP por missão concluída</small></article>
          <article className="progress-summary-card"><span>Últimos 7 dias</span><strong>{rate === null ? "—" : `${rate}%`}</strong><small>{rate === null ? "Sem missões previstas" : `${dashboard.week.completed} de ${dashboard.week.scheduled} missões concluídas`}</small></article>
        </div>

        <section className="progress-section" aria-labelledby="weekly-heading">
          <div className="progress-section-heading"><div><span className="auth-kicker">ÚLTIMOS 7 DIAS</span><h2 id="weekly-heading">Sua semana, no seu ritmo.</h2></div><span>{rate === null ? "Sem missões previstas" : `${rate}% concluído`}</span></div>
          <ul className="weekly-bars" aria-label="Missões concluídas por dia">
            {dashboard.week.days.map((day) => {
              const height = day.scheduled === 0 ? 5 : Math.max(8, Math.round((day.completed / day.scheduled) * 100));
              return <li key={day.date} aria-label={`${displayDate(day.date)}: ${day.completed} de ${day.scheduled} concluídas`}>
                <div className="weekly-bar-track" aria-hidden="true"><span style={{ height: `${height}%` }} /></div>
                <small>{displayDate(day.date)}</small>
                <span className="weekly-bar-count">{day.completed}/{day.scheduled}</span>
              </li>;
            })}
          </ul>
          <table className="weekly-progress-table">
            <caption>Detalhe acessível da semana</caption>
            <thead><tr><th scope="col">Dia</th><th scope="col">Concluídas</th><th scope="col">Previstas</th></tr></thead>
            <tbody>{dashboard.week.days.map((day) => <tr key={day.date}><th scope="row">{displayDate(day.date)}</th><td>{day.completed}</td><td>{day.scheduled}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="progress-section" aria-labelledby="streak-heading">
          <div className="progress-section-heading"><div><span className="auth-kicker">CONSISTÊNCIA</span><h2 id="streak-heading">Ocorrências seguidas</h2></div></div>
          {dashboard.streaks.length ? <ul className="streak-list">{dashboard.streaks.map((streak) => <li key={streak.habitId}><span>{streak.title}</span><strong>{streak.count} {streak.count === 1 ? "vez" : "vezes"}</strong></li>)}</ul> : <div className="today-empty"><span aria-hidden="true">✳</span><p>Seus hábitos e suas sequências aparecem aqui quando você começa a jornada.</p></div>}
        </section>
      </section>
      <footer className="auth-footer">Pequenas ações, progresso real. <span>© 2026 Reset</span></footer>
    </main>
  );
}
