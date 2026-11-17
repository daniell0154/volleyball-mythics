# Tarefas — 010
Todas referenciam R10; executar em ordem. Cada tarefa depende da anterior e das dependências do plan.md.

- [ ] 010-T1 — Instrumentar e medir
  - Destinos: packages/domain, apps/server/src/runtime/matches.ts, apps/web/src/input, apps/web/src/game; docs/benchmarks.
  - Entrega/aceite: Capturar 20 rallies por modo com parâmetros atuais; medir duração, contatos, devoluções e ações recusadas por alcance. Registrar ambiente, skill dos participantes e distribuição, sem salvar tokens ou inputs indefinidamente.

- [ ] 010-T2 — Clareza e resposta
  - Destinos: packages/domain, apps/server/src/runtime/matches.ts, apps/web/src/input, apps/web/src/game; docs/benchmarks.
  - Entrega/aceite: Feedback imediato de intenção sem afirmar contato; contato/habilidade só após confirmação. Documentar prioridade quando múltiplas ações chegam no mesmo tick; impedir ações atrasadas e spam. Não mudar limite de rede para mascarar atraso.

- [ ] 010-T3 — Calibrar trajetórias
  - Destinos: packages/domain, apps/server/src/runtime/matches.ts, apps/web/src/input, apps/web/src/game; docs/benchmarks.
  - Entrega/aceite: Comparar perfis versionados de saque, recepção, levantamento e ataque, um conjunto por vez. Dar janela de recuperação entre contatos, preservar monotonicidade dos atributos e avaliar 1v1 e 2v2 separadamente. Qualquer input buffering muda contrato e exige limite explícito.

- [ ] 010-T4 — Validar tuning
  - Destinos: packages/domain, apps/server/src/runtime/matches.ts, apps/web/src/input, apps/web/src/game; docs/benchmarks.
  - Entrega/aceite: Comparar baseline com 20 rallies novos por modo e metas do documento; proprietário avalia diversão e previsibilidade. Regressões cobrem 6–5, faltas, contatos simultâneos, habilidades, abandono, reconexão e resultado idempotente. Repetir carga e ensaio de latência com parâmetros finais.

