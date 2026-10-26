import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <span className="auth-kicker">RESET</span>
      <h1>Você está sem conexão.</h1>
      <p>Suas páginas privadas não ficam salvas neste aparelho. Quando a conexão voltar, atualize para continuar sua jornada com segurança.</p>
      <Link href="/">Tentar novamente</Link>
    </main>
  );
}
