# Evidências — cadastro inicial

Base: main com PR #5 integrada (4519236). Branch content/initial-roster. Alteração de conteúdo solicitada explicitamente, sem executar gates da spec 006 antecipadamente.

## ROSTER-T1

- Fonte JSON de Samuel/Caio e fichas com alvo, fase, duração, cooldown, feedback e regra anti-duplicação de pontos.
- `npm.cmd run build --workspace @volleyball-mythics/domain` passou.
- `node scripts/roster.mjs sql` gerou migration; `node scripts/roster.mjs check` passou. Média de atributos validada pelo domínio: 85 e 77.
- `node scripts/roster.mjs publish` cadastrou ambas as revisões no Supabase real e confirmou readback dos campos persistidos. Credencial lida em memória do .env, sem exibição/versionamento. Não sobrescreve revisões existentes divergentes.
- Gate de conteúdo aprovado. Habilidades apenas configuradas, sem execução até 005/006.

## ROSTER-T2

- Modelos Three.js masculinos distintos, com seed aleatória persistida, cabeça/cabelo/rosto, membros e uniforme por equipe. Suporte explícito ao perfil visual feminino para futuras fichas; não há inferência do gênero a partir de nome em runtime.
- Catálogo envia overall, abilityName e assetKey; lobby mostra prévia 3D do selecionado e overall. Snapshot captura o assetKey da revisão selecionada no início e mantém aparência mesmo após refresh de catálogo. Registros sem assetKey usam placeholder compatível.
- Testes: 7 web e 11 servidor passaram; typecheck e build web passaram. Testes novos comprovam determinismo/gênero, rejeição de assets desconhecidos, apoio no chão, liberação de todos os materiais/geometrias e pinning do visual na partida.
- Edge 157 headless em Vite local: renderizadas as duas aparências, captura inspecionada e zero erros JavaScript. Prévia em docs/roster/initial-preview.png. Não foi repetido o benchmark de cinco minutos nem feita promessa de performance com arte final.
- Publicação do catálogo repetida confirmou idempotência, sem sobrescrever revisão 1. Efeitos de habilidades e aplicação dos atributos ao gameplay continuam dependendo de 005/006; não declarados implementados.
