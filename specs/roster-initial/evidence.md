# Evidências — cadastro inicial

Base: main com PR #5 integrada (4519236). Branch content/initial-roster. Alteração de conteúdo solicitada explicitamente, sem executar gates da spec 006 antecipadamente.

## ROSTER-T1

- Fonte JSON de Samuel/Caio e fichas com alvo, fase, duração, cooldown, feedback e regra anti-duplicação de pontos.
- `npm.cmd run build --workspace @volleyball-mythics/domain` passou.
- `node scripts/roster.mjs sql` gerou migration; `node scripts/roster.mjs check` passou. Média de atributos validada pelo domínio: 85 e 77.
- `node scripts/roster.mjs publish` cadastrou ambas as revisões no Supabase real e confirmou readback dos campos persistidos. Credencial lida em memória do .env, sem exibição/versionamento. Não sobrescreve revisões existentes divergentes.
- Gate de conteúdo aprovado. Habilidades apenas configuradas, sem execução até 005/006.
