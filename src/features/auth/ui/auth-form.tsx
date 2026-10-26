"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "signup" | "signin" | "forgot" | "reset" | "verify";

const headings: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
  signup: { eyebrow: "UM COMEÇO LEVE", title: "Crie seu espaço.", description: "Uma conta simples para acompanhar o que importa no seu ritmo." },
  signin: { eyebrow: "QUE BOM TER VOCÊ DE VOLTA", title: "Entre no seu espaço.", description: "Retome de onde você está, um passo por vez." },
  forgot: { eyebrow: "ACESSO À CONTA", title: "Vamos recuperar seu acesso.", description: "Enviaremos instruções para o e-mail associado à conta, se ele existir." },
  reset: { eyebrow: "ACESSO À CONTA", title: "Escolha uma nova senha.", description: "Use uma senha longa que você ainda não usa em outro lugar." },
  verify: { eyebrow: "SÓ FALTA UM PASSO", title: "Confirme seu e-mail.", description: "A confirmação ajuda a manter sua conta protegida." },
};

export function AuthForm({ mode, token = "" }: { mode: AuthMode; token?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const content = headings[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL: "/onboarding" });
        if (result.error) throw new Error(result.error.message);
        setMessage("Se o cadastro foi aceito, enviamos um link de confirmação para seu e-mail.");
      } else if (mode === "signin") {
        const result = await authClient.signIn.email({ email: email.trim(), password, callbackURL: "/onboarding" });
        if (result.error) {
          if (result.error.status === 403) {
            setMessage("Confirme seu e-mail para entrar. Se necessário, solicite outro link abaixo.");
            return;
          }
          throw new Error(result.error.message);
        }
        router.replace("/onboarding");
        router.refresh();
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/redefinir-senha" });
        if (result.error) throw new Error(result.error.message);
        setMessage("Se houver uma conta para esse e-mail, enviaremos instruções de recuperação.");
      } else if (mode === "reset") {
        if (!token) throw new Error("Este link está incompleto ou expirou. Solicite uma nova recuperação.");
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error) throw new Error(result.error.message);
        setMessage("Senha atualizada. Você já pode entrar com sua nova senha.");
      } else {
        const result = await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: "/onboarding" });
        if (result.error) throw new Error(result.error.message);
        setMessage("Se a conta ainda precisar de confirmação, enviaremos um novo link.");
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
        {mode !== "reset" && <label>E-mail<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
        {(mode === "signup" || mode === "signin" || mode === "reset") && <label>Senha<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} /><small>{mode === "signin" ? "" : "Pelo menos 12 caracteres."}</small></label>}
        {error && <p className="auth-feedback error-feedback" role="alert">{error}</p>}
        {message && <p className="auth-feedback success-feedback" role="status">{message}</p>}
        <button className="auth-button" type="submit" disabled={busy}>{busy ? "Aguarde…" : buttonLabel(mode)}</button>
      </form>
      <div className="auth-links">
        {mode === "signup" && <span>Já tem conta? <Link href="/entrar">Entrar</Link></span>}
        {mode === "signin" && <><Link href="/esqueci-senha">Esqueci minha senha</Link><Link href="/cadastro">Criar conta</Link></>}
        {mode === "forgot" && <Link href="/entrar">Voltar para entrar</Link>}
        {mode === "reset" && <Link href="/entrar">Ir para entrar</Link>}
        {mode === "verify" && <><Link href="/entrar">Já confirmei, entrar</Link><Link href="/cadastro">Criar conta</Link></>}
      </div>
    </section>
  );
}

function buttonLabel(mode: AuthMode) {
  return ({ signup: "Criar minha conta", signin: "Entrar", forgot: "Enviar instruções", reset: "Salvar nova senha", verify: "Reenviar confirmação" })[mode];
}
