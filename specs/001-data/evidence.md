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

## 001-T2 — Migrações de esquema

- Requisito: tabelas de perfis, personagens versionados, partidas e participantes; chaves e limites conforme contratos.
- Alteração: migration SQL adicionada com constraints, índices, RLS e escrita privilegiada reservada ao backend.
- Verificação: aplicadas as duas migrations em PostgreSQL Supabase 17.12 temporário limpo, após provisionar roles/schema `auth` mínimos para emular o ambiente gerenciado. Tabelas, constraints, índices, policies e função RPC criadas sem erro.
- Consulta de confirmação: `to_regclass('public.matches')` e `to_regprocedure('public.persist_match_result(jsonb)')` retornaram as entidades esperadas.
- Limitação: não aplicado ao projeto online do proprietário; nenhum projeto remoto foi acessado.
- Gate: migration aplicável em PostgreSQL limpo; instruções para aplicar no Supabase online estão em `docs/SUPABASE_SETUP.md`.

## 001-T3 — Políticas e Auth guest

- Requisito: impedir edição client-side de catálogo/resultados, permitir guest e manter sessão no navegador.
- Alteração: políticas RLS; cliente web usa publishable key, `signInAnonymously`, sessão persistente e grava apenas o próprio perfil; configuração habilita anonymous sign-ins.
- Verificação: `npx tsc --noEmit -p apps/web/tsconfig.json` passou. Políticas revisadas na migration; não houve Auth server real nem teste de dois navegadores contra projeto Supabase.
- Limitação: a conta guest é anônima e não recuperável em outro dispositivo; login depende de habilitar anonymous sign-ins no painel (guia Supabase).
- Gate: código e políticas prontos; validação integrada remota pendente de configuração de projeto/chaves.

## 001-T4 — Persistência idempotente do resultado

- Requisito: uma escrita transacional, retry idêntico idempotente, conflito rejeitado e falha revertida.
- Alteração: RPC `persist_match_result` protegida para `service_role`; grava partida e participantes na mesma transação, confere hash de payload em retry e rejeita conflito.
- Verificação: `npx tsc --noEmit -p apps/server/tsconfig.json` passou; função criada na instância PostgreSQL temporária.
- Limitação: não executado teste de concorrência/retry com partidas de fixture nem integração real com servidor. A gravação tem garantia transacional pelo RPC PostgreSQL; integração de partida será feita na feature de servidor.
- Gate: assinatura do repositório e migração prontas; teste integrado fica pendente antes de usar em produção.
