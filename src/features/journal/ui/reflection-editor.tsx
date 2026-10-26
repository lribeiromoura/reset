"use client";

import { useState, type FormEvent } from "react";

const moods = [
  { value: 1, label: "Muito difícil", icon: "☁" },
  { value: 2, label: "Difícil", icon: "◔" },
  { value: 3, label: "Mais ou menos", icon: "◌" },
  { value: 4, label: "Bem", icon: "◕" },
  { value: 5, label: "Muito bem", icon: "☀" },
];

type Reflection = { mood: number; text: string | null } | null;
type ApiResponse<T> = { data?: T; error?: { message?: string } };

export function ReflectionEditor({ initialReflection }: { initialReflection: Reflection }) {
  const [mood, setMood] = useState(initialReflection?.mood ?? 0);
  const [text, setText] = useState(initialReflection?.text ?? "");
  const [saved, setSaved] = useState(Boolean(initialReflection));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function saveReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mood < 1 || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/reflections/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, text: text.trim() || null }),
      });
      const result = await response.json() as ApiResponse<Reflection>;
      if (!response.ok || !result.data) throw new Error(result.error?.message || "Não foi possível salvar sua reflexão.");
      setMood(result.data.mood);
      setText(result.data.text ?? "");
      setSaved(true);
      setMessage("Reflexão salva. Seu registro fica privado.");
    } catch (caught) {
      setError(caught instanceof Error && caught.name !== "SyntaxError" ? caught.message : "Não foi possível salvar agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReflection() {
    if (busy || !window.confirm("Apagar a reflexão de hoje? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/reflections/today", { method: "DELETE" });
      const result = await response.json() as ApiResponse<{ deleted: boolean }>;
      if (!response.ok || !result.data) throw new Error(result.error?.message || "Não foi possível apagar sua reflexão.");
      setMood(0);
      setText("");
      setSaved(false);
      setMessage("Reflexão apagada.");
    } catch (caught) {
      setError(caught instanceof Error && caught.name !== "SyntaxError" ? caught.message : "Não foi possível apagar agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reflection-card">
      <p className="reflection-private-note">Este espaço é opcional e privado. Escreva apenas o que fizer sentido para você.</p>
      {error && <p className="habit-manager-feedback error-feedback" role="alert">{error}</p>}
      {message && <p className="habit-manager-feedback success-feedback" role="status">{message}</p>}
      <form onSubmit={(event) => void saveReflection(event)}>
        <fieldset className="mood-fieldset">
          <legend>Como você está se sentindo hoje?</legend>
          <div className="mood-options">
            {moods.map((option) => (
              <label key={option.value} className={mood === option.value ? "selected" : ""}>
                <input type="radio" name="mood" value={option.value} checked={mood === option.value} onChange={() => setMood(option.value)} required />
                <span aria-hidden="true">{option.icon}</span>
                <small>{option.label}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="reflection-text-label" htmlFor="reflection-text">Quer registrar algo sobre o seu dia?</label>
        <textarea id="reflection-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={500} rows={6} placeholder="Uma frase já basta. Você também pode deixar em branco." />
        <div className="reflection-form-footer"><small>{text.length}/500 caracteres</small><button className="auth-button" type="submit" disabled={busy || mood < 1}>{busy ? "Aguarde…" : saved ? "Atualizar reflexão" : "Salvar reflexão"}</button></div>
      </form>
      {saved && <button className="reflection-delete-button" type="button" disabled={busy} onClick={() => void deleteReflection()}>Apagar reflexão de hoje</button>}
    </div>
  );
}
