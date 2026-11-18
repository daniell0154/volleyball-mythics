# Evidências — 019

## 019-T1 — Catálogo canônico

Base `98ae5fa`, merge da 018 na `main`. A migration 009 define o catálogo e conserva as configurações legadas da migration 003. Em Windows e PGlite, `node supabase/tests/database/019_abilities.cjs` publicou a primeira revisão com `free_point_out` numa fixture sem personagem anterior com esse ID. O teste verificou leitura administrativa, RLS, sessão anônima com membership, rejeição de escrita direta e revalidação ao desabilitar a habilidade entre salvar e publicar. O rascunho manteve a revisão após a recusa. A configuração congelada da revisão publicada e a revisão de Samuel se mantiveram após alterações do catálogo.

`node supabase/tests/database/012_admin.cjs` passou as verificações da 012 e 018 no banco local. Gate T1 aprovado.

## 019-T2 — Efeito autoritativo

No Windows com Node 26, `npm.cmd run test --workspace @volleyball-mythics/server` passou 59 testes. `node --test packages/domain/tests/*.test.mjs` passou 23. O ensaio da 019 usou as configurações da migration 010, entradas pelo runtime e posições controladas da bola para repetir a mesma recepção. Uma bola acima da quadra manteve o relógio em rally entre medições de expiração.

| Cenário nos times A e B | Atributo 1 | Atributo 100 |
| --- | --- | --- |
| Café no Intervalo, corrida base → ativa | 2,0 → 2,3 m/s | 8,0 → 9,2 m/s |
| Mão de Manteiga, recepção aceita em controle e recusada com efeito | 1,9888 m | 2,1738 m |
| Minha Bola!, recepção recusada em controle e aceita com efeito | 2,2575 m | 2,4675 m |

Os efeitos expiraram aos 180, 240 e 240 ticks. A corrida e a recepção voltaram ao resultado de controle. O teste cobriu ator com atributo extremo, ataque com Mão de Manteiga, recarga, sequência repetida, fase de saque e alvo humano ausente, desconectado ou bot. Café e Mão de Manteiga em colisão com a Bronca preservaram o primeiro efeito e a recarga do segundo ator nos dois sentidos. Minha Bola! e a Bronca coexistiram quando destinadas a parceiros diferentes. A Bronca preserva sua penalidade histórica para os contatos; o ponto de Caio preserva o teste de alcance e ocorre uma vez. A migration registra os candidatos desabilitados. Gate T2 aprovado.
