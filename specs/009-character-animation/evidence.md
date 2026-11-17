# Evidências — 009-character-animation

Base: main 00e4451, PR #11 integrada. Branch feat/009-character-animation. README, REFINAMENTO, contracts e spec/plan/tasks lidos; nenhuma constitution/AGENTS.md encontrada.

## 009-T1 — Contrato de ações visuais

Decisão anterior ao código em docs/art/009-animation-contract.md: extensão opcional aditiva v1 com histórico máximo 32/120 ticks. Servidor gera ocorrência após contato/habilidade aceitos; inputs não aceitam animação nem identidade injetada. Cliente valida extensão antes de dispatch; versão antiga/ausência funciona sem gestos.
Testes: servidor 35/35 e web 12/12 passaram. Cobertos saque ilegítimo, tentativa fora de alcance, seq repetido, ID crescente, expiração, campos inválidos e ausência. Nenhuma alteração de física, pontos ou cooldowns. Gate T1 aprovado.
