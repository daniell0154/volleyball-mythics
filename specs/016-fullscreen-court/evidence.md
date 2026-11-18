# Evidências — 016

Base `deae3f9` na branch `feat/016-fullscreen-court`. PR #18 da 015 integrada em main.

## 016-T1 — Viewport

Layout exclusivo da partida desde a transição da sala, incluindo suspensão e resultado. A API de fullscreen é acionada por botão, com feedback de recusa e escuta de `fullscreenchange`. Contrato de apresentação em [contract.md](contract.md).

`npm run typecheck` e `node docs/acceptance/016-viewport.cjs` passaram no Windows, Edge 157.0.4341.60, 1280×720. Sala solo no runtime local com Auth de fixture: viewport sem scroll, entrada e saída da Fullscreen API, recusa simulada sem abandonar e retorno com foco no apelido. Gate T1 aprovado.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

