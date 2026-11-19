# Plano técnico — 012

Ler docs/MELHORIAS-012-016.md e docs/archive/specs/future-contracts-012-016.md. Dependência: 011 integrada; aguardar integração. Destinos: apps/web/src/admin (novo), apps/server/src/admin (novo), supabase/migrations e tests/database, catálogo e resolvedor de avatares.

Executar tarefas em ordem. Antes de código dependente, especificar schemas, limites e compatibilidade; atualizar contratos ativos somente com implementação. Uma branch/PR desta spec e um commit por tarefa, incluindo testes e evidências. Sem merge/deploy automático.

Verificação: testes proporcionais no domínio/servidor/banco quando alterados; apresentação e percurso no navegador; typecheck/build na integração. Fixtures não são elenco publicado. Registrar comando, build, ambiente, resultados e limitações. Não interpretar planejamento como evidência de desempenho ou segurança.

