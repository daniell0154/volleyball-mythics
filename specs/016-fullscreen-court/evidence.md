# Evidências — 016

Base `deae3f9` na branch `feat/016-fullscreen-court`. PR #18 da 015 integrada em main.

## 016-T1 — Viewport

Layout exclusivo da partida desde a transição da sala, incluindo suspensão e resultado. A API de fullscreen é acionada por botão, com feedback de recusa e escuta de `fullscreenchange`. Contrato de apresentação em [contract.md](contract.md).

`npm run typecheck` e `node docs/acceptance/016-viewport.cjs` passaram no Windows, Edge 157.0.4341.60, 1280×720. Sala solo no runtime local com Auth de fixture: viewport sem scroll, entrada e saída da Fullscreen API, recusa simulada sem abandonar e retorno com foco no apelido. Gate T1 aprovado.

## 016-T2 — HUD e área da quadra

O proprietário esclareceu que a imagem do jogo deve preencher toda a viewport, com controles minimalistas sobre o render. A revisão substituiu as faixas que reservavam espaço fora do canvas por placar superior e dock inferior flutuantes. As opções e as ações no modo compacto se expandem quando abertas.

`ResizeObserver` mede as sobreposições e ajusta o deslocamento da projeção, mantendo a resolução do canvas. `npm run test --workspace @volleyball-mythics/web`: 27 testes passaram, incluindo a projeção dos traces da 014, ambos os lados e câmera estável/móvel. Bola projetada com no mínimo 12 CSS px nos quadros verificados. `node docs/acceptance/016-viewport.cjs`, Edge 157 no Windows: canvas em toda a viewport antes e depois de abrir opções, indicador entre as sobreposições e Escape retornando o foco à quadra. Gate funcional T2 aprovado. Avaliação visual/desempenho em T4.

## 016-T3 — Integração

- `node docs/acceptance/016-journey.cjs`, Edge 157.0.4341.60 no Windows: quatro clientes humanos iniciaram em 1280×720 e sacaram, um WebSocket foi fechado e o cliente voltou à mesma partida mantendo o canvas. O time B foi verificado em 1920×1080 após resize, troca de qualidade e câmera estável. Abandono devolveu o jogador ao lobby e exibiu resultado para o outro time.
- Solo contra bots: partida com quatro atletas terminou por pontos, resultado recebeu foco e o voto iniciou outro matchId com placar 0×0, na mesma viewport.
- Dupla contra bots: ações expansíveis por teclado em 640×360/DPR 2. Com WebGL forçado a falhar no outro cliente, placar e saída permaneceram disponíveis.
- `node docs/acceptance/016-zoom.cjs`, Chrome for Testing 159.0.8154.6: zoom nativo de 200%, área CSS 631×312/DPR 2, zero excesso horizontal no documento e controles. Saque por teclado, opções, ajuste de volume, Escape, foco na quadra e retorno do rodapé ao início verificados.
- `npm run typecheck` e `npm run build` passaram. Vite reportou o aviso de chunks acima de 500 kB. Os ensaios de rede usam transporte/runtime locais, Auth de fixture e persistência simulada, sem alegar verificação de produção. Gate funcional T3 aprovado.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

