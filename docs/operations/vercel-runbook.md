# Operação e release do Reset na Vercel

Este runbook é um roteiro para a configuração inicial. O banco, o domínio, os responsáveis e os alertas ainda precisam ser preenchidos no ambiente escolhido. **Não conectar previews ao banco de produção.** Neon está excluído.

## Preparação dos ambientes

Criar ambientes separados para Preview e Production. Configurar `DATABASE_URL`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` por ambiente. `DATABASE_URL_DIRECT` é opcional e deve ser usada apenas na etapa controlada de migrations.

- Production usa banco e credenciais exclusivos de produção.
- Preview usa banco vazio/isolado.
- O domínio de produção precisa estar configurado antes de liberar o acesso.
- Segredos não devem aparecer em logs, commits, `NEXT_PUBLIC_*` ou screenshots.
- Atualizar os avisos de privacidade e termos com entidade responsável, contato, região de armazenamento e retenção real de backups.

## Release checklist

### Antes do preview

- [ ] `pnpm install --frozen-lockfile`, lint, typecheck, testes e build aprovados no CI.
- [ ] Variáveis de Preview configuradas, inclusive banco isolado.
- [ ] Migration revisada em SQL e aplicada somente ao banco de Preview.
- [ ] URL de Preview adicionada explicitamente às origens Better Auth permitidas para Preview.
- [ ] Fluxos críticos revisados: cadastro, login, onboarding, Hoje, hábitos, diário, exportação e exclusão.
- [ ] PWA, fallback offline, teclado, foco e leitor de tela revisados no preview.
- [ ] Content Security Policy definida em modo de relatório/revisada no preview antes de ser aplicada.

### Antes da produção

- [ ] Decisão de provedor PostgreSQL, região, plano, backup/PITR, retenção e responsável registrada.
- [ ] Banco de produção é exclusivo; restauração de backup foi ensaiada em ambiente separado.
- [ ] Domínio HTTPS, URL canônica e trusted origins conferidos.
- [ ] Política de privacidade e termos revisados para a operação real e canal de contato publicado.
- [ ] Plano de monitoramento e alertas para 5xx, indisponibilidade de banco e latência está ativo.
- [ ] Migration aprovada e compatível com a versão que será promovida.
- [ ] Smoke tests pós-deploy aprovados; rollback anterior continua disponível.

Não promover a produção se algum item necessário a dados reais, restauração ou contato de privacidade estiver pendente.

## Monitoramento

`GET /api/health` é um probe de disponibilidade da aplicação e conexão ao banco: responde `200 {"status":"ok"}` ou `503 {"status":"unavailable"}`. A resposta não revela credenciais, endereço do banco nem detalhes da exceção. Configurar o monitor externo/de plataforma para alertar quando o endpoint ficar indisponível; registrar o dono e canal de escalonamento abaixo.

- Responsável de operação: **a definir**.
- Canal de alerta: **a definir**.
- Provedor e retenção dos logs: **a definir no projeto Vercel**.
- Não registrar senhas, tokens, conteúdo de diário, meta ou título de hábito em logs.

## Resposta a incidentes

### Aplicação com erros 5xx

1. Verificar o horário do primeiro erro, a versão implantada e o estado de `/api/health`.
2. Conferir logs da Vercel, removendo ou ocultando qualquer dado pessoal antes de compartilhar.
3. Se o problema começou após uma versão, interromper a promoção e avaliar rollback pelo painel da Vercel.
4. Antes do rollback, confirmar se a migration já foi aplicada e se a versão anterior continua compatível com o schema.
5. Registrar causa, impacto e correção sem incluir dados de usuários.

### PostgreSQL indisponível

1. Confirmar o estado do provedor e se `DATABASE_URL` pertence ao ambiente correto.
2. Não alternar para banco local, banco de Preview ou credenciais de outro ambiente.
3. Corrigir a conexão pelo painel/segredos da Vercel e verificar `/api/health`.
4. Se houve corrupção ou perda de dados, suspender alterações e seguir o procedimento aprovado de restauração/PITR do provedor.

### Rollback e migrations

- Rollback do código pode ser iniciado pela Vercel depois de verificar compatibilidade do schema.
- Não reverter migration automaticamente nem executar `drizzle-kit push` em produção.
- Para mudança destrutiva, interromper releases, preservar backup aprovado e elaborar procedimento revisado de restauração.
- Toda migration de produção deve ter revisão humana, execução controlada e registro do resultado.

## Estado atual

O projeto Reset está conectado ao repositório GitHub, à Vercel e ao Supabase existente. O segredo Better Auth e a URL pública estão configurados em Production. As migrations do banco ainda precisam ser aplicadas antes do fluxo de cadastro/login funcionar. A V1 não usa SMTP, confirmação de e-mail ou recuperação de senha.
