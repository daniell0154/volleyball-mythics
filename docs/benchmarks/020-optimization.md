# Otimização do cliente e do envio de snapshots

Referência de código `1ef1154`. Ensaios locais no Windows 11, Core i3-1115G4 com Intel UHD via ANGLE/D3D11, Node 26.13.1 e Edge 157.0.4341.60.

## Resultados

| Ensaio | Resultado e decisão |
| --- | --- |
| Interpolação de snapshots | Mediana de CPU de 3.219 ms para 1.532 ms (−52,4%) em 120 repetições da mesma sequência por amostra. Três medições alternadas por versão. A comparação de 4.836 operações incluiu perda e atraso de quadros, suspensão, retomada no mesmo tick e mudanças de partida. A sequência de estados amostrados gerou o mesmo SHA-256. O ganho se refere ao buffer isolado. |
| Envio WebSocket para quatro clientes | 16.000 → 4.000 serializações (−75%) e mediana do tempo medido dentro de `JSON.stringify` de 142,15 → 21,58 ms, em três medições alternadas por versão. Em cada execução, os mesmos 16.350.360 bytes chegaram na mesma ordem. O cliente reconectado recebeu os snapshots seguintes. A injeção de fila acima de 64 KiB fechou apenas o socket afetado com código 1013. |
| Equivalência de simulação | Replays do 2v2 humano e das dificuldades fácil, normal e difícil produziram os mesmos registros por tick. Esses registros incluem a bola, os atletas, contatos, lógica de bots, cooldowns, efeitos, feedback, placar e resultado. Os cenários cobriram os dois lados do saque, suspensão, retomada e revanche com novo ID e placar zerado. |
| Renderer | Replay de quatro atletas com câmera próxima, qualidade baixa, 1280×720, DPR 1 e 300 s após aquecimento. p95 16,9 ms, p99 17,6 ms, dez intervalos acima de 50 ms e máximo de 133,3 ms. A captura separada de CPU teve apenas seis amostras próprias de `createScene.update` em 12 s. Isso não ofereceu resolução para atribuir custo à reconciliação de quatro modelos. |
| Carga de bots | Dez salas solo e dez salas humanas ociosas por 60 s. p95 de 2,41 ms nas salas com bots, 0,35 ms nas humanas, histórico máximo de 64 e zero partidas após a limpeza. Heap de 5,97 MiB na amostra dessa janela. O ensaio mede o runtime, com a rede avaliada pelo ensaio WebSocket. |
| Carga 007 | Dez salas humanas por 900 s. O p95 do trabalho por tick foi 0,389 ms, abaixo de 16,7 ms. Foram feitas 54.000 chamadas de simulação e as dez salas terminaram no mesmo tick. O p95 de atraso de agendamento foi 31,087 ms e o máximo de trabalho foi 377,409 ms sob carga simultânea no ambiente de teste. |

O build padrão manteve os imports sob demanda da prévia e da partida. O chunk compartilhado da prévia 3D tem cerca de 571 kB sem compressão, com a mesma identificação no build de referência e no da implementação. A inspeção dos chunks apontou o custo para o renderer necessário à prévia já visível. A alteração de carregamento depende de identificar um ganho mensurável na jornada.

## Reprodução

Use uma cópia limpa do commit de referência para gerar o `dist` do servidor e o `.test-build/network/interpolation.js` do workspace web. No checkout da implementação, copie o `dist` de referência para `apps/server/.test-build/020-base`, com um `package.json` contendo `{"type":"module"}` nessa pasta. Copie o módulo de interpolação de referência para `.test-build/020-interpolation-base.mjs`. Depois execute na raiz:

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test --workspace @volleyball-mythics/domain
npm.cmd run test --workspace @volleyball-mythics/server
npm.cmd run test --workspace @volleyball-mythics/web
node docs/benchmarks/020-interpolation.mjs .test-build/020-interpolation-base.mjs
node docs/benchmarks/020-fanout.mjs apps/server/.test-build/020-base
node docs/benchmarks/020-match-replay.mjs apps/server/.test-build/020-base
node docs/benchmarks/007-load.mjs --out .test-build/020-007.json
node docs/benchmarks/015-load.mjs 60000 .test-build/020-bots.json
```

Para os ensaios de navegador, instale o Playwright conforme a [preparação da 016](016-validation.md). Com Vite na raiz em 5180, rode:

```powershell
node docs/benchmarks/020-render.cjs
node docs/benchmarks/020-render.cjs --profile
```

Para o carregamento e o ciclo de vida, compile o Lobby da fixture e sirva o build no mesmo endereço do WebSocket:

```powershell
$env:VITE_FIXTURE_SAME_ORIGIN="1"
$env:VITE_FIXTURE_CATALOG_URL="/020-catalog"
.\node_modules\.bin\vite.cmd build docs/acceptance/015-preview --outDir ../../../.test-build/020-web --emptyOutDir
$env:VOLLEYBALL_FIXTURE_SOCKET_PORT="3024"
$env:VOLLEYBALL_FIXTURE_CATALOG_PORT="3025"
$env:VOLLEYBALL_FIXTURE_WEB_ROOT=(Resolve-Path .test-build/020-web).Path
node docs/acceptance/015-fixture-server.mjs
```

Em outro terminal:

```powershell
node docs/benchmarks/020-loading.cjs
```

O ensaio de carregamento usa o Lobby compilado com catálogo e identidade isolados. Mede os bytes dos arquivos JS antes de compressão. A jornada percorre o WebSocket, o runtime e a tela de partida com essa fixture. A contagem do navegador mede contextos, buffers e texturas WebGL observados e heap JavaScript após coleta. A distribuição de memória dentro do driver está fora dessa medição.
