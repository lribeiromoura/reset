"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Não foi possível sair agora.");
      router.replace("/entrar");
      router.refresh();
    } catch {
      setError("Não foi possível sair agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return <div>{error && <p className="auth-feedback error-feedback" role="alert">{error}</p>}<button className="auth-button secondary-button" onClick={signOut} disabled={busy} type="button">{busy ? "Saindo…" : "Sair da conta"}</button></div>;
}
