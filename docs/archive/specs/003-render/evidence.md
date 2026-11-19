# Evidências — 003-render

Ambiente: Windows, Node 26.13.1; dependências fixadas no package-lock.

## 003-T1 — UI e adaptador (R03)

- UI React Native Web, entrada Vite e interface SceneAdapter: update, resize, setQuality e dispose.
- Snapshots sintéticos de quatro placeholders, sem imports de domínio, física ou rede. O placar fixo é fixture, não resultado.
- Verificação: typecheck de todos os workspaces e build Vite passaram.
- Cleanup cancela RAF, desconecta ResizeObserver e libera geometrias, materiais, renderer e contexto.
- Aceite de separação UI/adaptador aprovado por compilação e revisão. Ciclo WebGL real e fallback precisam de validação visual.

## 003-T2 — Quadra e câmera (R03; parcial)

- Quadra 9 × 18 m, linhas, rede a 2,43 m, prédio escolar e céu. Placeholders não representam personagens finais.
- Decoração existe somente no renderer; não altera colisões do domínio.
- `npm.cmd run test --workspace @volleyball-mythics/web`: 1 teste passou. A projeção enquadra os extremos da quadra até 6,11 m de altura em 1280×720, 1920×1080 e 390×844; amostra 120 segundos de rally sintético com quatro atletas. Não é benchmark nem ensaio visual.
- Regressão: 15/15 testes do domínio passaram; typecheck de todos os workspaces e build web passaram. Build emite avisos de diretivas use client do RN Web e bundle acima de 500 kB (~840 kB antes de gzip).
- Validação visual informada pelo proprietário em 2026-11-16: executou o roteiro local e confirmou tudo funcionando corretamente (visibilidade, redimensionamento, qualidade e recriação de cena). T2 aprovada; testes adicionais de navegador e medição de T4 registrados abaixo.

## 003-T3 — Entrada e qualidade gráfica (R03)

- Captura WASD normalizada, Espaço, J/K/L/U e L conforme fase (serve/attack); ações discretas sem repetição automática. Teclado restrito à quadra focada; blur de janela/quadra e aba oculta limpam movimento e ações pendentes. Cleanup remove listeners.
- A UI mostra intenções, sem simular movimento ou determinar pontos; o consumo em rede será feito em 004. Baixa qualidade usa pixel ratio 1; alta limita a 2.
- `npm.cmd run test --workspace @volleyball-mythics/web`: 4/4 testes passaram (câmera e três casos de teclado).
- Edge 157 real automatizado via Playwright: pressionadas todas as teclas, conferidos movimentos normalizados, serve/attack por fase e limpeza no blur; dez recriações mantiveram um único canvas. Nenhum erro JavaScript até o início da medição.
- Gate T3 aprovado. A apresentação ainda usa snapshots sintéticos; controle efetivo dos atletas depende do servidor.

## 003-T4 — Medição e parâmetros (R03)

- Ensaio executado em 2026-11-17 01:24 UTC (2026-11-16 local): Windows 11 Home Single Language, Intel Core i3-1115G4, 7,73 GiB RAM, Intel UHD Graphics via ANGLE/D3D11, Edge 157.0.4341.46 headless com GPU padrão, Playwright 1.65.1.
- Quatro atletas, canvas 1280×720, pixel ratio 1, qualidade baixa, Vite dev. Duração 300004,7 ms; 17866 frames; média 16,792 ms; **p95 17,10 ms**; máximo 133 ms; aba visível para a API; nenhum erro JavaScript. Critério p95 <=33,3 ms aprovado. Equivale a ~59,55 fps médios; o máximo mostra que não há garantia de 60 fps constantes.
- Teclado/blur e dez recriações testados no mesmo navegador antes da coleta; um único canvas permaneceu. Captura inspecionada: quadra, rede, escola, céu e atletas visíveis.
- Relatório bruto: `docs/benchmarks/003-render-windows-edge.json`; roteiro e scripts em `docs/benchmarks/`. Não extrapolar o resultado headless deste computador para outros dispositivos.
- Calibração técnica com domínio v1: trajetória (0,1,-8) m, velocidade (0,7,8) m/s cruza a rede sem colisão e aterrissa dentro do lado oposto em 92 ticks, ápice 3,439 m, z final 4,233 m. Mantidos os parâmetros v1; sensação de jogo e balanceamento serão refinados com rally autoritativo, sem criar elenco final.
- Verificações finais: 4 testes web e 15 de domínio aprovados, typecheck dos workspaces e build web aprovados. Avisos de bundle e diretivas RN Web permanecem conhecidos.
- Gate 003 aprovado para implementação de 004-online. Sem promessa de renderer mobile ou lançamento em hardware não medido.

## Reprodução

1. `npm.cmd ci` e `npm.cmd run dev --workspace @volleyball-mythics/web`. Abrir a URL local indicada pelo Vite.
2. Conferir quadra inteira, bola, escola, céu e quatro placeholders. Redimensionar, alternar qualidade e recriar cena repetidamente; inspecionar contextos e recursos no navegador.
3. Clicar na quadra e pressionar WASD, Espaço, J/K/L/U; conferir intenções e limpeza ao perder foco. Alternar fase para testar L em saque/rally. Os atletas sintéticos não são controlados.
4. T4 exige hardware, GPU, SO, navegador/versão, resolução 1280×720 e qualidade registrados. Medir cinco minutos visíveis com quatro atletas; p95 <=33,3 ms, alvo 60 fps. Não usar o teste matemático como evidência de desempenho.
5. Executar o roteiro de `docs/benchmarks/README.md` para reproduzir a coleta e a trajetória física de referência. A animação sintética é exclusivamente visual.
