import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="Reset, início">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>reset<span className="brand-period">.</span></span>
        </Link>
      </header>
      <div className="auth-card-wrap">{children}</div>
      <footer className="auth-footer">Pequenas ações, progresso real. <span>© 2026 Reset</span></footer>
    </main>
  );
}
