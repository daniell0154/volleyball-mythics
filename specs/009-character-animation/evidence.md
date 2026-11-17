# Evidências — 009-character-animation

Base: main 00e4451, PR #11 integrada. Branch feat/009-character-animation. README, REFINAMENTO, contracts e spec/plan/tasks lidos; nenhuma constitution/AGENTS.md encontrada.

## 009-T1 — Contrato de ações visuais

Decisão anterior ao código em docs/art/009-animation-contract.md: extensão opcional aditiva v1 com histórico máximo 32/120 ticks. Servidor gera ocorrência após contato/habilidade aceitos; inputs não aceitam animação nem identidade injetada. Cliente valida extensão antes de dispatch; versão antiga/ausência funciona sem gestos.
Testes: servidor 35/35 e web 12/12 passaram. Cobertos saque ilegítimo, tentativa fora de alcance, seq repetido, ID crescente, expiração, campos inválidos e ausência. Nenhuma alteração de física, pontos ou cooldowns. Gate T1 aprovado.

## 009-T2 — Locomoção e saltos

AvatarAnimator usa pivôs do rig e tempo interpolado; alterna passos, braços, orientação, salto/queda e amortecimento de aterrissagem. Não move a raiz. Suspensão e fim congelam pose; troca de matchId descarta controladores. Corrigida aceitação da retomada no mesmo tick congelado em SnapshotBuffer.
Suíte web 15/15 passou: consistência de passo em 30/60/120 FPS (diferença de rotação <0,13 rad), raiz imóvel, suspensão/retomada e renderTick interpolado junto da bola. Frames repetidos não avançam a pose. Gate funcional aprovado; revisão visual e medição integrada pertencem à T4.
