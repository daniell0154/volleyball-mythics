# Evidências — 001-data

## 001-T1 — Bootstrap workspace e contratos

- Requisito: R01; contratos TypeScript compartilhados.
- Comando: `npm install`.
- Resultado: concluído; TypeScript instalado e lockfile gerado.
- Comando: `npm run typecheck`.
- Resultado: passou para `@volleyball-mythics/protocol`.
- Ambiente: Windows, Node v22.14.0, npm 10.9.2.
- Limitações: contratos são tipos estáticos; validação de payload em runtime será feita na tarefa de rede. `index.test.ts` verifica compilação dos tipos, não é teste executável.
- Gate: aprovado para iniciar a tarefa 001-T2.

## 001-T2 — Migração inicial (parcial)

- Requisito: tabelas de perfis, personagens versionados, partidas e participantes; chaves e limites conforme contratos.
- Alteração: migration SQL adicionada com constraints, índices, RLS e escrita privilegiada reservada ao backend.
- Verificação: revisão estática do SQL; aplicação em banco vazio ainda não executada, pois o workspace não tem Supabase CLI, Docker nem credenciais de banco configuradas.
- Status: bloqueada para aceite completo. Tarefa permanece pendente até aplicar a migração localmente e validar constraints/RLS.
