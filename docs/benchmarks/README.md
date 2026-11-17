# Ensaios do spike 003

O proprietário validou visualmente a cena inicial em 2026-11-16. O teste automatizado adicional usa o Edge instalado no Windows, em modo headless com a GPU padrão. É evidência do ambiente registrado, sem promessa de desempenho em outros computadores ou navegadores.

Para reproduzir a partir da raiz do repositório:

```powershell
npm.cmd ci
npm.cmd install --prefix .test-build/browser --no-package-lock playwright
npm.cmd run dev --workspace @volleyball-mythics/web -- --port 5174 --strictPort
```

Em outro terminal na mesma pasta:

```powershell
node docs/benchmarks/renderer.cjs http://127.0.0.1:5174/
```

O script verifica teclado e blur com eventos reais, recria a cena dez vezes, exige um único canvas e mede 300 segundos contínuos de intervalos RAF em canvas 1280×720, pixel ratio 1 e qualidade baixa. Aba oculta ou erro JavaScript invalida o resultado. O relatório inclui hardware, renderer WebGL, navegador, duração, p95 e máximo; arquivos locais ficam em `.test-build/renderer-report.json` e `.test-build/renderer.png`.

O p95 mede a cadência total da aplicação, não tempo isolado da GPU. Dez recriações e um canvas verificam o ciclo de vida visível, sem alegar análise exaustiva de memória do driver. O adaptador libera explicitamente geometrias, materiais e contexto. O benchmark usa o servidor de desenvolvimento; os avisos do build são registrados em evidence.md.

## Carga 2v2 da spec 007

Compile o servidor e execute o benchmark padrão para 10 salas 2v2, por 15 minutos:

```powershell
npm.cmd run build --workspace @volleyball-mythics/server
node docs/benchmarks/007-load.mjs
```

O relatório é salvo em `docs/benchmarks/007-local.json` com CPU, memória, Node, p95 e máximo do trabalho de simulação por tick de 60 Hz, atraso do agendamento, reinícios de partida, snapshots e fanout serializado. A saída `passed` exige p95 <=16,7 ms, duração completa e mesmo número de ticks nas dez salas. `--duration-seconds 10` serve apenas para smoke test e não satisfaz o gate de 15 minutos. `--out <arquivo>` permite escolher outro destino.

Esse ensaio mede o runtime e a serialização/fanout síncrona em uma máquina local; não substitui uma carga distribuída ou um hardware de referência aprovado. A condição de rede com quatro clientes usa o teste de integração `apps/server/tests/network-latency.test.mjs`, que injeta atraso e jitter em WebSockets locais e compara o placar após a entrega estabilizar.

Calibração física técnica, sem renderer ou UI:

```powershell
npm.cmd run build --workspace @volleyball-mythics/domain
node docs/benchmarks/calibrate.mjs
```

A trajetória de referência parte de (0,1,-8) m com velocidade (0,7,8) m/s: cruza a rede sem colisão, cai no lado oposto em 92 ticks (~1,533 s), ápice ~3,439 m e z final ~4,233 m. Mantidos os parâmetros v1: 60 Hz, gravidade 9,81 m/s², bola 0,11 m, rede 2,43 m, restituição 0,45, quadra 9×18 m; velocidades de atleta 2–8 m/s e salto 4–9 m/s. São parâmetros iniciais tecnicamente viáveis; sensação de controle, ações e balanceamento precisam do rally autoritativo e elenco. Nenhum atributo/habilidade final foi inventado.
