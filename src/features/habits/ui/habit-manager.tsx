"use client";

import { useState, type FormEvent } from "react";

const days = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" },
];

type Habit = {
  id: string;
  title: string;
  emoji: string | null;
  status: "active" | "archived";
  archivedOn: string | null;
  scheduleDays: number[];
  schedules: Array<{ effectiveFrom: string; scheduleDays: number[] }>;
};

type ApiResponse<T> = {
  data?: T;
  error?: { message?: string };
};

export function HabitManager({ initialHabits }: { initialHabits: Habit[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newScheduleDays, setNewScheduleDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeHabits = habits.filter((habit) => habit.status === "active");
  const archivedHabits = habits.filter((habit) => habit.status === "archived");

  function updateHabitDraft(habitId: string, update: Partial<Pick<Habit, "title" | "emoji" | "scheduleDays">>) {
    setHabits((current) => current.map((habit) => habit.id === habitId ? { ...habit, ...update } : habit));
  }

  function toggleSchedule(current: number[], day: number) {
    return current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((left, right) => left - right);
  }

  function errorMessage(caught: unknown, fallback: string) {
    return caught instanceof Error && caught.name !== "SyntaxError" ? caught.message : fallback;
  }

  async function createHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newScheduleDays.length === 0 || busy) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/v1/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, emoji: newEmoji || null, scheduleDays: newScheduleDays }),
      });
      const result = await response.json() as ApiResponse<Habit>;
      if (!response.ok || !result.data) throw new Error(result.error?.message || "Não foi possível criar o hábito.");
      setHabits((current) => [result.data!, ...current]);
      setNewTitle("");
      setNewEmoji("");
      setNewScheduleDays([1, 2, 3, 4, 5, 6, 7]);
      setMessage("Hábito criado. Ele já está disponível na sua agenda.");
    } catch (caught) {
      setError(errorMessage(caught, "Não foi possível criar agora. Tente novamente."));
    } finally {
      setBusy(false);
    }
  }

  async function saveHabit(habit: Habit) {
    if (habit.scheduleDays.length === 0 || busy) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/habits/${habit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: habit.title, emoji: habit.emoji, scheduleDays: habit.scheduleDays }),
      });
      const result = await response.json() as ApiResponse<Partial<Habit> & Pick<Habit, "id">>;
      if (!response.ok || !result.data) throw new Error(result.error?.message || "Não foi possível salvar as alterações.");
      setHabits((current) => current.map((item) => item.id === habit.id ? {
        ...item,
        ...result.data,
        scheduleDays: result.data!.scheduleDays ?? item.scheduleDays,
      } : item));
      setMessage("Alterações salvas. A nova agenda começa amanhã.");
    } catch (caught) {
      setError(errorMessage(caught, "Não foi possível salvar agora. Tente novamente."));
    } finally {
      setBusy(false);
    }
  }

  async function archiveHabit(habit: Habit) {
    if (busy || !window.confirm(`Arquivar “${habit.title}”? O histórico será preservado e ele sairá das missões futuras.`)) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/habits/${habit.id}`, { method: "DELETE" });
      const result = await response.json() as ApiResponse<{ id: string; status: "archived"; archivedOn: string }>;
      if (!response.ok || !result.data) throw new Error(result.error?.message || "Não foi possível arquivar o hábito.");
      setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, status: "archived", archivedOn: result.data!.archivedOn } : item));
      setMessage("Hábito arquivado. Seu histórico foi preservado.");
    } catch (caught) {
      setError(errorMessage(caught, "Não foi possível arquivar agora. Tente novamente."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="habit-manager">
      <p className="habit-manager-note">Você pode manter até cinco hábitos ativos. Mudanças na agenda começam amanhã.</p>
      {error && <p className="habit-manager-feedback error-feedback" role="alert">{error}</p>}
      {message && <p className="habit-manager-feedback success-feedback" role="status">{message}</p>}

      {activeHabits.length < 5 && (
        <form className="habit-create-card" onSubmit={(event) => void createHabit(event)}>
          <h2>Adicionar um hábito</h2>
          <div className="habit-edit-fields">
            <label>Nome do hábito<input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={80} required /></label>
            <label className="habit-emoji-input">Emoji<input aria-label="Emoji opcional" value={newEmoji} onChange={(event) => setNewEmoji(event.target.value)} maxLength={16} placeholder="✳" /></label>
          </div>
          <fieldset className="habit-days-fieldset">
            <legend>Em quais dias?</legend>
            <div className="habit-day-options">
              {days.map((day) => (
                <label key={day.value} className={newScheduleDays.includes(day.value) ? "selected" : ""}>
                  <input type="checkbox" checked={newScheduleDays.includes(day.value)} onChange={() => setNewScheduleDays((current) => toggleSchedule(current, day.value))} />
                  {day.label}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="auth-button" type="submit" disabled={busy || activeHabits.length >= 5 || newScheduleDays.length === 0}>
            {busy ? "Aguarde…" : "Adicionar hábito"}
          </button>
        </form>
      )}

      {activeHabits.length ? (
        <section className="habit-list-section" aria-labelledby="active-habits-heading">
          <h2 id="active-habits-heading">Seus hábitos ativos <span>{activeHabits.length}/5</span></h2>
          <ul className="habit-manager-list">
            {activeHabits.map((habit) => (
              <li key={habit.id} className="habit-manager-card">
                <div className="habit-edit-fields">
                  <label>Nome do hábito<input value={habit.title} onChange={(event) => updateHabitDraft(habit.id, { title: event.target.value })} maxLength={80} required /></label>
                  <label className="habit-emoji-input">Emoji<input aria-label={`Emoji de ${habit.title}`} value={habit.emoji ?? ""} onChange={(event) => updateHabitDraft(habit.id, { emoji: event.target.value || null })} maxLength={16} placeholder="✳" /></label>
                </div>
                <fieldset className="habit-days-fieldset">
                  <legend>Agenda atual</legend>
                  <div className="habit-day-options">
                    {days.map((day) => (
                      <label key={day.value} className={habit.scheduleDays.includes(day.value) ? "selected" : ""}>
                        <input type="checkbox" checked={habit.scheduleDays.includes(day.value)} onChange={() => updateHabitDraft(habit.id, { scheduleDays: toggleSchedule(habit.scheduleDays, day.value) })} />
                        {day.label}
                      </label>
                    ))}
                  </div>
                  <small>A agenda atualizada passa a valer amanhã.</small>
                </fieldset>
                <div className="habit-manager-actions">
                  <button className="auth-button" type="button" disabled={busy || habit.scheduleDays.length === 0} onClick={() => void saveHabit(habit)}>{busy ? "Aguarde…" : "Salvar alterações"}</button>
                  <button className="habit-archive-button" type="button" disabled={busy} onClick={() => void archiveHabit(habit)}>Arquivar</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : <div className="today-empty"><span aria-hidden="true">✳</span><p>Você ainda não tem hábitos ativos. Adicione um pequeno passo para sua rotina.</p></div>}

      {archivedHabits.length > 0 && (
        <details className="archived-habits">
          <summary>Hábitos arquivados ({archivedHabits.length})</summary>
          <ul>{archivedHabits.map((habit) => <li key={habit.id}><span>{habit.emoji || "✳"} {habit.title}</span><small>Arquivado em {habit.archivedOn}</small></li>)}</ul>
          <p>Para voltar a usar um hábito arquivado, crie um novo hábito. O histórico continua guardado.</p>
        </details>
      )}
    </div>
  );
}
