# Evidências — 015

Base main 1ee43f0, PR #17 da 014 integrada antes de iniciar 015. Branch feat/015-coop-bots. README, ciclo, refinamento, contratos e spec/plan/tasks lidos; sem constitution/AGENTS.md encontrados. Proprietário delegou execução e merge de cada PR antes da seguinte, sem novas aprovações. Não confundir validação técnica com playtest humano.

## 015-T1

Contrato em contract.md: identidade de participante explícita, bot sem conta Auth/JWT/userId, envelope humano v1 preservado e capacidade acceptBots para entrar em sala nova. Migration 007 acrescenta metadados de bot e match_participants, mantendo match_players só humanos e RPCs históricas intactas. RPC nova restrita a service_role, valida quatro atores/slots/identidades, seed/política/dificuldade e idempotência pelo hash completo.

`node supabase/tests/database/015_bots.cjs` passou em PGlite/Windows: bot sem Auth, uma linha humana/quatro participantes, duplicação idempotente, conflito de dificuldade, rollback por personagem ausente, rejeição de userId em bot, duplicação de ator, dificuldade inválida, RLS dono versus outro usuário, RPC negada ao authenticated e persistência histórica 1v1 com kind humans. Sem aplicar migrations remotas. Gate técnico T1 aprovado.

## 015-T2

BotController usa histórico limitado a 64 observações, atrasado conforme dificuldade; estima interceptação por duas posições passadas/gravidade e decide receber/levantar/atacar/bloquear/sacar ou posicionar. Responsabilidade por time exclui último contato observado e respeita participação do humano ativo. Inputs passam pelo submit/action do runtime, sem teleporte/contato privilegiado. Políticas easy/normal/hard versionadas: reação24/12/6 ticks e erro1,8/0,35/0,06m; mesmos atributos/hitboxes/regras. Seed da sala fixa decisões.

Helpers de identidade mantidos no servidor, pois pacote protocol era somente tipos e apontava para fonte .ts; uma primeira execução revelou ERR_UNKNOWN_FILE_EXTENSION ao importar valor dele. Corrigido antes do gate, sem alterar resolução de pacotes existentes. Runtime usa participantId nos atletas; resultado vsBots inclui quatro atores e política, humanos mantêm payload antigo. Lifecycle conta votos/expiração só humanos; bot sempre sem Auth.

Servidor 48/48 passou, incluindo determinismo de 1200 ticks com mesmos seeds/inputs, limites espaciais, memória de observação, suspensão/descarte, políticas sem alterar atributos, payload de resultado e regressões históricas/rede. Typecheck passou. Carga real e calibração são T4. Gate funcional T2 aprovado.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

