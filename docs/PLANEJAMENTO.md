# Volleyball Mythics — planejamento de escopo

> Documento inicial preservado como contexto. O escopo refinado em [REFINAMENTO.md](REFINAMENTO.md) substitui decisões conflitantes deste documento (backend, pausa, regras e decisões pendentes). A execução deve seguir [specs/README.md](../specs/README.md), seus contratos e a spec ativa correspondente. Este documento não deve ser usado isoladamente para implementação.

**Status:** planejamento inicial; implementação ainda não iniciada.  
**Data:** 2026-11-16  
**SDD recomendado:** GitHub Spec Kit.

## 1. Visão e objetivos

Jogo arcade de vôlei 3D, lançado primeiro como experiência web e preparado para avaliação futura em Android, iOS e PC. O elenco será composto por personagens pré-definidos pelo responsável pelo projeto, inspirados em seus amigos, cada qual com overall, atributos e habilidade especial única. O MVP inclui multiplayer online 1v1 e 2v2.

- Entregar partidas curtas e legíveis, com regras e pontuação claras.
- Dar identidade aos personagens por atributos e habilidades distintas.
- Manter domínio e regras separados da interface, renderer e transporte de rede.
- Validar cedo performance 3D e sincronização multiplayer na web.

### Fora do MVP

- Apps instaláveis Android/iOS/PC; essas plataformas são fases futuras.
- Progressão, moedas, loja, monetização, ranking, temporadas, campanha e chat.
- Editor de personagens, criação de avatares e conteúdo gerado por usuários.
- Matchmaking público. O MVP começa com salas privadas por código/link de convite.

## 2. Público e fluxo principal

Pessoas que querem jogar partidas casuais online com amigos. Fluxo: menu → criar/entrar em sala privada → escolher modo e personagem → confirmar prontidão → jogar → resultado → revanche/menu.

## 3. Escopo funcional do MVP web

### Partidas e regras

- **1v1:** dois participantes, um personagem por lado.
- **2v2:** quatro participantes humanos online, um por personagem.
- Quadra de vôlei ao ar livre no pátio de uma escola, incluindo rede, linhas, bola e elementos visuais de contexto escolar a definir na direção de arte.
- Saque, rally, recepção, levantamento, ataque, bloqueio, faltas, troca de saque e marcação de ponto.
- A partida tem um único set e termina imediatamente quando um dos lados marca 6 pontos. Sem vantagem de dois pontos neste escopo.
- HUD de placar, lado do saque e disponibilidade da habilidade; pausa, abandono, reinício e tela de resultado.
- Câmera mantém bola e quadra visíveis. Feedback visual/sonoro para ações, habilidade e ponto.
- Salas privadas com código curto ou link de convite, seleção de modo/personagem, pronto/não pronto e início quando todos estiverem conectados.
- Tratamento explícito de desconexão e abandono; janela de reconexão a definir antes da implementação.

As regras completas de toques, faltas e serviço ainda precisam ser decididas. Não declarar conformidade oficial enquanto não houver decisão de regra e validação.

### Controles e experiência

- Teclado no lançamento web. Ações mínimas: mover, saltar, defender/receber, passar/levantar, atacar, sacar e ativar habilidade.
- Layout responsivo, com desktop como alvo prioritário. Controles por toque e gamepad ficam para fases futuras.
- Opções mínimas de volume e qualidade gráfica se os resultados do spike técnico indicarem necessidade.

### Personagens

- Elenco, nomes/apelidos, descrição, visual, atributos e habilidades serão definidos pelo responsável pelo projeto. Não haverá ferramenta de edição por jogadores no MVP.
- Durante protótipos, podem ser usados modelos temporários até o conteúdo ser fornecido. Uso de likeness, nome, voz ou assets identificáveis depende de autorização apropriada.
- Atributos candidatos em escala 1–100: saque, recepção, levantamento, ataque, bloqueio, velocidade e salto. Balanceamento pendente.
- Overall é um resumo derivado por fórmula documentada, sem substituir os atributos individuais.
- Para cada habilidade especial, especificar gatilho, efeito, duração, cooldown, feedback e contrajogo; evitar habilidades que decidam rally sem resposta possível.
- Conteúdo de personagens deve ser dado configurável e separado da lógica do jogo.

## 4. Requisitos não funcionais

- Estado de jogo validado pelo servidor: clientes enviam comandos/inputs; cliente não decide placar nem resultado final.
- Simulação com relógio independente de taxa de quadros e comportamento reproduzível sempre que possível.
- Alvo preliminar de 60 fps em desktop de referência e 30 fps em dispositivos modestos; hardware mínimo será definido no discovery.
- Carregar assets sob demanda e controlar tempo/tamanho do carregamento inicial.
- Definir navegadores suportados; apresentar fallback claro quando a API gráfica necessária estiver indisponível.
- Acessibilidade por etapas: contraste, escala de texto, feedback que não dependa apenas de cor e opção de reduzir efeitos/câmera.
- Minimizar dados pessoais. Definir retenção e finalidade antes de salvar histórico ou telemetria.

## 5. Direção de arquitetura (provisória)

1. **Domínio/regras:** estado, pontuação, fases do rally, atributos, habilidades e eventos; sem dependência de React ou renderer.
2. **Simulação:** física/colisões e atualização temporal da bola e atletas, executadas ou validadas no servidor para partidas online.
3. **Apresentação:** UI React Native/React Native Web para menus e HUD; cena 3D atrás de uma interface de adaptador.
4. **Rede e serviços:** salas, identidade/autorização, transporte em tempo real, reconexão e persistência de resultados.
5. **Plataformas:** teclado primeiro; entrada por toque/gamepad, ciclo de vida e empacotamento serão avaliados em ports futuros.

React Native Web não garante, por si só, portabilidade ou performance da cena 3D em web, Android, iOS e PC. Escolher renderer/engine depois de um spike medido nos alvos. Não enviar cada atualização de frame à base de dados: sincronização de jogo pertence ao serviço de partida em tempo real; a base persiste dados duráveis e resultados.

## 6. Fases e entregáveis

| Fase | Resultado | Critério para avançar |
|---|---|---|
| 0. Descoberta | Regras, salas privadas, contas/guest, reconexão, direção visual, PC alvo e hardware mínimo decididos ou registrados como hipóteses | Dúvidas de arquitetura e aceitação explícitas |
| 1. Fundação de dados/backend | Esquema, migrações, acesso/autorização, ambiente de backend e contrato de rede definidos; prova de conceito de sala e conexão | Dois clientes conectam, entram na mesma sala e recebem estado autorizado |
| 2. Spike técnico 3D web | Pátio escolar, quadra, atleta placeholder, bola, câmera, entrada e performance | Render estável nos navegadores definidos e renderer escolhido com evidência |
| 3. Protótipo de rally online | Movimento, saque, recepção, ataque, colisão, ponto e reinício com autoridade do servidor | Rally sincronizado entre clientes de teste |
| 4. Vertical slice 1v1 | Sala privada, seleção de personagem, partida até 6 pontos, HUD, resultado e abandono/reconexão | Duas pessoas concluem partida online |
| 5. 2v2 e habilidades | Quatro participantes, posicionamento, habilidades e balanceamento inicial | Partidas 1v1 e 2v2 funcionam em sessões representativas |
| 6. Beta web | UX, performance, acessibilidade básica, conteúdo final autorizado e publicação | Critérios de lançamento e navegadores testados aprovados |
| Futuro. Ports | Adaptação de renderer/controles/ciclo de vida e desempenho em Android, iOS e PC | Plano e orçamento aprovados por plataforma |

## 7. Banco de dados e backend: recomendação

**Banco recomendado: PostgreSQL gerenciado; escolha inicial a avaliar é Supabase (Postgres).** As entidades têm relações claras — usuários, personagens, salas, participantes e partidas — e os personagens são conteúdo curado. Supabase oferece PostgreSQL completo como base para Auth, Storage e Realtime ([documentação oficial de Database](https://supabase.com/docs/guides/database/overview)).

Para o jogo online, o banco não será o motor de sincronização. Salas e presença podem usar WebSocket/Broadcast, mas as regras e o placar devem ser validados por um serviço autoritativo de partida. Supabase Realtime oferece Broadcast de baixa latência ([documentação oficial](https://supabase.com/docs/guides/realtime/broadcast)); isso não substitui uma simulação de jogo autoritativa. Nakama documenta partidas autoritativas em que a lógica e as regras da partida são executadas no servidor ([documentação oficial](https://heroiclabs.com/docs/gameplay-multiplayer-server-multiplayer/)).

**Decisão provisória de stack:** Supabase + PostgreSQL para dados persistentes/Auth, junto a serviço de jogo autoritativo independente. Na primeira etapa futura, comparar esse arranjo com Nakama + PostgreSQL — opção que pode reunir funcionalidades de multiplayer e persistência — por latência, custo operacional, compatibilidade com clientes e complexidade. Congelar a escolha após uma prova de conceito; evitar usar Postgres Changes ou gravações por frame como canal da simulação.

### Próxima parte da implementação futura: fundação do banco

1. Fechar requisitos de contas/guest, privacidade das salas, histórico e retenção.
2. Desenhar esquema versionado e migrações para `users/profiles`, `characters`, `matches`, `match_players` e resultados resumidos.
3. Inserir o elenco pré-definido por seed ou fluxo administrativo; cliente não pode editar personagens nem atribuir resultados.
4. Definir políticas de acesso, segredos apenas no servidor e ambientes separados de desenvolvimento/produção.
5. Provar conexão, autorização, criação/entrada de sala e gravação de resultado; comparar Supabase com Nakama antes de construir o restante do multiplayer.

## 8. Riscos

- **Renderer 3D multiplataforma:** validar com spike em navegador antes de produzir conteúdo extensivo.
- **Latência/trapaça:** validar comandos e pontuação no servidor; testar região e latência com usuários reais.
- **2v2 aumenta complexidade:** fechar fluxo para quatro pessoas e testar presença, desconexão e início de partida cedo.
- **Física arcade:** começar ajustável e priorizar controle e legibilidade sobre realismo prematuro.
- **Equilíbrio das habilidades:** parâmetros configuráveis, cooldown e contrajogo; avaliar partidas antes de congelar valores.
- **Representação de amigos:** obter conteúdo e autorização antes de publicar personagens identificáveis.
- **Escopo de rede:** manter salas privadas no MVP; adiar matchmaking, ranking e chat.

## 9. Decisões pendentes

1. Salas por código curto, link de convite ou ambos?
2. Conta obrigatória ou acesso guest no primeiro lançamento?
3. Quais regras de toque, faltas e saque compõem o arcade?
4. Como tratar abandono, reconexão e partida interrompida?
5. PC significa navegador desktop, app instalável, ou ambos?
6. Qual direção visual/câmera e qual nível de realismo dos personagens?
7. Qual dispositivo/navegador define o limite inferior de desempenho?
8. Haverá histórico de partidas, analytics ou publicação pública no lançamento?

## 10. SDD recomendado

**GitHub Spec Kit**: constituição/princípios → especificação de feature → esclarecimentos → plano técnico → tarefas → análise de consistência → implementação/convergência. Esse fluxo mantém comportamento esperado, decisões técnicas e tarefas rastreáveis separados por feature. A documentação oficial apresenta o [quickstart](https://github.github.com/spec-kit/quickstart.html) e o [fluxo SDD](https://github.github.io/spec-kit/reference/agentic-sdd.html).

OpenSpec é alternativa para equipes que preferem propostas incrementais e especificações vivas. Para este projeto iniciado do zero, com decisões de produto, arquitetura online, persistência e ports futuros, Spec Kit fornece uma estrutura inicial mais explícita. A seleção é de processo; instalação fica para o início da implementação.

### Organização de especificações sugerida

- Constituição: domínio desacoplado, autoridade de servidor, segurança, performance mensurável, privacidade e escopo controlado.
- Especificação-base: modos, regras de seis pontos, cenário escolar, personagens, controles e critérios de aceitação.
- Features: fundação de dados/backend; spike 3D web; rally; salas e rede; vertical slice 1v1; modo 2v2/habilidades; beta; ports.
- Toda feature registra cenários observáveis, critérios de aceite, dependências, riscos e tarefas. Hipóteses não viram requisito sem decisão explícita.

## 11. Critério de sucesso do primeiro lançamento

Quatro pessoas conseguem abrir o site, entrar numa sala privada, escolher modo e personagens e completar uma partida 1v1 ou 2v2 até seis pontos, entendendo por que cada ponto foi marcado. A experiência mantém o desempenho acordado e oferece revanche rápida. O conteúdo identificável foi autorizado, e as decisões para Android, iOS e PC estão registradas sem prometer esses ports no lançamento web.
