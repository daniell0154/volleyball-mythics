# Tarefas — 011
Todas referenciam R11; executar em ordem. Cada tarefa depende da anterior e das dependências do plan.md.

- [x] 011-T1 — Entrada e catálogo
  - Destinos: apps/web/src/main.tsx, lobby, scene/CharacterPreview.tsx, game/OnlineMatch.tsx, results; docs/acceptance.
  - Entrega/aceite: Organizar apelido/criar/entrar e atleta em destaque com modelo, sete atributos, overall e habilidade. Catálogo é fonte dinâmica, não lista fixa de dois. Cobrir loading, vazio e falha; priorizar preview por seleção e carregar renderer sob demanda.

- [x] 011-T2 — Lobby e orientação
  - Destinos: apps/web/src/main.tsx, lobby, scene/CharacterPreview.tsx, game/OnlineMatch.tsx, results; docs/acceptance.
  - Entrega/aceite: Exibir modo, slots, convite, personagem e prontidão; erros junto à ação. Manter fluxo guest existente, dono autorizado para iniciar e suporte a personagens repetidos.

- [x] 011-T3 — HUD de partida
  - Destinos: apps/web/src/main.tsx, lobby, scene/CharacterPreview.tsx, game/OnlineMatch.tsx, results; docs/acceptance.
  - Entrega/aceite: Placar/fase central, sacador, jogador local e recarga legíveis; instruções mudam conforme fase. Marcador local com forma/texto. HUD não bloqueia bola/rede; volume e qualidade acessíveis, reduzir movimento sem mudar física.

- [ ] 011-T4 — Aceite do percurso
  - Retomada: não iniciada por pedido explícito do proprietário para parar ao concluir T3.
  - Destinos: apps/web/src/main.tsx, lobby, scene/CharacterPreview.tsx, game/OnlineMatch.tsx, results; docs/acceptance.
  - Entrega/aceite: Completar criar/entrar, selecionar, pronto, jogar, resultado e revanche com teclado. Cobrir catálogo com pelo menos cinco fixtures só em teste, nomes longos, WebGL indisponível e zoom 200%. Registrar versões Chrome/Edge/Firefox/Safari e pendências reais, além de contraste mínimo 4,5:1 para texto normal.

