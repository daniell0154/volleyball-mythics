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

## Histórico de retomada

Proprietário solicitou parar ao concluir T3: “quando finalizar a t3 pare o seu work. Continuaremos depois.” T4 não foi iniciada. Retomar na mesma branch/PR: percurso completo por teclado até resultado/revanche, cinco fixtures/nome longo, WebGL indisponível, zoom 200%, contraste >=4,5:1 e matriz de versões/pendências reais dos browsers, além da aprovação visual final.

Em 2026-11-17, o proprietário solicitou continuar a spec 011. T4 retomada na mesma branch e PR #14; o registro acima descreve a parada anterior, não um bloqueio atual.

## 011-T4 — Aceite do percurso

Harness reproduzível em docs/acceptance/011-journey.cjs e procedimento/limites em docs/acceptance/011-journey.md. Exercita a apresentação real com gateway guest isolado, cinco fixtures exclusivas de teste e transporte/simulação/ciclo de resultado e revanche reais. Tab/Enter, Espaço, Home/End e L são usados para criar/entrar, selecionar, marcar pronto, iniciar, configurar áudio/imagem, sacar e votar. Nenhum clique, foco programático ou injeção de pontos. Inatividade após o saque permite concluir por timeouts normais até seis; não é playtest humano de rallies.

Correção encontrada pela inspeção: nomes longos comprimiam o marcador de posição no lobby, quebrando A1 em duas linhas. `.slot-number` agora impede encolhimento/quebra. Não altera física, renderer, contratos ou autenticação de produção.

Regressões executadas nesta retomada: web 23/23, typecheck de todos os workspaces e build completo passaram. Build web repetido após o ajuste CSS passou; git diff --check passou. Permanecem os avisos conhecidos de diretivas use client do RN Web e chunk 3D acima de 500 kB. Sem nova medição de performance, carga ou reconexão; evidências anteriores não foram apresentadas como se fossem novas.

Ambiente: Windows 11/kernel 10.0.26200, i7-1185G7, 16 GiB RAM; Chrome/Edge instalados via Playwright headless. Uma execução preliminar foi interrompida ao atualizar o harness; a seguinte perdeu o processo do navegador durante o 2v2. Não contadas como aprovação. Reexecução final reduz viewports das sessões auxiliares e registra resultados reais no JSON.

Execução final `node docs/acceptance/011-journey.cjs`: passou em Chrome 157.0.8103.79 e Edge 157.0.4341.60. Quatro percursos (1v1/2v2 em cada browser), todos até 6×5 por pontos, novo matchId/placar zero após unanimidade de votos, zero exceções JS. Cinco entradas/nome longo e layout sem overflow horizontal verificados em entrada, lobby, opções, resultado e revanche. Texto HTML habilitado: contraste mínimo 8,13:1 (HUD/revanche mínimo 8,78:1), acima de 4,5:1 no escopo descrito no procedimento. Qualidade alta/baixa e câmera estável pelo teclado passaram. Web Audio gerou ganho 0,08 em 100% e nenhum novo sinal no ponto após silenciar. Fallback WebGL no preview/partida preservou diagnóstico/navegação e desabilitou ações; saída por teclado passou. Relatório completo em 011-journey-results.json; capturas finais feitas no Edge, exceto a captura específica de zoom no Chrome.

Antes do aceite final, o gate T4 permaneceu aberto para aprovação visual e verificações manuais documentadas; PR #14 mantida como draft. Firefox/Safari ausentes e saída audível não comprovada são limitações reais, sem inferir testes desses cenários. Revisão de consistência: spec/plan/tasks e contratos continuam alinhados; nenhum contrato ou conteúdo de elenco alterado. Não há próxima spec numerada neste ciclo após a 011; nova funcionalidade exige definição posterior.

Zoom nativo: preferência inicial em arquivo não foi aplicada (DPR observado 1). A configuração pela página interna funcionou no Chrome: 200%, outerWidth 1440, innerWidth/scrollWidth 709 CSS px e DPR 2, nome longo sem overflow na entrada/catálogo. Registrado em 011-zoom.cjs, 011-zoom-results.json e 011-zoom-native-chrome.png. No Edge, o controle da página interna não ficou acessível à automação; checagem nativa permanece manual. Percurso completo usa layout equivalente a 200% (720 CSS px/DPR 2) nos dois navegadores; não apresentar equivalência como se fosse zoom nativo do percurso inteiro.

Aceite final do proprietário em 2026-11-17: “ta perfeito mano podemos subir”, após o resumo dos testes e das pendências manuais de zoom/áudio e Firefox/Safari. Registrada aprovação visual e aceite da entrega com essas limitações, sem transformar o comentário em evidência de verificações técnicas não relatadas. Gate T4 aprovado para esta versão pelos critérios revisados no aceite final da spec; T1–T4 concluídas. Publicar este registro na branch existente e retirar a PR #14 de draft. A aprovação não executa merge/deploy nem encerra as pendências de publicação da 007. Como a mudança deste aceite é apenas documental, verificação proporcional: git diff --check; resultados técnicos anteriores preservados.
