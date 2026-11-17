# Evidências — 012

Base main 909b898, 011 integrada por PR #14. Branch feat/012-admin-roster, sem PR anterior. README, refinamento, contratos, ciclo e spec/plan/tasks lidos; constitution/AGENTS.md não encontrados.

## 012-T1

Contrato em contract.md e bootstrap/revogação em docs/admin/012-operations.md. Migration 005 cria membership privado, drafts/audit com RLS e trigger de imutabilidade de conteúdo publicado. Apenas enabled pode mudar. Papel exige membership e JWT explicitamente não anônimo; nem admin tem escrita direta nas tabelas.

`node supabase/tests/database/012_admin.cjs`: passou em PostgreSQL WASM/PGlite local no Windows; cobre guest mesmo com membership, auto promoção negada, leitura filtrada, admin reconhecido, escrita direta negada e trigger de imutabilidade. Sem credenciais remotas; migrations não aplicadas no Supabase hospedado. Gate técnico T1 aprovado; sem alegação de integração Auth remota.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

