# Evidências — 007-release

Base: branch `feat/007-release`, criada sobre `main` após merge da PR #8 (commit `387faaa`). Ambiente local Windows, Node/npm do workspace; testes SQL via PGlite isolado. Sem alegação de benchmark ou validação em nuvem ainda.

## 007-T1 — Matriz funcional e rede

- Requisito: cobrir 1v1/2v2, placar 6–5, abandono, reconexão, token expirado, spam, resultado duplicado e reinício do servidor cancelando a partida.
- Cenário: matriz detalhada em `docs/acceptance/007-functional-network.md`; cenários automatizados em testes de domínio/servidor e script SQL local. O shutdown gracioso cancela partidas ativas com `server_failure`, tenta persistir resultado com winner nulo e depois fecha o transporte.
- Comandos/resultados: `npm run test --workspace @volleyball-mythics/domain` — 19/19; `npm run test --workspace @volleyball-mythics/server` — 33/33; `node supabase/tests/database/005_match.cjs` — cancelamento, idempotência, conflito, rollback, permissões e regressão normal passaram; `npm run typecheck` e `npm run build` passaram.
- Limitações: testes de navegadores reais e medição sustentada de 10 salas pertencem a T2/T3. A validação SQL usa PGlite e não comprova que a migration 004 esteja aplicada no Supabase remoto. Build web preserva os avisos conhecidos de bundle >500 kB e diretivas `use client` do RN Web.
- Gate: aprovado.
