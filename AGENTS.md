# Instruções do projeto Reset

Leia `README.md` e `specs/reset-spec-driven.md` antes de implementar mudanças. A especificação e o contrato OpenAPI que forem adicionados ao projeto serão a fonte de verdade.

- Trabalhe em um slice por vez e registre os requisitos `FR-*`, regras `BR-*` e critérios `AC-*` atendidos.
- Não invente requisitos de produto; atualize a spec junto com alterações de escopo.
- Use marca, textos e visuais originais. Não reutilize conteúdo proprietário de produtos de referência.
- Não adicione serviços pagos, credenciais ou dados pessoais reais.
- Inputs externos devem ser validados; operações privadas devem verificar a sessão e restringir consultas ao usuário autenticado.
- Lógica de domínio deve ser pura e independente de React; operações compostas devem usar transação e restrições únicas quando apropriado.
- Use versões estáveis e atualize evidências de validação ao concluir cada slice.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
