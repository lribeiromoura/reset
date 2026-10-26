"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "signup" | "signin";

const headings: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
  signup: { eyebrow: "UM COMEÇO LEVE", title: "Crie seu espaço.", description: "Uma conta simples para acompanhar o que importa no seu ritmo." },
  signin: { eyebrow: "QUE BOM TER VOCÊ DE VOLTA", title: "Entre no seu espaço.", description: "Retome de onde você está, um passo por vez." },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const content = headings[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL: "/onboarding" });
        if (result.error) throw new Error(result.error.message);
        router.replace("/onboarding");
        router.refresh();
      } else if (mode === "signin") {
        const result = await authClient.signIn.email({ email: email.trim(), password, callbackURL: "/onboarding" });
        if (result.error) throw new Error(result.error.message);
        router.replace("/onboarding");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <span className="auth-kicker">{content.eyebrow}</span>
      <h1>{content.title}</h1>
      <p className="auth-description">{content.description}</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "signup" && <label>Seu nome<input autoComplete="name" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} /></label>}
        <label>E-mail<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Senha<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} /><small>{mode === "signin" ? "" : "Pelo menos 12 caracteres."}</small></label>
        {error && <p className="auth-feedback error-feedback" role="alert">{error}</p>}
        <button className="auth-button" type="submit" disabled={busy}>{busy ? "Aguarde…" : buttonLabel(mode)}</button>
      </form>
      <div className="auth-links">
        {mode === "signup" && <span>Já tem conta? <Link href="/entrar">Entrar</Link></span>}
        {mode === "signin" && <Link href="/cadastro">Criar conta</Link>}
      </div>
    </section>
  );
}

function buttonLabel(mode: AuthMode) {
  return ({ signup: "Criar minha conta", signin: "Entrar" })[mode];
}
