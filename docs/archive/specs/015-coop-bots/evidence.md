# Evidências — 015

Base main 1ee43f0, PR #17 da 014 integrada antes de iniciar 015. Branch feat/015-coop-bots. README, ciclo, refinamento, contratos e spec/plan/tasks lidos; sem constitution/AGENTS.md encontrados. Proprietário delegou execução e merge de cada PR antes da seguinte, sem novas aprovações. Não confundir validação técnica com playtest humano.

## 015-T1

Contrato no [contrato](../../../../specs/contracts/015-coop-bots.md): identidade de participante explícita, bot sem conta Auth/JWT/userId, envelope humano v1 preservado e capacidade acceptBots para entrar em sala nova. Migration 007 acrescenta metadados de bot e match_participants, mantendo match_players só humanos e RPCs históricas intactas. RPC nova restrita a service_role, valida quatro atores/slots/identidades, seed/política/dificuldade e idempotência pelo hash completo.

`node supabase/tests/database/015_bots.cjs` passou em PGlite/Windows: bot sem Auth, uma linha humana/quatro participantes, duplicação idempotente, conflito de dificuldade, rollback por personagem ausente, rejeição de userId em bot, duplicação de ator, dificuldade inválida, RLS dono versus outro usuário, RPC negada ao authenticated e persistência histórica 1v1 com kind humans. Sem aplicar migrations remotas. Gate técnico T1 aprovado.

## 015-T2

BotController usa histórico limitado a 64 observações, atrasado conforme dificuldade; estima interceptação por duas posições passadas/gravidade e decide receber/levantar/atacar/bloquear/sacar ou posicionar. Responsabilidade por time exclui último contato observado e respeita participação do humano ativo. Inputs passam pelo submit/action do runtime, sem teleporte/contato privilegiado. Políticas easy/normal/hard versionadas: reação24/12/6 ticks e erro1,8/0,35/0,06m; mesmos atributos/hitboxes/regras. Seed da sala fixa decisões.

Helpers de identidade mantidos no servidor, pois pacote protocol era somente tipos e apontava para fonte .ts; uma primeira execução revelou ERR_UNKNOWN_FILE_EXTENSION ao importar valor dele. Corrigido antes do gate, sem alterar resolução de pacotes existentes. Runtime usa participantId nos atletas; resultado vsBots inclui quatro atores e política, humanos mantêm payload antigo. Lifecycle conta votos/expiração só humanos; bot sempre sem Auth.

Servidor 48/48 passou, incluindo determinismo de 1200 ticks com mesmos seeds/inputs, limites espaciais, memória de observação, suspensão/descarte, políticas sem alterar atributos, payload de resultado e regressões históricas/rede. Typecheck passou. Carga real e calibração são T4. Gate funcional T2 aprovado.

## 015-T3

Entrada mantém 2v2 online e oferece solo/dupla contra bots com fácil/normal/difícil antes da criação. Servidor aloca atores, seed e slots, seleciona personagens publicados e deixa bots prontos automaticamente. Coop reserva A1 para segundo humano; solo ocupa A1 com bot. Nenhum bot é inserido em sala humana. joinRoom exige acceptBots em salas novas, bloqueando cliente antigo antes de associação; parser recusa identidade/seed/controller arbitrários. Alteração de lado proibida quando contraria composição humana/bot.

Somente humanos votam; resultados versus bots levam identidade/política para RPC própria. Último humano sair remove sala/runtime; desconexões mantêm janela 20/40s e limpeza posterior. Testes de salas solo/coop, capacidade, cliente incompatível, prontidão/votos, seed de revanche e limpeza passaram: servidor51/51, web26/26, typecheck/build. UI identifica bots e dificuldade no lobby e jogo, sem mudança de atributos para simular nível. Capturas locais do lobby inspecionadas; percurso completo no navegador e carga são T4. Gate funcional T3 aprovado.

Proprietário informou ter aplicado todas as migrations no Supabase e criado a conta administrativa. Registrado como relato, não como execução/validação remota realizada pelo implementador.

## 015-T4

Calibração real de 20 partidas por nível contra agente fixo imperfeito (400ms/erro1,8m), mesmos seeds e primeiro saque alternado: fácil10/20, normal20/20, difícil20/20; todas terminaram. Normal/difícil saturam esse adversário, portanto sem alegação de separação estatística entre eles; reação/erro distintos comprovados por código/teste. Espelho de políticas normal produziu partidas longas censuradas e não foi usado para inventar vitórias. Ataques/saques ganharam escolha de espaço a partir de posições observadas atrasadas, mantendo aim legal e atributos iguais.

Teste adicional expôs parceiro interceptando saque próprio em observação ainda de serving. Corrigido o guarda de fase e serveSide; teste unitário cobre o caso. 40 saques com atributos25/75/100 e zonas de partida: normal retornou100% após correção, versus67,5% na medição que detectou o bug; 0/20 vitórias do humano que só saca/fica parado. Relatório 015-calibration.json com cada amostra e descrição do agente.

Carga de 900030ms reais, dez salas solo/30 bots + dez salas humanas ociosas: p951,5212ms (limite16,7), máximo185,5616ms, humano p950,3055ms; 31.348 callbacks,179.080 snapshots sem serialização,220 reinícios. Histórico<=64, runtime vazio após descarte, heap amostrado5,48–21,31MiB com quedas por GC. Essa execução precede o guarda constante de fase/saque; motor e estruturas limitadas são os mesmos. Regressão após correção,60009ms: p953,1077ms, máximo85,0149ms, histórico64 e zero partidas após descarte. Não chamar a regressão de60s de ensaio final de15min; gate aceita ensaio prolongado do motor + teste focado da correção, sem nova complexidade/estrutura de memória. Workload concorrente no Windows, sem garantia WAN/capacidade de produção. Relatórios load.json/load-postfix.json.

Chrome157, Windows, viewport1440x1100: solo1humano+3bots e coop2+2 chegaram a0x6 por pontos e revanche nova/zerada preservando seed/dificuldade; somente humanos votaram. Bot IDs sem userId e ações aceitas observadas, zero exceções JS. Primeiro teste coop interrompido por hot reload durante edição foi descartado; nova execução isolou o canal HMR sem bloquear estilos. Scripts/capturas/results.json em docs/acceptance/015-*. Inspeção visual do implementador, sem alegar humano jogando.

SQL T1, servidor52/52, web26/26, typecheck/build e diff check passaram. Migration007 é necessária; proprietário reportou aplicação, mas validação Auth/RPC remota não foi executada daqui. Guia em 015-validation.md. Gate T4 técnico aprovado conforme delegação; PR/merge da015 antes de iniciar016.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

