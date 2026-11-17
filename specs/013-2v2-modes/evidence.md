# Evidências — 013

Base origin/main a04aadb, merge da PR #15 (012). Branch feat/013-2v2-modes; nenhuma PR anterior. README, refinamento, contratos ativos/futuros, ciclo e spec/plan/tasks lidos; sem AGENTS.md/constitution encontrados. Configuração remota da 012 foi adiada pelo proprietário e não é apresentada como validada.

## 013-T1

Mapeamento por rg nos consumidores de 1v1, createRoom, Demo e Game. Decisão em contract.md: preservar formatos/dados históricos e reconhecer pedido antigo para rejeitar com mode_unavailable na fronteira pública. Nenhuma migration ou remoção de histórico. Remover Demo/Game somente após conferir dependências compartilhadas. Verificação documental proporcional; nenhum teste de implementação alegado nesta etapa. Gate T1 aprovado.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

## 013-T2

RoomApplication rejeita criação 1v1 com mode_unavailable antes de criar sala; protocolo v1 preservado, mensagem no cliente orienta atualizar para 2v2. Entrada sem seletor de modo envia sempre 2v2 e explica quatro humanos. Integração de sockets migrada para quatro jogadores mais um visitante recusado por lotação; verifica que pedido legado não cria sala e visitante não recebe snapshots. Fixtures de simulação/histórico mantêm 1v1 internamente; nenhuma migration destrutiva.

Servidor 40/40 passou, incluindo proprietário/prontidão/slots/personagens repetidos, snapshots/input em quatro sessões e RTT 150ms/jitter 30ms. Ambiente Node/Windows local; sem WAN ou Supabase remoto. Gate funcional T2 aprovado; UX completa na T4.

## 013-T3

Removidos botão/importação Demo e componentes exclusivos Demo.tsx/Game.tsx, além de CSS do seletor de modo. main mantém lobby e rota /admin; preview de personagem, cena compartilhada e fontes sintéticas usadas por benchmarks/testes permanecem. Nenhum asset binário exclusivo encontrado. React Native Web fica como dependência histórica do projeto, sem importação na entrada atual.

Web 24/24, typecheck e build completos passaram. Build sem chunk Demo/Game; chunks de CharacterPreview/Admin/OnlineMatch continuam sob demanda. Módulos transformados caíram de 339 na 012 para 87; isso não é benchmark de runtime. Sem avisos de use client de RN Web nesta build; aviso do chunk 3D >500kB permanece. Gate funcional T3 aprovado; navegação/preview de usuário na T4.

## 013-T4 — aceite técnico executado; revisão do proprietário pendente

Pedido posterior do proprietário: facilitar acesso ao admin por botão. Link do cabeçalho foi destacado como “Admin do elenco” e incluído na prévia 013, cujo cabeçalho de fixture não mostrava o acesso. Prévia aponta para /admin da build local servida em 3016; produção usa /admin no mesmo site. Não altera autorização nem elimina necessidade da configuração Supabase da 012. Build web e git diff --check passaram após esse ajuste de navegação.

`npm run test --workspace @volleyball-mythics/server`: 43/43 passou. Três testes adicionais em 2v2-acceptance.test.mjs verificam início incompleto recusado, suspensão com tick congelado, retorno em 19s/contagem 3s, prazo 20s, orçamento acumulado 40s, cancelamento com ambos os lados incompletos, abandono, sexto ponto persistido com quatro participantes e necessidade dos quatro votos. Relógio controlado e repositório de resultados em memória; não é evidência de espera WAN real.

`node supabase/tests/database/005_match.cjs`: passou com PostgreSQL/WASM local, incluindo leitura de personagens iniciais e gravação/leitura de resultado legado 1v1, resultado cancelado, idempotência, conflito, rollback e permissões. Sem nova migration nesta spec; nenhuma enum/história apagada. Não alega validação remota do Supabase.

`node docs/acceptance/013-journey.cjs`: Chrome 157.0.8103.79, Windows, admin/rotas reais da build e quatro contextos de jogo, owner 1440x1100 e demais 640x480. Passou: convites, personagens repetidos, dono exclusivo, prontidão, saque por teclado, placar real 6x5, unanimidade da revanche/novo ID/zero pontos e abandono preservando 0x0. Zero erros de protocolo observados e zero exceções JS. /, /demo e /preview não montam demonstração; /admin preservado; preview do personagem com canvas único. Primeiro ensaio do harness corrigido para aguardar o import dinâmico do canvas, sem alteração de produto. Relatório 013-results.json e capturas 013-entry/lobby/match.png.

Verificação integrada: web 24/24, tipos/build e git diff --check passaram. Procedimento/limites em docs/acceptance/013-2v2.md. Auth e persistência do browser são fixtures locais; nenhuma evidência remota de Supabase, Firefox/Safari ou performance de GPU alegada. T4 permanece aberta para aprovação da experiência pelo proprietário; PR draft, sem merge/deploy. Spec/plan/tasks/contratos e código revisados, mantendo testes históricos internos e recusando criação pública 1v1. Próxima spec 014 somente após aceite/integração da 013.

