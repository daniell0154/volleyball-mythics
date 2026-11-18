# Evidências — 016

Base `deae3f9` na branch `feat/016-fullscreen-court`. PR #18 da 015 integrada em main.

## 016-T1 — Viewport

Layout exclusivo da partida desde a transição da sala, incluindo suspensão e resultado. A API de fullscreen é acionada por botão, com feedback de recusa e escuta de `fullscreenchange`. Contrato de apresentação em [contract.md](contract.md).

`npm run typecheck` e `node docs/acceptance/016-viewport.cjs` passaram no Windows, Edge 157.0.4341.60, 1280×720. Sala solo no runtime local com Auth de fixture: viewport sem scroll, entrada e saída da Fullscreen API, recusa simulada sem abandonar e retorno com foco no apelido. Gate T1 aprovado.

## 016-T2 — HUD e área da quadra

Placar compacto em cima. Ações, dicas, opções e saída ficam na faixa inferior. O espaço entre as faixas determina a resolução e a projeção via `ResizeObserver`; o indicador mantém sua margem contra as bordas da quadra. Telas curtas/estreitas têm expansão das ações e rolagem restrita às faixas quando necessário.

`npm run test --workspace @volleyball-mythics/web`: 27 testes passaram, incluindo a projeção dos traces da 014 para ambos os lados e câmera estável/móvel. Bola projetada com no mínimo 12 CSS px nos quadros verificados; indicador dentro da quadra. `node docs/acceptance/016-viewport.cjs`, Edge 157 no Windows: canvas ajustado entre as faixas ao abrir/fechar opções e foco na quadra ao fechar com Escape. Gate funcional T2 aprovado. Percurso ampliado em T3 e avaliação visual/desempenho em T4.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

