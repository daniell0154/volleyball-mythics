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

## 007-T3 — UX e navegadores

- Implementação: placar/fase/equipe em texto, botões com rótulos e teclas, região de status/alerta, fallback informativo quando WebGL falha, controle de qualidade textual e volume de sinais de ponto ajustável com preferência local. O escopo da versão de tese foi atualizado conforme confirmação do proprietário: Samuel e Caio são iniciais; o elenco pode crescer depois.
- Cenários/comando: `node .test-build/007-smoke.cjs` abriu Chrome e Edge desktop; ambos renderizaram um canvas, mostraram instruções de teclado e não tiveram erros JS. Com `--disable-webgl`, Chrome exibiu o resumo textual de fallback da demonstração.
- Navegadores/versões: Chrome 157.0.8103.79 e Edge 157.0.4341.60 passaram smoke. Firefox não está instalado; Safari requer macOS e não foi executado. O fallback de partida online e o controle de volume com uma sessão conectada não foram exercitados no browser.
- Limites: smoke não substitui benchmark prolongado nem atesta as versões estáveis em outros sistemas. Não declarar compatibilidade de Firefox/Safari até execução e registro.
- Gate: parcial; manter T3 aberta para Firefox/Safari e validação online.

## 007-T4 — Preparar entrega

- Implementação documental: `docs/deployment/007-release.md` registra isolamento dos ambientes, ordem/reconciliação das migrations, backup, restauração, rollback seguro, gestão de segredos e passos de smoke em staging.
- Limite: nenhum projeto de staging foi identificado/autorizado neste ensaio; não houve backup externo, migration remota, deploy ou custo.
- Gate: documentação preparada; staging pendente, portanto T4 permanece aberta.
