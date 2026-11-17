# Evidências — 012

Base main 909b898, 011 integrada por PR #14. Branch feat/012-admin-roster, sem PR anterior. README, refinamento, contratos, ciclo e spec/plan/tasks lidos; constitution/AGENTS.md não encontrados.

## 012-T1

Contrato em contract.md e bootstrap/revogação em docs/admin/012-operations.md. Migration 005 cria membership privado, drafts/audit com RLS e trigger de imutabilidade de conteúdo publicado. Apenas enabled pode mudar. Papel exige membership e JWT explicitamente não anônimo; nem admin tem escrita direta nas tabelas.

`node supabase/tests/database/012_admin.cjs`: passou em PostgreSQL WASM/PGlite local no Windows; cobre guest mesmo com membership, auto promoção negada, leitura filtrada, admin reconhecido, escrita direta negada e trigger de imutabilidade. Sem credenciais remotas; migrations não aplicadas no Supabase hospedado. Gate técnico T1 aprovado; sem alegação de integração Auth remota.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

## 012-T2

Migration 006 expõe roster_write via RPC autenticada: save/publish/disable com revisão otimista e advisory lock por personagem. Validação de nome, atributos, visual e habilidade; configuração canônica dos handlers publicados, sem JSON mecânico arbitrário. Publicação/desativação/auditoria atômicas. Corrigido o trigger T1 para excluir overall gerado na comparação BEFORE, quando o PostgreSQL ainda não o calculou; atributos continuam imutáveis e overall não aceita escrita manual.

`node supabase/tests/database/012_admin.cjs` passou: inválidos não deixam auditoria, draft invisível ao catálogo, duas publicações concorrentes resultam em um sucesso/um conflito, versões preservadas, overall calculado, disable e revogação. Execução local PGlite, não PostgREST remoto. Servidor 40/40 passou, incluindo revisões de atributos/visual/poder fixadas na partida. Loader RLS recarrega antes de select/ready/start/rematch e a cada 2s com sessões; falhas rejeitam comandos dependentes. Gate técnico T2 aprovado.

## 012-T3

Rota /admin com chunk sob demanda, login Supabase por email/senha e storageKey separado do guest. Lista paginada (50), edição com revisão otimista, overall derivado, seleção de habilidade existente e modelo/variação visual. Save/publicar/desativar mostram estado e mensagens; campos possuem constraints e preview compartilhado. Namespace procedural:athletic-v2 permite novos atletas articulados sem mudar manifesto, preservando chaves v1 e modelos iniciais.

Chrome 157.0.8103.79 em 1440x1100: formulário/preenchimento/save/publicação/preview passou, captura 012-admin.png; nome acessível do seletor corrigido após primeiro ensaio. Harness 012-admin.cjs usa RPC/migrations reais no PGlite e autenticação exclusiva de fixture; não valida login Supabase remoto. Web 23/23 passou antes do teste adicional de avatar, tipos e build completo passaram. Runner web inicialmente recebeu EPERM do sandbox e passou fora dele. Avisos conhecidos RN Web/use client e chunk 3D >500kB preservados. Gate funcional T3 aprovado; revisão do proprietário na T4.

## 012-T4 — validação técnica executada, aceite pendente

`node docs/acceptance/012-admin.cjs`: passou, relatório 012-results.json. Dois contextos com personagem recém-publicado iniciaram partida pelo transporte/runtime reais; editar/publicar v2 e desativar preservou atributos (saque 90), visual e seleção v1 da partida ativa. Catálogo habilitado deixou de oferecer o personagem. Preview e jogo sem exceções JS, capturas 012-admin.png/012-match.png. Banco de teste em memória com migrations e RPC reais; auth e refresh de catálogo controlados pelo harness, limites em 012-admin.md.

Web 24/24 passou com teste do namespace de avatar dinâmico, além de 40/40 do servidor e SQL T1/T2. Typecheck dos workspaces, build completo e git diff --check passaram na integração final. Não foram aplicadas migrations no Supabase remoto nem provisionada conta do proprietário: checkout sem .env (Test-Path .env = False). Bootstrap e operação documentados, sem inventar conta ou publicar fixtures. T4 permanece pendente da revisão do proprietário e validação Auth/RPC remota. Abrir PR draft com limites explícitos; nenhuma aprovação visual inferida do smoke. Próxima spec será 013 somente após aceite/integração da 012.

