const habits = [
  { icon: "◉", label: "Caminhar um pouco", time: "10 min", done: true },
  { icon: "⌁", label: "Ler algumas páginas", time: "15 min", done: false },
  { icon: "✳", label: "Respirar com calma", time: "5 min", done: false },
];

function Mark({ checked = false }: { checked?: boolean }) {
  return (
    <span className={`habit-mark${checked ? " is-checked" : ""}`} aria-hidden="true">
      {checked ? "✓" : ""}
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="topbar wrap" aria-label="Navegação principal">
        <a className="brand" href="#inicio" aria-label="Reset, início">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>reset<span className="brand-period">.</span></span>
        </a>
        <div className="nav-links">
          <a href="#como-funciona">Como funciona</a>
          <a href="#filosofia">Nossa ideia</a>
        </div>
        <div className="nav-actions"><a className="login-link" href="/entrar">Entrar</a><a className="button button-small button-outline" href="/cadastro">Começar agora <span aria-hidden="true">↗</span></a></div>
      </nav>

      <section className="hero wrap" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> UM DIA DE CADA VEZ</div>
          <h1>Uma vida mais leve começa com <em>um pequeno passo.</em></h1>
          <p className="hero-intro">Crie espaço para o que importa. Escolha hábitos possíveis, acompanhe seu ritmo e celebre cada vez que você aparece por si.</p>
          <div className="hero-actions" id="comecar">
            <a className="button button-primary" href="/cadastro">Encontre seu ritmo <span aria-hidden="true">→</span></a>
            <span className="no-pressure">Sem pressa. Sem perfeição.</span>
          </div>
          <div className="social-proof"><div className="avatar-stack" aria-hidden="true"><span>L</span><span>M</span><span>A</span><span>+</span></div><span>Pequenas mudanças, no seu tempo</span></div>
        </div>

        <div className="hero-art" aria-label="Prévia de um dia de hábitos no Reset">
          <div className="sun-glow" />
          <div className="spark spark-one">✳</div><div className="spark spark-two">✦</div>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="day-card">
            <div className="day-top"><div><span className="day-kicker">SEGUNDA-FEIRA, 26 OUT</span><h2>Seu dia, no seu ritmo.</h2></div><div className="day-avatar">L</div></div>
            <div className="journey-line"><div className="journey-label"><span>Jornada de 66 dias</span><span>Dia 08 <b>/ 66</b></span></div><div className="journey-track"><span /></div></div>
            <div className="today-title"><span>Um pouco já conta.</span><span className="today-count">1 de 3</span></div>
            <div className="habit-list">
              {habits.map((habit) => <div className={`habit-row${habit.done ? " habit-done" : ""}`} key={habit.label}><Mark checked={habit.done} /><span className="habit-icon" aria-hidden="true">{habit.icon}</span><span className="habit-name">{habit.label}<small>{habit.time}</small></span>{habit.done ? <span className="done-label">Feito</span> : <span className="xp-label">+10 XP</span>}</div>)}
            </div>
            <div className="card-foot"><span className="streak-icon">✦</span><span>Você está construindo consistência</span><span className="streak-value">3 dias</span></div>
          </div>
          <div className="floating-note"><span className="note-leaf">↗</span><span><b>+10 XP</b><small>um passo de cada vez</small></span></div>
          <div className="art-caption">SEU PROGRESSO, SEM PRESSA</div>
        </div>
      </section>

      <section className="value-strip wrap" id="como-funciona" aria-label="Como o Reset ajuda">
        <div className="strip-item"><span className="strip-number">01</span><span><b>Comece pequeno</b><small>Hábitos que cabem na sua vida real.</small></span></div>
        <div className="strip-item"><span className="strip-number">02</span><span><b>Volte quando quiser</b><small>Um dia diferente não apaga seu caminho.</small></span></div>
        <div className="strip-item"><span className="strip-number">03</span><span><b>Veja o que floresce</b><small>Seu progresso, construído dia após dia.</small></span></div>
      </section>

      <section className="closing wrap" id="filosofia"><span className="closing-ornament" aria-hidden="true">✳</span><p>Não precisa mudar tudo.<br /><em>Só começar por algo.</em></p><span className="closing-caption">RESET — UM NOVO RITMO, NO SEU TEMPO</span></section>

      <footer className="footer wrap"><a className="brand footer-brand" href="#inicio"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></a><span>Pequenas ações, progresso real.</span><span className="footer-legal"><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a><span>© 2026 Reset</span></span></footer>
    </main>
  );
}
