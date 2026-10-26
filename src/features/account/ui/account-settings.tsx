"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

type AccountSettingsProps = {
  initialName: string;
  initialTimezone: string;
  email: string;
};

export function AccountSettings({ initialName, initialTimezone, email }: AccountSettingsProps) {
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setProfileMessage("");
    setSaved(false);
    try {
      const response = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone }),
      });
      if (!response.ok) throw new Error("Não foi possível salvar suas preferências. Confira os dados e tente novamente.");
      setSaved(true);
      setProfileMessage("Preferências salvas.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Não foi possível salvar suas preferências.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== "EXCLUIR" || !password) return;
    setDeleting(true);
    setDeleteMessage("");
    setSaved(false);
    try {
      const result = await authClient.deleteUser({ password });
      if (result.error) throw new Error("delete_failed");
      window.location.assign("/");
    } catch {
      setDeleteMessage("Não foi possível excluir a conta. Confira a senha e tente novamente.");
      setDeleting(false);
    }
  }

  return (
    <div className="settings-layout">
      <section className="settings-card" aria-labelledby="profile-title">
        <span className="auth-kicker">SUA CONTA</span>
        <h2 id="profile-title">Perfil e preferências</h2>
        <p>O fuso horário define a data usada no seu dia e no diário.</p>
        <form className="settings-form" onSubmit={saveProfile}>
          <label className="auth-label" htmlFor="profile-name">Nome</label>
          <input id="profile-name" className="auth-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
          <label className="auth-label" htmlFor="profile-email">E-mail</label>
          <input id="profile-email" className="auth-input" value={email} readOnly aria-describedby="email-note" />
          <span id="email-note" className="settings-hint">A troca de e-mail ainda não está disponível.</span>
          <label className="auth-label" htmlFor="profile-timezone">Fuso horário</label>
          <input id="profile-timezone" className="auth-input" value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={64} required />
          <span className="settings-hint">Informe um fuso IANA, por exemplo America/Sao_Paulo.</span>
          <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar preferências"}</button>
          {profileMessage && <p className={saved ? "settings-message" : "settings-message settings-error"} role="status">{profileMessage}</p>}
        </form>
        <a className="settings-export" href="/api/v1/me/export">Baixar uma cópia dos meus dados (JSON)</a>
      </section>

      <section className="settings-card settings-danger" aria-labelledby="delete-title">
        <span className="auth-kicker">AÇÃO PERMANENTE</span>
        <h2 id="delete-title">Excluir minha conta</h2>
        <p>A conta e os dados do banco principal serão removidos. Os prazos de cópias de segurança serão publicados antes do lançamento. Esta ação não pode ser desfeita.</p>
        <form className="settings-form" onSubmit={deleteAccount}>
          <label className="auth-label" htmlFor="delete-confirmation">Digite EXCLUIR para confirmar</label>
          <input id="delete-confirmation" className="auth-input" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" required />
          <label className="auth-label" htmlFor="delete-password">Confirme sua senha atual</label>
          <input id="delete-password" className="auth-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          <button className="settings-delete-button" type="submit" disabled={deleting || confirmation !== "EXCLUIR" || !password}>
            {deleting ? "Excluindo…" : "Excluir conta e dados"}
          </button>
          {deleteMessage && <p className="settings-message settings-error" role="status">{deleteMessage}</p>}
        </form>
      </section>
    </div>
  );
}
