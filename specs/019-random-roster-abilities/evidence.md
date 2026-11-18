# Evidências — 019

## 019-T1 — Catálogo canônico

Base `98ae5fa`, merge da 018 na `main`. A migration 009 define o catálogo e conserva as configurações legadas da migration 003. Em Windows e PGlite, `node supabase/tests/database/019_abilities.cjs` publicou a primeira revisão com `free_point_out` numa fixture sem personagem anterior com esse ID. O teste verificou leitura administrativa, RLS, sessão anônima com membership, rejeição de escrita direta e revalidação ao desabilitar a habilidade entre salvar e publicar. O rascunho manteve a revisão após a recusa. A configuração congelada da revisão publicada e a revisão de Samuel se mantiveram após alterações do catálogo.

`node supabase/tests/database/012_admin.cjs` passou as verificações da 012 e 018 no banco local. Gate T1 aprovado.
