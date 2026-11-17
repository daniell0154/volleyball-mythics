# Tarefas — Partida online 1v1 completa
Todas referenciam R05; executar em ordem. Cada tarefa depende da anterior e das features indicadas no plan.md.

- [x] 005-T1 — Unir loop e HUD
  - Destinos: apps/web/src/match, apps/server/src/match.
  - Aceite/verificação: Partida real 0–0 até sexto ponto em dois contextos de navegador distintos.

- [x] 005-T2 — Reconexão e abandono
  - Destinos: apps/server/src/reconnect.
  - Aceite/verificação: Retorno em 19s retoma; após limite perde; ambos ausentes cancela; menu não pausa.

- [x] 005-T3 — Finalização persistente
  - Destinos: apps/server/src/results.
  - Aceite/verificação: Indisponibilidade DB gera estado salvamento pendente e retry por 5min; vencedor visual vem do servidor; esgotamento registra falha operacional sem resultado falso.

- [ ] 005-T4 — Revanche e limpeza
  - Destinos: apps/server/src/lifecycle, apps/web/src/results.
  - Aceite/verificação: Todos votam: novo matchId e placar zero; sem unanimidade permanece resultado; fechar sala libera timers.

