# Evidências — 007-release

Base: branch `feat/007-release`, criada sobre `main` após merge da PR #8 (commit `387faaa`). Ambiente local Windows, Node/npm do workspace; testes SQL via PGlite isolado. Sem alegação de benchmark ou validação em nuvem ainda.

## 007-T1 — Matriz funcional e rede

- Requisito: cobrir 1v1/2v2, placar 6–5, abandono, reconexão, token expirado, spam, resultado duplicado e reinício do servidor cancelando a partida.
- Cenário: matriz detalhada em `docs/acceptance/007-functional-network.md`; cenários automatizados em testes de domínio/servidor e script SQL local. O shutdown gracioso cancela partidas ativas com `server_failure`, tenta persistir resultado com winner nulo e depois fecha o transporte.
- Comandos/resultados: `npm run test --workspace @volleyball-mythics/domain` — 19/19; `npm run test --workspace @volleyball-mythics/server` — 33/33; `node supabase/tests/database/005_match.cjs` — cancelamento, idempotência, conflito, rollback, permissões e regressão normal passaram; `npm run typecheck` e `npm run build` passaram.
- Limitações: testes de navegadores reais e medição sustentada de 10 salas pertencem a T2/T3. A validação SQL usa PGlite e não comprova que a migration 004 esteja aplicada no Supabase remoto. Build web preserva os avisos conhecidos de bundle >500 kB e diretivas `use client` do RN Web.
- Gate: aprovado.

## 007-T2 — Carga e desempenho

- Requisito: dez salas 2v2 sustentadas por 15 minutos, p95 do tick <=16,7 ms; quatro clientes sob RTT 150 ms/jitter 30 ms sem divergência persistente de placar.
- Cenários/comandos: `node docs/benchmarks/007-load.mjs` executou 900 s, 10 salas/40 participantes, simulação 60 Hz e serialização/fanout dos snapshots. `node --test apps/server/tests/network-latency.test.mjs` usou quatro WebSocket clients locais com 60–90 ms por direção (RTT configurado 120–180 ms, jitter pico a pico 30 ms); cada cliente enviou inputs durante o jogo e os quatro observaram o mesmo placar após estabilizar a entrega.
- Resultado: `docs/benchmarks/007-local.json`: 54.000 chamadas de tick; p95 0,3277 ms (limite 16,7 ms), máximo isolado 27,7776 ms, atraso de agendamento p95 14,107 ms; 180.180 snapshots e 720.720 entregas contabilizadas; 80 partidas reiniciadas ao chegar ao sexto ponto; tick final idêntico nas dez salas. O teste de rede passou sem divergência final. Nenhuma capacidade foi ampliada.
- Ambiente: Windows 10.0.26200, Node v22.14.0, Intel Core i7-1185G7, 8 núcleos lógicos, 15,7 GiB. O benchmark mede o runtime e serialização/fanout local; o atraso de rede é simulado em clientes WebSocket loopback. Este computador não foi declarado hardware de referência e o ensaio não prova latência WAN nem capacidade de produção.
- Gate: aprovado para os limites medidos neste ambiente; manter escala atual até hardware/região de produção serem definidos.
