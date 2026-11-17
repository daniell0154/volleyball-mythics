# 009 — Revisão, rede e reprodução

O proprietário aprovou a sequência em 009-animation.webm. A gravação mostra os sete gestos e o salto em modelo próximo, junto da cena com quatro atletas. É uma sequência sintética de apresentação; a confirmação de contatos em uma partida real é responsabilidade do servidor.

## Reproduzir a revisão

Na raiz, com Playwright instalado em .test-build/browser e seu FFmpeg disponível:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5176 --strictPort
node docs/art/009-review.cjs
```

Abrir http://127.0.0.1:5176/docs/art/009-review.html permite selecionar gesto, pausar e retomar a apresentação. O WebM abre por arrastar o arquivo para Chrome/Edge. Uma imagem parada não substitui o vídeo para avaliar movimento.

## Ensaios

- node docs/benchmarks/009-render.cjs: cinco minutos de quatro atletas v2 animados em 1280×720, DPR1, baixa. Compara p95 com 008-candidate.json, limite absoluto 33,3 ms e aumento máximo 10%. Snapshot sintético, sem conexão com Supabase.
- node docs/benchmarks/009-load.mjs: quinze minutos de dez salas 2v2, input e snapshots autoritativos a 60/20 Hz, serialização e contagem de fanout. Aceita --out e --duration-seconds para diagnóstico; gate exige duração padrão de 900 s. Limite tick p95 16,7 ms.
- apps/server/tests/network-latency.test.mjs: quatro clientes WebSocket loopback com 60–90 ms em cada direção, verificando placar e mesmo ID de saque confirmado. É shim de latência, não medição WAN.
- apps/web/tests/animation.test.mjs: 30/60/120 FPS, suspensão, repetição sem restart, reconexão na idade atual do gesto e recuperação de uma ação após perder snapshot intermediário. Testes verificam pose/tempo, não simulam GPU a 120 FPS.
- node docs/art/009-lifecycle.cjs: dez montagens/desmontagens da cena, cada uma com troca de matchId/revanche. Instrumenta Mesh.onBeforeRender e os eventos de descarte dos recursos observados. Verifica quantidade de meshes renderizados estável, um canvas antes e zero depois, geometrias e materiais observados liberados. Não é auditoria completa de heap/driver.

Resultado do renderer: cinco minutos, p95 16,9 ms, igual ao baseline 008 na precisão medida; máximo isolado 49,8 ms. O ensaio de ciclo de vida manteve 241 meshes renderizados antes/depois de cada troca e zero recursos observados após descarte em todos os dez ciclos. Relatórios: docs/benchmarks/009-render.json e docs/art/009-lifecycle.json.
Resultado da carga: 900 s/10 salas, p95 0,9233 ms e máximo 69,9564 ms; limite de p95 16,7 ms atendido. Inputs ativos produziram 3.260 ações visuais observadas. O workload é diferente do ensaio 007 (que não enviava inputs); este resultado não isola o custo incremental do histórico visual.

O histórico visual é limitado a 32 ações/120 ticks. Lacunas maiores podem perder gestos já encerrados e não provocam replay atrasado. Não há novos sons na máquina de poses. Fim/suspensão congela a pose; revanche com novo matchId descarta o modelo/controlador anterior.

## Limites

Os relatórios registram máquina e navegador locais. Os ensaios foram executados no mesmo computador; coexistência de tarefas de teste e renderer pode aumentar ruído de agendamento. Não são promessa de latência ou capacidade de produção. Modelos e física continuam autoritativos nas posições do servidor; rotações do rig não alteram alcance de toque.
