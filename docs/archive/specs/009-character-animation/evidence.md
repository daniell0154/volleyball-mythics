# Evidências — 009-character-animation

Base: main 00e4451, PR #11 integrada. Branch feat/009-character-animation. README, REFINAMENTO, contracts e spec/plan/tasks lidos; nenhuma constitution/AGENTS.md encontrada.

## 009-T1 — Contrato de ações visuais

Decisão anterior ao código em docs/art/009-animation-contract.md: extensão opcional aditiva v1 com histórico máximo 32/120 ticks. Servidor gera ocorrência após contato/habilidade aceitos; inputs não aceitam animação nem identidade injetada. Cliente valida extensão antes de dispatch; versão antiga/ausência funciona sem gestos.
Testes: servidor 35/35 e web 12/12 passaram. Cobertos saque ilegítimo, tentativa fora de alcance, seq repetido, ID crescente, expiração, campos inválidos e ausência. Nenhuma alteração de física, pontos ou cooldowns. Gate T1 aprovado.

## 009-T2 — Locomoção e saltos

AvatarAnimator usa pivôs do rig e tempo interpolado; alterna passos, braços, orientação, salto/queda e amortecimento de aterrissagem. Não move a raiz. Suspensão e fim congelam pose; troca de matchId descarta controladores. Corrigida aceitação da retomada no mesmo tick congelado em SnapshotBuffer.
Suíte web 15/15 passou: consistência de passo em 30/60/120 FPS (diferença de rotação <0,13 rad), raiz imóvel, suspensão/retomada e renderTick interpolado junto da bola. Frames repetidos não avançam a pose. Gate funcional aprovado; revisão visual e medição integrada pertencem à T4.

## 009-T3 — Golpes e especiais

Sete poses confirmadas: saque, recepção, levantamento, ataque, bloqueio, bronca e reação de Caio. Contato no tick inicial e recuperação suave em 24–54 ticks. Ações de ambos os snapshots são combinadas/filtradas no mesmo renderTick da bola, sem apresentar o contato antes da confirmação.
Web 17/17 e servidor 35/35 passaram: pose no tick de contato, timeline fracionária, repetição sem restart, modelo recriado na mesma idade do gesto, bronca com cooldown sem nova ocorrência e reação de Caio após validação. A primeira execução do teste de timeline usava horários incorretos; corrigido o cenário, não a fórmula de interpolação. Gate funcional aprovado, apresentação em vídeo e custo seguem na T4.

## 009-T4 — Rede, ciclo de vida e custo

- Aceite visual explícito do proprietário: “as animações estão boas, curti”, após acesso ao vídeo docs/art/009-animation.webm. Vídeo de 15 s e página 009-review.html mostram os sete gestos e saltos; sequência sintética, não partida de produção.
- Web 18/18 e domínio 19/19 passaram. Contato até 50 ms da bola interpolada a 30/60/120 FPS, inclusive perdendo snapshot intermediário. Teste de histórico denso do servidor usa contatos legais independentes para não confundir o limite de 32 ocorrências com falta por quarto toque.
- Rede: quatro sockets reais loopback com shim de 60–90 ms por direção; clientes observam o mesmo placar e mesmo ID de saque aceito. Cinco repetições adicionais desse teste passaram; logs locais em .test-build/009-network-*.log. Uma falha intermitente na suíte completa foi reproduzida no teste antigo integration.test.mjs: aguardava estado interno suspended e verificava o socket antes da entrega da mensagem. Corrigida a espera para exigir também a observação do snapshot no cliente, sem alterar código de desconexão.
- Render: 300.013 ms, 18.009 frames, p95 16,9 ms, máximo isolado 49,8 ms, aba não oculta, zero exceções JS. Mesmo p95 do baseline 008 na precisão medida, abaixo de 33,3 ms e sem regressão >10%. Chrome 157.0.8103.79 headless, Windows 11 Pro, Intel i7-1185G7/Iris Xe via D3D11, 1280×720/DPR1/baixa. Quatro modelos com passos/saltos e sete gestos; dados sintéticos. Relatório em docs/benchmarks/009-render.json.
- Ciclo de vida: 10 montagens/desmontagens com troca de matchId, 241 meshes renderizados estáveis antes/depois da troca, um canvas durante e zero após; todas as geometrias e materiais observados no render foram descartados. Instrumentação não mede heap nem bytes de VRAM. Relatório em docs/art/009-lifecycle.json.
- Verificação final: typecheck e build passaram, domínio 19/19, web 18/18 e servidor 36/36 após corrigir a corrida de espera no teste de desconexão. Build mantém os avisos já conhecidos de bundle >500 kB e diretivas use client. git diff --check sem erros.
- Carga concluída: 900 s, 10 salas/40 participantes, 54.000 chamadas a 60 Hz, p95 do tick 0,9233 ms (limite 16,7), máximo isolado 69,9564 ms, atraso de agendamento p95 14,563 ms. 310 partidas reiniciadas, 180.530 snapshots, 722.120 entregas contabilizadas, 3.260 ocorrências visuais confirmadas observadas. Ticks finais iguais nas dez salas. Relatório em docs/benchmarks/009-load.json, Node 22.14.0/Windows/i7-1185G7/15,7 GiB. Esta carga inclui inputs ativos e difere da carga 007 de timeout de saque; comparar o limite absoluto, não interpretar a diferença entre p95 como custo isolado de animação.
- Gate T4 aprovado no ambiente medido; revisão de consistência feita entre tipos, validação, servidor, interpolação, rig, testes e contrato. Não houve migração, deploy ou custo externo. Render é sintético, rede usa loopback com atraso injetado e carga mede runtime/serialização local, não produção/WAN. T1–T4 completas. Próxima spec elegível após merge: 010-rally-dynamics.
