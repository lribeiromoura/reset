# Reset

Aplicativo web responsivo para apoiar a criação de hábitos, em português brasileiro. O nome é provisório, conforme a especificação.

## Estado da implementação

O slice **S0 — Fundação** inclui a landing page original e a base da aplicação. O slice **S1 — Autenticação** adiciona cadastro com verificação obrigatória, login, logout, recuperação de senha, sessões Better Auth e proteção server-side. O slice **S2 — Onboarding e jornada** cria perfil, objetivo e de um a três hábitos iniciais, além de iniciar a jornada de 66 dias em transação. O código dos slices **S3 — Hoje e conclusão**, **S4 — Gerenciamento de hábitos** e **S5 — Progresso e diário** inclui missões, conclusão e XP, CRUD e agendas de hábitos, resumo semanal, sequências e diário opcional. O código parcial de **S6 — Perfil, privacidade e PWA** inclui preferências, exportação, exclusão reautenticada, fallback offline, health check e runbook de operação. A validação foi reservada ao ambiente Vercel; revisão final de privacidade, configuração dos provedores e deploy permanecem pendentes.

O cadastro, as sessões e os e-mails dependem de PostgreSQL e SMTP configurados por ambiente. O projeto usa uma URL PostgreSQL padrão e SMTP configurável; nenhum provedor específico é definido no código.

## Desenvolvimento local

Requer Node.js 20.9+ e pnpm. Para executar o app, configure `.env.local` a partir de `.env.example` com uma URL PostgreSQL, segredo Better Auth e SMTP. Para preview/produção, configure as mesmas variáveis nos ambientes correspondentes do Vercel. O app ficará disponível em `http://localhost:3000` quando esses serviços estiverem acessíveis.

Scripts disponíveis: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:studio` e `auth:schema`. Depois de configurar um banco de desenvolvimento, gere e revise migrations com `pnpm db:generate` antes de aplicá-las com `pnpm db:migrate`. As migrations versionadas estão em `drizzle/`; a migration S2 só cria tabelas e índices do domínio.

## Próximos slices

Validação dos S3/S4/S5/S6 no Vercel → completar revisão de privacidade, configurar serviços/alertas e fazer deploy.
