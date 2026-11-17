# Evidências — 011-game-presentation

Base: main ea71625 (010 integrada). Branch feat/011-game-presentation. README, REFINAMENTO, contratos e spec/plan/tasks lidos; sem AGENTS.md/constitution encontrados.

## 011-T1 — Entrada e catálogo

Entrada com apelido, criar sala por modo e convite por código; catálogo protegido por sessão guest é consultado antes de entrar na sala. Nome continua salvo em profiles ao conectar; token/sessão continuam no Supabase. Requests concorrentes de preparação compartilham somente a promessa em andamento, permitindo renovar token nas chamadas futuras.
CharacterShowcase recebe catálogo dinâmico, mostra sete atributos/overall/habilidade e um preview por seleção. CharacterPreview responsivo libera observer/contexto/recursos ao trocar modelo. Preview, cena online e demonstração entram por import dinâmico.
Smoke Chrome com cinco fixtures exclusivamente em docs/acceptance, nome longo, troca de atleta, catálogo vazio/falha: passou, um canvas e zero exceções JS. Captura 011-entry.png e ferramenta 011-entry.cjs. Tipos passaram após ajustar o retorno assíncrono da função de reconexão. Cenário usa gateway guest de teste e sockets reais locais, não valida Supabase remoto (checkout sem .env).
Gate funcional T1 aprovado; revisão visual do percurso completo fica na T4.

## 011-T2 — Lobby e orientação

RoomLobby mostra modo, código/link de convite, slots A/B, atleta, criador, conexão/prontidão e lugares livres. Atleta destacado é selecionado no servidor ao criar/entrar; catálogo recebido pelo socket é autoritativo. Mensagem explica o bloqueio de início; somente criador e sala completa/pronta habilitam o botão. Erros localizados junto ao formulário/comandos, nomes internos de erros não são exibidos.
Web 21/21 passou. Smoke Chrome com duas sessões/socket real: personagens repetidos, dono exclusivo para iniciar e invalidação de prontidão ao trocar personagem passaram; zero exceções JS. Captura 011-lobby.png. Convite preserva rota e remove query/hash anteriores; cópia tem fallback para seleção manual. Gate T2 aprovado.

## 011-T3 — HUD de partida

MatchHud centraliza placar/fase/contagem, identifica equipe e posição locais, sacador e atleta. Instruções mudam com a fase autoritativa. Controles de qualidade/volume e câmera estável estão em seção expansível, com aviso de que não pausa o jogo. Câmera estável mantém vista fixa alinhada à equipe sem alterar física/inputs; preferência respeita configuração do sistema e pode ser persistida localmente.
Marcador local combina anéis, triângulo e texto VOCÊ, sem depender apenas da cor. HUD fica fora do canvas, sem painel cobrindo bola/rede. Material do sprite e textura do rótulo têm descarte explícito. Fallback WebGL preserva placar/navegação, desabilita ações e informa que não equivale à quadra visual nem pausa a partida. Nenhum código de servidor ou física foi alterado.
Web 23/23 passou, incluindo instruções por fase/slot e enquadramento fixo da quadra dos dois lados. Smoke Chrome com duas sessões: HUD, slider mudo, alternância da câmera, canvas único e saque por teclado passaram; zero exceções JS. Captura 011-match.png. O smoke valida controle de volume, não saída audível; checagem completa de áudio, zoom, browsers e percurso fica para T4.
Build web passou com chunks separados de preview, cena, partida e demonstração. Mantém os avisos de use client do RN Web e de chunk 3D >500 kB; não é medição de performance de renderer. Gate funcional T3 aprovado.

## Ponto de retomada

Proprietário solicitou parar ao concluir T3: “quando finalizar a t3 pare o seu work. Continuaremos depois.” T4 não foi iniciada. Retomar na mesma branch/PR: percurso completo por teclado até resultado/revanche, cinco fixtures/nome longo, WebGL indisponível, zoom 200%, contraste >=4,5:1 e matriz de versões/pendências reais dos browsers, além da aprovação visual final.
