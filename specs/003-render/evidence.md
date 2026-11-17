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

## Reprodução e próximos aceites

1. `npm.cmd ci` e `npm.cmd run dev --workspace @volleyball-mythics/web`. Abrir a URL local indicada pelo Vite.
2. Conferir quadra inteira, bola, escola, céu e quatro placeholders. Redimensionar, alternar qualidade e recriar cena repetidamente; inspecionar contextos e recursos no navegador.
3. Aprovar T2 antes de implementar teclado em T3. A cena atual não recebe comandos.
4. T4 exige hardware, GPU, SO, navegador/versão, resolução 1280×720 e qualidade registrados. Medir cinco minutos visíveis com quatro atletas; p95 <=33,3 ms, alvo 60 fps. Não usar o teste matemático como evidência de desempenho.
5. Física v1 sem calibração: 60 Hz, gravidade 9,81, raio 0,11 m e rede 2,43 m. A trajetória sintética é exclusivamente visual. Não iniciar 004-online nem arte final enquanto o gate 003 estiver pendente.
