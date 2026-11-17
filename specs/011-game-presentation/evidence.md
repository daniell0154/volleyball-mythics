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
