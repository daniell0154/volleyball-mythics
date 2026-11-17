# Entrada com elenco e HUD contextual
Status: T1–T3 implementadas e verificadas. Trabalho interrompido por pedido do proprietário após T3; T4 ainda não iniciada.
Requisito R11: entrada com elenco e hud contextual para a versão de tese.

## Escopo e referência
Seguir [documento de melhorias](../../docs/MELHORIAS.md). Samuel e Caio são iniciais; permitir expansão do catálogo. Preservar autoridade do servidor, 1v1/2v2 e primeiro a seis.

## Dependências
008, 009 e 010 integradas.

## Aceitação
- **Entrada e catálogo:** Organizar apelido/criar/entrar e atleta em destaque com modelo, sete atributos, overall e habilidade. Catálogo é fonte dinâmica, não lista fixa de dois. Cobrir loading, vazio e falha; priorizar preview por seleção e carregar renderer sob demanda.
- **Lobby e orientação:** Exibir modo, slots, convite, personagem e prontidão; erros junto à ação. Manter fluxo guest existente, dono autorizado para iniciar e suporte a personagens repetidos.
- **HUD de partida:** Placar/fase central, sacador, jogador local e recarga legíveis; instruções mudam conforme fase. Marcador local com forma/texto. HUD não bloqueia bola/rede; volume e qualidade acessíveis, reduzir movimento sem mudar física.
- **Aceite do percurso:** Completar criar/entrar, selecionar, pronto, jogar, resultado e revanche com teclado. Cobrir catálogo com pelo menos cinco fixtures só em teste, nomes longos, WebGL indisponível e zoom 200%. Registrar versões Chrome/Edge/Firefox/Safari e pendências reais, além de contraste mínimo 4,5:1 para texto normal.

Gate: todos os aceites de tasks.md com evidências reais; critérios visuais exigem aprovação do proprietário. Conteúdo novo, bots e publicação ficam fora desta spec.

