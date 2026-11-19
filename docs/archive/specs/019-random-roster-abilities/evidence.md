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

## 019-T3 — Seletor e sorteio

No Windows e Edge 157.0.4341.60, `node docs/acceptance/019-ability-picker.cjs` passou com Vite na porta 5177 e a fixture `node docs/acceptance/012-admin.cjs --serve`. O ensaio cobriu catálogo vazio, opção única, duas opções e sorteio desabilitado pela configuração de produção. O seletor apresentou efeito, alvo, duração e recarga, e Enter/Espaço sortearam apenas o campo da habilidade, preservando nome e atributo em edição. O teste unitário do sorteio injeta a fonte aleatória e testa todos os intervalos das alternativas. Gate T3 aprovado.

## 019-T4 — Do rascunho ao rally

Com as dependências de teste instaladas conforme a [018](../018-visual-roster-editor/evidence.md#018-t4--do-rascunho-à-quadra), execute `npm.cmd run build`. Inicie o Vite em `127.0.0.1:5177` com `apps/web/vite.config.ts` e rode os comandos abaixo em terminais separados. Cada execução do percurso começa com uma fixture nova, pois verifica a primeira publicação de cada ID.

```powershell
node docs/acceptance/012-admin.cjs --serve --ability-review
# Outro terminal
node docs/acceptance/019-ability-journey.cjs
```

No Windows e Edge 157.0.4341.60, o navegador sorteou Café no Intervalo e selecionou Mão de Manteiga e Minha Bola! manualmente. Em cada caso, o ID exibido foi o enviado ao RPC. Reabrir e salvar novamente preservaram o ID e a ficha. A primeira publicação de cada candidato criou a revisão 1 e copiou a configuração do catálogo. Entre o segundo salvamento e a publicação de Minha Bola!, a fixture desabilitou o ID no banco. O editor mostrou o aviso e a opção indisponível, preservou o nome e a seleção, e o banco manteve a revisão 2 e a ausência no catálogo de jogo. A mesma ficha foi publicada após reabilitar o ID e recarregar a lista. [Ficha e detalhes](../../../acceptance/019-admin.png).

| Configuração ensaiada | Resultado em partida local |
| --- | --- |
| Café no Intervalo · +15% velocidade · 3 s / 22 s | A1 correu a 4,97 → 5,715 → 4,97 m/s conforme os snapshots. A tentativa de Minha Bola! durante o Café preservou o efeito ativo e a recarga do parceiro. |
| Mão de Manteiga · −15% recepção · 4 s / 18 s | B1 aceitou a recepção a 2,1 m antes do efeito, recusou durante e voltou a aceitar após expirar. A Bronca foi recusada enquanto a Mão de Manteiga estava ativa e passou depois. |
| Minha Bola! · +10% recepção do parceiro · 4 s / 24 s | A1 recusou a recepção a 2,35 m no controle, aceitou com o bônus e voltou a recusar após expirar. No modo solo, o servidor aplicou o efeito ao bot A2. |
| Poderes legados | Samuel aplicou sua penalidade e gerou feedback e ação visual de Bronca. Caio recusou ativação distante e concedeu um ponto adversário com a bola ao alcance. |

Os dois vídeos de 960×540 foram reproduzidos no Edge e conferidos por quadros do HUD e das jogadas. O clipe de A1 tem 23,36 s e mostra Café e o ensaio de Minha Bola!. O de B1 tem 22,64 s e mostra Mão de Manteiga e Bronca. Incluem entrada na sala e contagem regressiva. A fixture coloca a bola em posições controladas e limita a cadência de renderização dos quatro clientes, com os comandos, contatos, relógio e feedback do runtime v4 e WebSocket v1. [Time A](../../../acceptance/019-time-A.webm) · [Time B](../../../acceptance/019-time-B.webm) · [Relatório](../../../acceptance/019-results.json).

O build passou com aviso de tamanho de chunk do Vite. A validação usa PGlite, migrations reais e autenticação local de teste. Gate T4 local aprovado para as configurações acima. A disponibilização dos candidatos e do sorteio em produção continua condicionada ao aceite da configuração e dos clipes pelo proprietário.
