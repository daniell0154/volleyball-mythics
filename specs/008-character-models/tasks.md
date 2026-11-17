# Tarefas — 008
Todas referenciam R08; executar em ordem. Cada tarefa depende da anterior e das dependências do plan.md.

- [x] 008-T1 — Direção visual e baseline
  - Aceite: proprietário autorizou seguir no estilo Happy Hoops; proporções atléticas, cabeça menor e membros contínuos substituem o estudo arredondado inicial.
  - Destinos: apps/web/src/scene/avatar.ts, createScene.ts, CharacterPreview.tsx; docs/art.
  - Entrega/aceite: Registrar vistas frontal/lateral e câmera de jogo de Samuel/Caio; definir silhuetas, proporções e paleta. Capturar baseline de quatro atletas e obter aceite da direção antes de produzir ambos.

- [ ] 008-T2 — Rig e modelo reutilizável
  - Destinos: apps/web/src/scene/avatar.ts, createScene.ts, CharacterPreview.tsx; docs/art.
  - Entrega/aceite: Criar hierarquia com pivôs nomeados, volumes arredondados, mãos/pés e rosto legível. Ombros, cotovelos, joelhos e tornozelos giram sem separar membros. Hitboxes e atributos permanecem iguais.

- [ ] 008-T3 — Integração versionada
  - Destinos: apps/web/src/scene/avatar.ts, createScene.ts, CharacterPreview.tsx; docs/art.
  - Entrega/aceite: Mesmo personagem tem mesma aparência no preview e na partida, inclusive após reconexão. Manter procedural:v1 e fallback; novas variantes usam chave/manifesto versionado, sem regenerar revisões publicadas.

- [ ] 008-T4 — Aceite visual e custo
  - Destinos: apps/web/src/scene/avatar.ts, createScene.ts, CharacterPreview.tsx; docs/art.
  - Entrega/aceite: Proprietário reconhece Samuel/Caio em preview e na câmera de jogo. Dez montagens/desmontagens não acumulam objetos/recursos; medir chamadas de desenho e memória, e cumprir orçamento de render do documento. Registrar evidências.

