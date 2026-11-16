# Tarefas — Regras e simulação
Todas referenciam R02; executar em ordem. Cada tarefa depende da anterior e das features indicadas no plan.md.

- [x] 002-T1 — Estados e pontuação
  - Destinos: packages/domain/src/match.
  - Aceite/verificação: Cobrir transições permitidas, 6–5, após finished e rally duplicado.

- [x] 002-T2 — Toques, limites e saque
  - Destinos: packages/domain/src/rules.
  - Aceite/verificação: Cobrir linha dentro, fora por último toque, quarto toque, consecutivos 1v1/2v2 e bloqueio.

- [x] 002-T3 — Movimento e bola em passo fixo
  - Destinos: packages/domain/src/simulation.
  - Aceite/verificação: Mesmos inputs e ticks repetem estado; detectar atravessamento de chão/rede em velocidades máximas.

- [x] 002-T4 — Configuração física e atributos
  - Destinos: packages/domain/src/config.
  - Aceite/verificação: Limites explícitos impedem NaN/inf e atributos fora de faixa; registrar parâmetros iniciais e limites das ações.

