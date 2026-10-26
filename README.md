# Reset

Aplicativo web responsivo para apoiar a criação de hábitos, em português brasileiro. O nome é provisório, conforme a especificação.

## Estado da implementação

O slice **S0 — Fundação** inclui a landing page original e a base da aplicação. O slice **S1 — Autenticação** oferece cadastro com acesso imediato, login, logout, sessões Better Auth e proteção server-side. A V1 não envia e-mail de confirmação nem de recuperação de senha. O slice **S2 — Onboarding e jornada** cria perfil, objetivo e de um a três hábitos iniciais, além de iniciar a jornada de 66 dias em transação. O onboarding oferece 15 sugestões de ações pequenas, organizadas pelas cinco áreas do Reset e editáveis antes de iniciar. O código dos slices **S3 — Hoje e conclusão**, **S4 — Gerenciamento de hábitos** e **S5 — Progresso e diário** inclui missões, conclusão e XP, CRUD e agendas de hábitos, resumo semanal, sequências e diário opcional. O código parcial de **S6 — Perfil, privacidade e PWA** inclui preferências, exportação, exclusão reautenticada, fallback offline, health check e runbook de operação. A aplicação está publicada na Vercel; as migrations foram aplicadas ao Supabase de produção em 26/10/2026. A validação funcional foi adiada para o ambiente Vercel.

O cadastro e as sessões dependem de PostgreSQL configurado por ambiente. A V1 libera o acesso imediatamente após o cadastro e não envia e-mails de verificação ou recuperação de senha.

## Desenvolvimento local

Requer Node.js 20.9+ e pnpm. Para executar o app, configure `.env.local` a partir de `.env.example` com uma URL PostgreSQL e segredo Better Auth. Para preview/produção, configure as mesmas variáveis nos ambientes correspondentes do Vercel. O app ficará disponível em `http://localhost:3000` quando esses serviços estiverem acessíveis.

Scripts disponíveis: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:studio` e `auth:schema`. Depois de configurar um banco de desenvolvimento, gere e revise migrations com `pnpm db:generate` antes de aplicá-las com `pnpm db:migrate`. As migrations versionadas estão em `drizzle/`; a migration S2 só cria tabelas e índices do domínio.

## Próximos slices

Validação dos S3/S4/S5/S6 no Vercel → completar revisão de privacidade, configurar serviços/alertas e fazer deploy.
