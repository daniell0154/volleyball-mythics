# Evidências — 011-game-presentation

Base: main ea71625 (010 integrada). Branch feat/011-game-presentation. README, REFINAMENTO, contratos e spec/plan/tasks lidos; sem AGENTS.md/constitution encontrados.

## 011-T1 — Entrada e catálogo

Entrada com apelido, criar sala por modo e convite por código; catálogo protegido por sessão guest é consultado antes de entrar na sala. Nome continua salvo em profiles ao conectar; token/sessão continuam no Supabase. Requests concorrentes de preparação compartilham somente a promessa em andamento, permitindo renovar token nas chamadas futuras.
CharacterShowcase recebe catálogo dinâmico, mostra sete atributos/overall/habilidade e um preview por seleção. CharacterPreview responsivo libera observer/contexto/recursos ao trocar modelo. Preview, cena online e demonstração entram por import dinâmico.
Smoke Chrome com cinco fixtures exclusivamente em docs/acceptance, nome longo, troca de atleta, catálogo vazio/falha: passou, um canvas e zero exceções JS. Captura 011-entry.png e ferramenta 011-entry.cjs. Tipos passaram após ajustar o retorno assíncrono da função de reconexão. Cenário usa gateway guest de teste e sockets reais locais, não valida Supabase remoto (checkout sem .env).
Gate funcional T1 aprovado; revisão visual do percurso completo fica na T4.
