# Tarefas — 2v2 e habilidades
Todas referenciam R06; executar em ordem. Cada tarefa depende da anterior e das features indicadas no plan.md.

- [x] 006-T1 — Quatro jogadores e equipes
  - Destinos: apps/server/src/match, apps/web/src/lobby.
  - Aceite/verificação: Dois por equipe, slots exclusivos e todos sincronizados; saque alterna conforme contrato.

- [ ] 006-T2 — Overall e catálogo versionado
  - Destinos: packages/domain/src/characters.
  - Aceite/verificação: Média arredondada de sete atributos; partida em curso mantém versão ao atualizar catálogo.

- [ ] 006-T3 — Contrato de habilidades
  - Destinos: packages/domain/src/abilities.
  - Aceite/verificação: Servidor valida fase, cooldown, duração e alvo; spam não reaplica; efeito expira e limpa no fim.

- [ ] 006-T4 — Integrar elenco do proprietário
  - Destinos: content/characters, docs/roster.
  - Aceite/verificação: Para cada personagem receber atributos, visual e ficha de poder; ausência bloqueia esta tarefa e lançamento, não substituir por inventados.

