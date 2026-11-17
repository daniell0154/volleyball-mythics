# Evolução do Volleyball Mythics
Status: proposta de implementação. Base: main 4202c6c, após PR #9. Pedido do proprietário: personagens melhor modelados, jogo mais dinâmico e animações. Este documento e as specs não representam funcionalidades já entregues.

## Referência inspecionada
[Happy Hoops](https://happy-hoops.onrender.com/) acessado em 2026-11-17 no Chrome desktop, viewport 1440×900. Foram abertas a entrada e a opção Treino, chegando ao estado inicial CHECK. A inspeção não mediu desempenho nem validou uma partida completa ou a arquitetura interna da referência.

Observações diretas:
- Entrada com hierarquia clara: apelido, criar sala, entrar por código e treino.
- Atleta em destaque com modelo 3D, nome, overall, atributos e seleção por indicadores.
- Modelo com volumes arredondados, rosto, cabelo, mãos e membros distinguíveis; aparência mais expressiva que o avatar atual em caixas.
- Quadra de treino com placar/fase no topo, instrução contextual de início, nomes sobre atletas, marcador no chão e cartões de jogadores embaixo.
- Controles de áudio e qualidade ficam acessíveis durante a partida.

Estas observações inspiram a organização e a legibilidade. Timing, transições de animação, física e valores de desempenho abaixo são propostas próprias para vôlei, não fatos medidos no Happy Hoops. Não copiar modelos, nomes, código ou identidade visual da referência.

## Diagnóstico do projeto
O renderer atual constrói corpos com BoxGeometry em um grupo sem articulações; a cena atualiza posição, mas não uma sequência de poses. A apresentação recebe posições e fase, sem um contrato de ações aceitas para sincronizar golpes. Já existem servidor autoritativo, interpolação, câmera em terceira pessoa, 1v1/2v2, habilidades e controle de volume. A evolução deve trabalhar sobre essa base.

## Direção de produto
Visual esportivo estilizado, personagens reconhecíveis à distância, bola e ações fáceis de ler e rallies com oportunidades de reação. Samuel e Caio continuam sendo o elenco inicial da tese; cadastrar outros depois não pode exigir refazer a cena ou animações. Não alterar atributos, poderes, regras de seis pontos ou composição de salas por uma mudança visual.

| Ordem | Spec | Resultado esperado |
| --- | --- | --- |
| 1 | [008 — Modelos articulados](../specs/008-character-models/spec.md) | Silhuetas, rosto, roupas e rig reutilizável |
| 2 | [009 — Animações](../specs/009-character-animation/spec.md) | Locomoção e ações sincronizadas com o servidor |
| 3 | [010 — Dinâmica do rally](../specs/010-rally-dynamics/spec.md) | Resposta previsível, contato legível e tuning medido |
| 4 | [011 — Apresentação e orientação](../specs/011-game-presentation/spec.md) | Entrada com elenco em destaque e HUD contextual |

008 precede 009 para fixar articulações; 009 precede 010 para avaliar sensação de contato com poses legíveis; 011 consolida os componentes. Planejamento pode evoluir em paralelo, mas implementação segue esta ordem, uma branch/PR por spec.

## Modelagem e animação
Começar com malha procedural articulada em Three.js: volumes arredondados e hierarquia de pivôs para quadril, tronco, cabeça, ombros, cotovelos, pulsos, joelhos e tornozelos. Isso permite melhorar os atletas sem depender de arquivos externos. GLB/skinning fica como substituição posterior por ADR se a direção visual não atingir o aceite. Preservar aparência determinística e manter as chaves antigas; um manifesto explícito liga cada revisão ao modelo aprovado.

Animação não muda hitbox, posição autoritativa ou resultado. Caminhada deriva de deslocamento observado; saque, recepção, levantamento, ataque, bloqueio e especial usam ação aceita e tick do servidor. Separar antecipação visual local opcional do contato confirmado. A referência temporal é a mesma usada na interpolação da bola.

## O que significa mais dinâmico
Não aumentar todas as velocidades. Primeiro medir baseline: duração de rally, toques, saques sem devolução, tentativas fora de alcance, tempo entre input e resposta e intervalos sem controle. Depois comparar parâmetros versionados de trajetória, alcance e recuperação. Priorizar recepção, levantamento e ataque distintos, sinal de contato e tempo para recuperar posição. Preservar as faltas, idempotência e regras de atributos.

Meta inicial de playtest: em 20 rallies por modo, pelo menos 70% dos saques legais têm devolução e a mediana atinge 3 contatos legais após o saque, com jogadores familiarizados com os controles. São metas de calibração propostas, não garantias nem estatísticas atuais. Registrar participantes, build e condições; se a amostra mostrar que prejudicam diversão ou partidas curtas, revisar a meta antes de aprovar tuning.

Decisão de aceite da 010: após testar e aprovar a melhoria, o proprietário dispensou explicitamente a coleta manual de 20 rallies humanos por modo por ser trabalhosa. Esta entrega usa a comparação técnica reproduzível de 20 amostras por modo, regressões/carga e aprovação qualitativa do proprietário. As metas humanas acima ficam como referência opcional futura, sem alegação de terem sido atingidas.

## Interface e acessibilidade
Entrada com modelo/ficha e duas ações principais: criar sala e entrar por código. Lobby mostra slots, prontidão e convite; jogo mostra placar, fase, sacador, equipe e recarga. Indicadores de chão identificam o jogador local com forma/texto além da cor. Sinais curtos de contato e ponto respeitam volume; reduzir movimento desativa balanço de câmera e efeitos extras. Manter foco visível e comandos acessíveis.

Treino com computador, troca de atleta e regras de basquete observadas na referência não entram neste ciclo. Treino exige nova spec porque o contrato atual exclui bots. Dispositivos móveis, ranked, cosméticos comerciais e elenco adicional também não são entregas deste planejamento.

## Critérios comuns de entrega
- Registrar hardware, browser, build, resolução, qualidade e cenário. Usar baseline comparável: quatro atletas em 1280×720, DPR 1, qualidade baixa, durante cinco minutos.
- Meta proposta: p95 do intervalo de render <=33,3 ms nesse ambiente e sem regressão >10% sobre baseline aprovado; metas não substituem a definição de hardware de referência.
- Não regredir o gate do servidor de dez salas 2v2 por quinze minutos com tick p95 <=16,7 ms.
- Fazer captura/vídeo antes e depois; aprovação visual do proprietário é necessária para fechar a direção de arte. Não chamar uma imagem parada de prova de animação.
- Verificar 1v1/2v2, reconexão, revanche e volume; registrar resultados reais em evidence.md de cada spec.

## Situação da 007
A PR #9 foi integrada e o proprietário informou que o jogo funciona. Essa confirmação não contém versões de Firefox/Safari nem registros de staging/backup/restauração. As pendências documentadas da 007 permanecem rastreáveis; não converter a confirmação genérica em testes técnicos executados. Desenvolvimento visual deste ciclo é independente dessas evidências de publicação. Publicação continua sujeita ao gate de release.

