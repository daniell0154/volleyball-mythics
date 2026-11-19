# Tarefas — Spike 3D escolar
Todas referenciam R03; executar em ordem. Cada tarefa depende da anterior e das features indicadas no plan.md.

- [x] 003-T1 — Montar UI e adaptador de cena
  - Destinos: apps/web/src/game.
  - Aceite/verificação: UI não importa física nem decide pontuação; adapter consome snapshots sintéticos.

- [x] 003-T2 — Construir quadra escolar e câmera
  - Destinos: apps/web/src/scene.
  - Aceite/verificação: Visualizar rally em toda quadra; obstáculos decorativos não alteram colisão.

- [x] 003-T3 — Entrada e qualidade gráfica
  - Destinos: apps/web/src/input.
  - Aceite/verificação: WASD movimento, Espaço salto, J recepção, K levantamento, L ataque/saque conforme fase, U especial; blur limpa teclas.

- [x] 003-T4 — Medir renderer e calibrar física
  - Destinos: docs/benchmarks.
  - Aceite/verificação: Registrar hardware, navegador e parâmetros; 5 min de quatro atletas, p95 frame <=33,3ms em 720p; 60fps como alvo. Falha bloqueia arte final.

