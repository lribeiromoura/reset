"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { focusAreaValues, onboardingSchema, type FocusArea } from "@/features/journey/domain/onboarding-schema";
import { SignOutButton } from "@/features/auth/ui/sign-out-button";

type HabitDraft = { id: string; title: string; emoji: string; scheduleDays: number[]; selected: boolean; category: FocusArea | "custom" };

const areaLabels: Record<FocusArea, string> = {
  health: "Saúde",
  focus: "Foco",
  studies: "Estudos",
  organization: "Organização",
  wellbeing: "Bem-estar",
};
const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const weekDayNames = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
const timezoneChoices = [
  "America/Sao_Paulo", "America/Manaus", "America/Noronha", "America/Belem", "America/Boa_Vista",
  "America/Cuiaba", "America/Campo_Grande", "America/Porto_Velho", "America/Rio_Branco", "America/Fortaleza",
  "America/Recife", "America/Bahia", "America/Araguaina", "America/Maceio", "America/Santarem",
];
const initialHabits: HabitDraft[] = [
  { id: "walk", title: "Caminhar por 10 minutos", emoji: "🚶", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: true, category: "health" },
  { id: "stretch", title: "Alongar por 5 minutos", emoji: "🧘", scheduleDays: [1, 2, 3, 4, 5], selected: false, category: "health" },
  { id: "water", title: "Tomar um copo de água ao acordar", emoji: "💧", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: false, category: "health" },
  { id: "focus-task", title: "Dedicar 15 minutos a uma tarefa", emoji: "🎯", scheduleDays: [1, 2, 3, 4, 5], selected: false, category: "focus" },
  { id: "daily-priorities", title: "Anotar as três prioridades do dia", emoji: "📝", scheduleDays: [1, 2, 3, 4, 5], selected: false, category: "focus" },
  { id: "screen-break", title: "Fazer uma pausa de 5 minutos sem telas", emoji: "🌿", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: false, category: "focus" },
  { id: "read", title: "Ler por 10 minutos", emoji: "📚", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: true, category: "studies" },
  { id: "study", title: "Estudar um assunto por 15 minutos", emoji: "✏️", scheduleDays: [1, 2, 3, 4, 5], selected: false, category: "studies" },
  { id: "review-notes", title: "Revisar anotações por 5 minutos", emoji: "🔎", scheduleDays: [1, 3, 5], selected: false, category: "studies" },
  { id: "organize", title: "Organizar um espaço pequeno", emoji: "🧺", scheduleDays: [1, 2, 3, 4, 5], selected: false, category: "organization" },
  { id: "plan-tomorrow", title: "Planejar o primeiro passo de amanhã", emoji: "📅", scheduleDays: [1, 2, 3, 4, 5], selected: false, category: "organization" },
  { id: "put-away-five", title: "Guardar cinco coisas fora do lugar", emoji: "🧹", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: false, category: "organization" },
  { id: "breathe", title: "Respirar com calma por 2 minutos", emoji: "🌬️", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: false, category: "wellbeing" },
  { id: "outside", title: "Ficar 10 minutos ao ar livre", emoji: "☀️", scheduleDays: [1, 3, 5, 6, 7], selected: false, category: "wellbeing" },
  { id: "enjoyable", title: "Reservar 10 minutos para algo prazeroso", emoji: "🌼", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: false, category: "wellbeing" },
];
const subscribeTimezone = () => () => undefined;
const getBrowserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
const getServerTimezone = () => "America/Sao_Paulo";

export function OnboardingWizard({ name }: { name: string }) {
  const router = useRouter();
  const browserTimezone = useSyncExternalStore(subscribeTimezone, getBrowserTimezone, getServerTimezone);
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [areas, setAreas] = useState<FocusArea[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);
  const [habits, setHabits] = useState(initialHabits);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const timezone = selectedTimezone ?? browserTimezone;
  const selectedHabits = useMemo(() => habits.filter((habit) => habit.selected), [habits]);
  const availableTimezones = useMemo(() => [...new Set([browserTimezone, ...timezoneChoices])], [browserTimezone]);

  function toggleArea(area: FocusArea) {
    setError("");
    setAreas((current) => current.includes(area)
      ? current.filter((item) => item !== area)
      : current.length < 2 ? [...current, area] : current);
    if (!areas.includes(area) && areas.length >= 2) setError("Escolha até duas áreas para começar.");
  }

  function toggleHabit(id: string) {
    setError("");
    const habit = habits.find((item) => item.id === id);
    if (!habit) return;
    if (!habit.selected && selectedHabits.length >= 3) {
      setError("A jornada começa com até três hábitos.");
      return;
    }
    setHabits((current) => current.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  }

  function updateHabit(id: string, update: Partial<HabitDraft>) {
    setHabits((current) => current.map((habit) => habit.id === id ? { ...habit, ...update } : habit));
  }

  function addCustomHabit() {
    if (selectedHabits.length >= 3) {
      setError("A jornada começa com até três hábitos.");
      return;
    }
    const id = `custom-${crypto.randomUUID()}`;
    setHabits((current) => [...current, { id, title: "", emoji: "", scheduleDays: [1, 2, 3, 4, 5, 6, 7], selected: true, category: "custom" }]);
    setError("");
  }

  function continueFromGoal() {
    setError("");
    if (areas.length < 1) return setError("Escolha pelo menos uma área.");
    if (!goal.trim()) return setError("Escreva um objetivo para esta jornada.");
    if (goal.trim().length > 120) return setError("Use até 120 caracteres no objetivo.");
    setStep(2);
  }

  function continueFromHabits() {
    setError("");
    if (selectedHabits.length < 1 || selectedHabits.length > 3) return setError("Escolha de um a três hábitos.");
    if (selectedHabits.some(({ title, scheduleDays }) => !title.trim() || title.trim().length > 80 || scheduleDays.length === 0)) {
      return setError("Cada hábito precisa de um nome e pelo menos um dia da semana.");
    }
    setStep(3);
  }

  async function startJourney() {
    const payload = {
      goal: goal.trim(),
      focusAreas: areas,
      timezone,
      habits: selectedHabits.map(({ title, emoji, scheduleDays }) => ({
        title: title.trim(),
        ...(emoji.trim() ? { emoji: emoji.trim() } : {}),
        scheduleDays,
      })),
    };
    const validation = onboardingSchema.safeParse(payload);
    if (!validation.success) {
      setError("Revise seu objetivo e os hábitos escolhidos.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const result = await response.json() as { error?: { code?: string; message?: string } };
      if (response.status === 409 && result.error?.code === "JOURNEY_ALREADY_ACTIVE") {
        router.replace("/app");
        router.refresh();
        return;
      }
      if (!response.ok) throw new Error(result.error?.message ?? "Não foi possível iniciar sua jornada agora.");
      router.replace("/app");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível iniciar sua jornada agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <Link className="brand" href="/" aria-label="Reset, início"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>reset<span className="brand-period">.</span></span></Link>
        <div className="onboarding-user"><span>Olá, {name.split(" ")[0]}</span><SignOutButton /></div>
      </header>
      <section className="onboarding-wrap" aria-labelledby="onboarding-title">
        <div className="onboarding-progress">
          <div className="onboarding-progress-copy"><span>SUA JORNADA DE 66 DIAS</span><span>Etapa {step} de 3</span></div>
          <div className="onboarding-progress-track" role="progressbar" aria-label="Progresso da configuração" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}><span style={{ width: `${(step / 3) * 100}%` }} /></div>
        </div>

        {step === 1 && <div className="onboarding-content">
          <span className="auth-kicker">UM COMEÇO NO SEU RITMO</span>
          <h1 id="onboarding-title">O que você quer cultivar?</h1>
          <p className="onboarding-lede">Uma direção simples ajuda a escolher passos que cabem na sua vida real.</p>
          <fieldset className="focus-fieldset">
            <legend>Quais áreas quer priorizar? <small>Escolha até duas</small></legend>
            <div className="focus-options">{focusAreaValues.map((area) => <button key={area} className={`focus-option${areas.includes(area) ? " selected" : ""}`} type="button" aria-pressed={areas.includes(area)} onClick={() => toggleArea(area)}><span aria-hidden="true">{areas.includes(area) ? "✓" : "+"}</span>{areaLabels[area]}</button>)}</div>
          </fieldset>
          <label className="onboarding-label">Sua meta para esta jornada<textarea maxLength={120} rows={3} placeholder="Ex.: ter mais energia no dia a dia" value={goal} onChange={(event) => setGoal(event.target.value)} aria-describedby="goal-count" /></label>
          <div className="goal-meta" id="goal-count"><span>Uma frase curta já basta.</span><span>{goal.length}/120</span></div>
          <label className="onboarding-label timezone-label">Seu fuso horário
            <select value={timezone} onChange={(event) => setSelectedTimezone(event.target.value)}>{availableTimezones.map((zone) => <option value={zone} key={zone}>{zone}{zone === browserTimezone ? " · sugerido pelo seu dispositivo" : ""}</option>)}</select>
          </label>
          <p className="onboarding-footnote">Usamos o fuso para organizar cada novo dia. Seu histórico mantém as datas já registradas.</p>
          {error && <p className="auth-feedback error-feedback" role="alert">{error}</p>}
          <button className="auth-button onboarding-next" type="button" onClick={continueFromGoal}>Continuar <span aria-hidden="true">→</span></button>
        </div>}

        {step === 2 && <div className="onboarding-content">
          <span className="auth-kicker">PASSOS POSSÍVEIS</span>
          <h1 id="onboarding-title">Escolha seus primeiros hábitos.</h1>
          <p className="onboarding-lede">Comece com um a três. Você poderá ajustar sua rotina depois.</p>
          <div className="habit-picks">
            {[
              ...focusAreaValues.map((area) => ({ id: area, title: areaLabels[area], items: habits.filter((habit) => habit.category === area) })),
              { id: "custom" as const, title: "Criados por você", items: habits.filter((habit) => habit.category === "custom") },
            ].filter((group) => group.items.length > 0).map((group) => <section className="habit-pick-group" key={group.id} aria-labelledby={`habit-group-${group.id}`}>
              <h2 id={`habit-group-${group.id}`}>{group.title}</h2>
              <div className="habit-pick-list">{group.items.map((habit) => <article className={`habit-pick${habit.selected ? " is-selected" : ""}`} key={habit.id}>
                <label className="habit-pick-choice"><input type="checkbox" checked={habit.selected} onChange={() => toggleHabit(habit.id)} /><span className="habit-pick-emoji" aria-hidden="true">{habit.emoji || "✳"}</span><span>{habit.id.startsWith("custom-") ? "Seu hábito" : habit.title}</span></label>
                {habit.selected && <div className="habit-pick-editor">
                  <label className="onboarding-label">Nome do hábito<input maxLength={80} value={habit.title} onChange={(event) => updateHabit(habit.id, { title: event.target.value })} /></label>
                  <label className="onboarding-label emoji-field">Símbolo <input maxLength={16} value={habit.emoji} onChange={(event) => updateHabit(habit.id, { emoji: event.target.value })} aria-label={`Símbolo para ${habit.title || "novo hábito"}`} /></label>
                  <fieldset className="schedule-fieldset"><legend>Em quais dias?</legend><div className="schedule-days">{weekDays.map((day, index) => {
                    const value = index + 1;
                    const active = habit.scheduleDays.includes(value);
                    return <button key={day} type="button" className={active ? "active" : ""} aria-pressed={active} aria-label={`${weekDayNames[index]}${active ? " agendado" : " não agendado"}`} onClick={() => updateHabit(habit.id, { scheduleDays: active ? habit.scheduleDays.filter((item) => item !== value) : [...habit.scheduleDays, value].sort((a, b) => a - b) })}>{day}</button>;
                  })}</div></fieldset>
                </div>}
              </article>)}</div>
            </section>)}
          </div>
          {selectedHabits.length < 3 && <button className="add-habit-button" type="button" onClick={addCustomHabit}><span aria-hidden="true">＋</span> Criar um hábito do zero</button>}
          {error && <p className="auth-feedback error-feedback" role="alert">{error}</p>}
          <div className="onboarding-button-row"><button className="auth-button secondary-button" type="button" onClick={() => { setError(""); setStep(1); }}>Voltar</button><button className="auth-button" type="button" onClick={continueFromHabits}>Revisar jornada <span aria-hidden="true">→</span></button></div>
        </div>}

        {step === 3 && <div className="onboarding-content review-content">
          <span className="auth-kicker">QUASE LÁ</span>
          <h1 id="onboarding-title">Seu novo ritmo começa pequeno.</h1>
          <p className="onboarding-lede">Uma jornada inspiracional de 66 dias, sem promessas de perfeição. Você pode continuar no seu próprio tempo.</p>
          <div className="review-card"><span className="review-card-kicker">SUA META</span><p>{goal.trim()}</p><div className="review-areas">{areas.map((area) => <span key={area}>{areaLabels[area]}</span>)}</div></div>
          <div className="review-card"><div className="review-habits-heading"><span className="review-card-kicker">SEUS PRIMEIROS HÁBITOS</span><span>{selectedHabits.length} escolhidos</span></div><ul>{selectedHabits.map((habit) => <li key={habit.id}><span className="review-emoji" aria-hidden="true">{habit.emoji || "✳"}</span><span>{habit.title.trim()}<small>{habit.scheduleDays.length === 7 ? "Todos os dias" : `${habit.scheduleDays.length} dias por semana`}</small></span></li>)}</ul></div>
          <p className="onboarding-footnote">Fuso horário: {timezone}. As datas da jornada seguem esse calendário local.</p>
          {error && <p className="auth-feedback error-feedback" role="alert">{error}</p>}
          <div className="onboarding-button-row"><button className="auth-button secondary-button" type="button" onClick={() => { setError(""); setStep(2); }} disabled={busy}>Voltar</button><button className="auth-button" type="button" onClick={startJourney} disabled={busy}>{busy ? "Preparando sua jornada…" : "Iniciar minha jornada"}</button></div>
        </div>}
      </section>
      <footer className="auth-footer">Pequenas ações, progresso real. <span>© 2026 Reset</span></footer>
    </main>
  );
}
