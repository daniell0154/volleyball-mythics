# Evidências — 015

Base main 1ee43f0, PR #17 da 014 integrada antes de iniciar 015. Branch feat/015-coop-bots. README, ciclo, refinamento, contratos e spec/plan/tasks lidos; sem constitution/AGENTS.md encontrados. Proprietário delegou execução e merge de cada PR antes da seguinte, sem novas aprovações. Não confundir validação técnica com playtest humano.

## 015-T1

Contrato em contract.md: identidade de participante explícita, bot sem conta Auth/JWT/userId, envelope humano v1 preservado e capacidade acceptBots para entrar em sala nova. Migration 007 acrescenta metadados de bot e match_participants, mantendo match_players só humanos e RPCs históricas intactas. RPC nova restrita a service_role, valida quatro atores/slots/identidades, seed/política/dificuldade e idempotência pelo hash completo.

`node supabase/tests/database/015_bots.cjs` passou em PGlite/Windows: bot sem Auth, uma linha humana/quatro participantes, duplicação idempotente, conflito de dificuldade, rollback por personagem ausente, rejeição de userId em bot, duplicação de ator, dificuldade inválida, RLS dono versus outro usuário, RPC negada ao authenticated e persistência histórica 1v1 com kind humans. Sem aplicar migrations remotas. Gate técnico T1 aprovado.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

