"use client";

import { useState } from "react";

type Mission = {
  id: string;
  title: string;
  emoji: string | null;
  completed: boolean;
};

type TodayMissionsProps = {
  habits: Mission[];
  scheduledCount: number;
  completedCount: number;
  totalXp: number;
};

type CompletionResponse = {
  data?: { completed: boolean; xpDelta: number };
  error?: { message?: string };
};

export function TodayMissions({ habits, scheduledCount, completedCount, totalXp }: TodayMissionsProps) {
  const [missions, setMissions] = useState(habits);
  const [completed, setCompleted] = useState(completedCount);
  const [xp, setXp] = useState(totalXp);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleMission(mission: Mission) {
    if (pendingId) return;
    const previousMissions = missions;
    const previousCompleted = completed;
    const previousXp = xp;
    const nextCompleted = !mission.completed;
    const optimisticXpDelta = nextCompleted ? 10 : -10;

    setError("");
    setPendingId(mission.id);
    setMissions((current) => current.map((item) => item.id === mission.id ? { ...item, completed: nextCompleted } : item));
    setCompleted((current) => current + (nextCompleted ? 1 : -1));
    setXp((current) => current + optimisticXpDelta);

    try {
      const response = await fetch(`/api/v1/habits/${mission.id}/completions/today`, {
        method: nextCompleted ? "POST" : "DELETE",
        headers: nextCompleted ? { "Content-Type": "application/json" } : undefined,
        body: nextCompleted ? "{}" : undefined,
      });
      const result = await response.json() as CompletionResponse;
      if (!response.ok || !result.data) {
        throw new Error(result.error?.message || "Não foi possível salvar esta missão.");
      }

      setMissions((current) => current.map((item) => item.id === mission.id ? { ...item, completed: result.data!.completed } : item));
      setCompleted((current) => current + ((result.data!.completed ? 1 : 0) - (nextCompleted ? 1 : 0)));
      setXp((current) => current + (result.data!.xpDelta - optimisticXpDelta));
    } catch (caught) {
      setMissions(previousMissions);
      setCompleted(previousCompleted);
      setXp(previousXp);
      setError(caught instanceof Error && caught.name !== "SyntaxError"
        ? caught.message
        : "Não foi possível salvar agora. Verifique sua conexão e tente novamente.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="today-mission-summary" aria-live="polite">
        <span>{completed} de {scheduledCount} {scheduledCount === 1 ? "missão concluída" : "missões concluídas"}</span>
        <span className="today-xp-total">{xp} XP na jornada</span>
      </div>
      {error && <p className="today-mission-error" role="alert">{error}</p>}
      <ul className="today-habit-list">
        {missions.map((mission) => (
          <li key={mission.id}>
            <button
              type="button"
              className={`today-mission-button${mission.completed ? " is-completed" : ""}`}
              aria-label={mission.completed ? `Desfazer conclusão: ${mission.title}` : `Concluir: ${mission.title}`}
              aria-pressed={mission.completed}
              aria-busy={pendingId === mission.id}
              disabled={pendingId !== null}
              onClick={() => void toggleMission(mission)}
            >
              <span className="today-habit-emoji" aria-hidden="true">{mission.emoji || "✳"}</span>
              <span className="today-mission-copy">{mission.title}<small>{mission.completed ? "Concluído · toque para desfazer" : "Missão planejada"}</small></span>
              <span className="today-mission-action" aria-hidden="true">{mission.completed ? "✓" : "○"}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
