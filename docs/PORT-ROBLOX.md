# Volleyball Mythics no Roblox

Plano de implementação para o Sol • destino inicial: Place1 • plataformas: PC, celulares, tablets, Xbox e PlayStation.

## Experiência da primeira versão

No lobby, o jogador vê seu avatar Roblox, pode girar a roleta, equipa uma habilidade da coleção e escolhe um dos três modos abaixo. Entrar em um modo basta para jogar. A partida termina aos seis pontos e oferece revanche ou retorno ao lobby. As regras específicas do Roblox e seus critérios de aceite estão na [spec 021](../specs/021-roblox/spec.md).

O Place1 foi inspecionado em modo de edição. O Workspace contém câmera, baseplate, terreno e spawn. ReplicatedStorage, ServerScriptService e StarterGui estão vazios. O desenho abaixo parte desse estado. Os arquivos propostos em `roblox/` serão criados durante a implementação.

| Modalidade | Formação | Comportamento |
| --- | --- | --- |
| Solo 2v2 contra bots | Humano e bot contra dois bots | Sessão individual desde o primeiro saque. Fácil, normal ou difícil. |
| 1v1 online | Dois humanos, um de cada lado | O primeiro entra direto na quadra para aquecer com a bola. O duelo começa em 0–0 quando o adversário chega. Não há bot no 1v1, inclusive em caso de queda. |
| 2v2 online | Dois atletas de cada lado | O primeiro humano inicia com três bots provisórios. Novos humanos ocupam as vagas entre pontos, priorizando o lado com menos humanos. |

## HUD de partida

O **canto inferior direito** mantém quatro ações visíveis durante toda a partida. No toque, são os próprios botões jogáveis. No teclado e no gamepad, cada posição mostra a ação e o comando ativo. O **centro inferior** pertence à habilidade do atleta. Usar um único quadrado clicável/tocável, com ícone no corpo e uma faixa sobre a borda inferior que contém **nome e botão juntos**. A referência abaixo mostra um avatar com Bronca no Parceiro equipada no Xbox durante um rally, com os nomes em suas posições de jogo.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ A  2 × 3  B                         Rally                           │
│                                                                     │
│                       rede · bola · atletas                         │
│                                                                     │
│                            ┌───────────┐                            │
│                            │           │    [LT] Receber  [RB] Levantar│
│ (movimento no toque)       │   ícone   │    [A] Pular     [RT] Atacar │
│                            │ Bronca no │                            │
│                            └Parceiro LB┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

* **Ancoragem.** Em um ScreenGui que respeite a área segura, ancorar a habilidade em (0,5; 1) e a grade 2 × 2 em (1; 1), com margem interna. Impor proporção 1:1 via UIAspectRatioConstraint. Começar com quadrado de 88 px de UI no telefone e 112 px na TV. Permitir duas linhas para o nome e reservar largura para o glifo. Usar o nome publicado da habilidade equipada, por exemplo **Foi Sem Querer**. Validar o maior nome do catálogo.
* **Espaço dos polegares.** Celular em paisagem, analógico no canto inferior esquerdo, área livre à direita para mirar e grade dentro do alcance do polegar. Alvo inicial de pelo menos 48 × 48 px de UI por ação, com separação. Medir a largura útil após os recortes do aparelho. Quando faltar espaço, encurtar os rótulos e subir a grade até liberar o quadrado central. Integrar o salto à grade e suprimir o botão de pulo padrão durante a partida.
* **Estados.** A habilidade mostra pronta, solicitação pendente, efeito ativo quando aplicável, recarga em segundos e indisponível com motivo. Preservar a faixa com nome e comando em todos os estados. Usar texto e contraste além de cor. O relógio deriva do tick confirmado e congela na suspensão. O servidor confirma o efeito, a animação de contato e o ponto. Na grade, o espaço de ataque vira “Sacar” na fase de saque e indica quando é a vez de outro atleta.
* **Leitura da quadra.** Placar e indicação de saque em cima. Câmera atrás do time local, com bola, rede e área de recepção visíveis dos dois lados. Ajustar distância e enquadramento ao aspecto da tela. Manter a região de contato livre da HUD inclusive durante salto e saque no fundo. Usar marcas de equipe e indicador do atleta local distinguíveis em TV.

### Mapa de comandos proposto

| Ação lógica | PC | Mobile em paisagem | Xbox | PlayStation |
| --- | --- | --- | --- | --- |
| Mover | WASD | Analógico esquerdo virtual | Analógico esquerdo | Analógico esquerdo |
| Mirar | Setas ou apontar na quadra, C limpa a mira do cursor | Arrastar na área livre para fixar direção, tocar no indicador para centralizar | Analógico direito | Analógico direito |
| Pular | Espaço | Pular | A | ✕ |
| Receber / bloquear | J | Receber | LT | L2 |
| Levantar | K | Levantar | RB | R1 |
| Sacar / atacar | L | Sacar / Atacar | RT | R2 |
| Ativar habilidade | U ou clicar no quadrado | Tocar no quadrado, faixa “Toque” | LB | L1 |
| Confirmar / voltar nos menus | Enter / botão Voltar | Tocar no item / Voltar | A / B | ✕ / ○ |

Definir ações semânticas no Input Action System e separar contextos de partida e menu. O mesmo binding alimenta o comando e a legenda. Para controles, resolver o ícone do dispositivo com GetImageForKeyCode e usar texto quando faltar imagem. Reagir a PreferredInput em tempo real, inclusive em tablet com gamepad ou PC com controle. Restaurar estado neutro ao perder foco ou desconectar o dispositivo. Nos gatilhos, disparar uma vez ao cruzar o limiar de pressão e rearmar ao soltar. Durante a partida, consumir os comandos nativos que disputariam salto, câmera ou movimento. Nos menus, definir foco inicial, vizinhos direcionais e retorno ao item anterior. Oferecer teclado de tela para o código de sala.

Normalizar a mira num disco de raio 1 e aplicar zona morta no analógico. O centro representa a trajetória neutra do perfil de rally 4. Converter a direção vista pelo jogador para a orientação do lado A ou B uma única vez. No toque, rastrear cada dedo separadamente para permitir mover, mirar, soltar a mira e golpear sem perder a direção escolhida. Pressionar um botão da HUD jamais inicia arraste da quadra. [Entradas multiplataforma](https://create.roblox.com/docs/projects/cross-platform) · [Controles de console](https://create.roblox.com/docs/production/publishing/console-guidelines) · [Entrada por toque](https://create.roblox.com/docs/input/mobile)

## Organização em Roblox

Manter código Luau tipado e o mapeamento Rojo em `roblox/`. Recomendação inicial: uma experiência, um place (Place1), lobby público e uma instância reservada sob demanda para cada partida. O modo é configuração imutável da partida. Os três modos reutilizam a mesma quadra, câmera, HUD e simulação. Isso permite atualizar uma regra uma vez e isola o relógio, a lotação e o encerramento de cada partida. O custo dessa escolha é um teleporte por entrada e uma instância para cada sessão solo. Agrupar quadras solo numa instância pode reduzir essa carga, mas exigiria isolar física, replicação e falhas. Medir latência de entrada, falhas de teleporte, partidas simultâneas e ocupação antes de introduzir essa complexidade. Só dividir em places por modo se conteúdo carregado, capacidade ou ciclo de publicação passarem a divergir. [Servidores reservados sob demanda](https://create.roblox.com/docs/projects/teleport-private-servers)

No Studio, um adaptador local executa a mesma partida com um diretório em memória. No ambiente publicado, TeleportService transporta jogadores e MemoryStoreService mantém o diretório temporário de partidas e vagas. Cada destino anuncia modo, compatibilidade de matchmaking, instância, vagas, fase e validade. Xbox e PlayStation com cross-play desativado podem cair em instâncias distintas com o mesmo PrivateServerId. Particionar o diretório por MatchmakingType, distinguir instâncias por JobId, confirmar a chegada no destino e nunca usar apenas o ID da reserva como identidade da partida. [TeleportService](https://create.roblox.com/docs/reference/engine/classes/TeleportService)

| Destino no Studio | Responsabilidade | Referência para o porte |
| --- | --- | --- |
| ServerScriptService/Domain | Funções puras de bola, atletas, contatos, placar, rotação e habilidades. Coordenadas em metros e tempo em ticks. | `packages/domain/src/{simulation,rules,match,config,abilities}` |
| ServerScriptService/Match | Único dono do estado, relógio, comandos, bots, suspensão, resultado e revanche. | `apps/server/src/runtime/matches.ts`, `runtime/bots`, `reconnect` |
| ServerScriptService/Lobby e Persistence | Criação/entrada, slots, inventário, roleta, roteamento e gravação de resultados. | [Contrato de produto Roblox](../specs/021-roblox/spec.md) |
| ReplicatedStorage/Shared e Remotes | Tipos, versão do protocolo, projeção pública do catálogo, ações e envelopes. | `packages/protocol/src/index.ts` |
| StarterPlayerScripts e StarterGui | Amostragem de entrada, câmera, buffer de snapshots, animação, HUD, lobby e resultado. | `apps/web/src/input/keyboard.ts`, `apps/web/src/game/OnlineMatch.tsx` |
| ServerStorage e Workspace | Moldes de quadra, bola e rigs de bots. Aplicar aparência Roblox do usuário ao seu atleta. Uma quadra por partida, modelos e conexões liberados ao sair. | `docs/art/009-animation-contract.md`, `docs/roster/INITIAL.md` |

**Simulação.** Portar o integrador e o perfil de rally 4 usando a referência TypeScript como oráculo. Quadra de 9 × 18 m, rede de 2,43 m, raio da bola de 0,11 m e gravidade de 9,81 m/s². Começar com 3,5 studs por metro e converter apenas na apresentação. A bola visual é ancorada e interpolada no cliente. A posição do rig acompanha o atleta simulado. Alcance e colisões vêm do domínio, inclusive quando dois jogadores chegam à mesma bola. O tamanho do avatar Roblox e o FPS de quem toca a bola não entram no cálculo.

**Relógio e regras.** Acumular tempo de Heartbeat em passos de 1/60 s e emitir snapshots a 20 Hz. Limitar o trabalho por frame, medir ticks atrasados e conservar o restante acumulado. Portar a contagem de 3 s, saque no fundo em até 8 s, pausa de ponto de 2 s, alternância do sacador ao recuperar o saque, bloqueio sem consumir toque, quarto toque e, no 2v2, toque consecutivo ilegal. No 1v1 permitir até três toques consecutivos e manter o único sacador de cada lado. Resolver na ordem estável de equipe e slot. No mesmo tick, processar salto, habilidade, depois saque ou um contato de rally na prioridade ataque, levantamento, recepção/bloqueio. Identificar cada ponto para aplicá-lo uma única vez.

**Rede.** Cliente envia intenções com versão, matchId, sequência, movimento, mira e bordas de ação. Usar RemoteEvent confiável para comandos discretos, lobby, confirmação e transições. Usar UnreliableRemoteEvent para movimento/mira contínuos e snapshots descartáveis. Manter sequências independentes por canal e incluir a mira amostrada no próprio golpe. O servidor deriva a identidade do Player e confere associação à sala, fase, ordem, vetores finitos, alcance e recarga. Preservar o limite agregado de 60 entradas/s, envio do cliente até 50/s, validade de ação de seis ticks após recepção e expiração de movimento em 15 ticks. Reenviar movimento mantido dentro desse prazo. Bots entram no mesmo resolvedor com a seed e o atraso de observação da dificuldade.

**Apresentação em rede.** Incluir tick, rallyId, bola, os dois ou quatro atletas, placar, sacador, efeitos e fim da recarga no estado replicado. O cliente descarta snapshots antigos e interpola entre ticks. Ao entrar ou retomar, solicitar estado completo confiável e reiniciar o buffer. Usar IDs de eventos para tocar animação e áudio uma vez. Começar com snapshots completos compactos e medir o tamanho serializado antes de habilitar o canal descartável. Prever uma mensagem confiável de estado completo separada dos pacotes frequentes.

**Habilidades e dados.** O catálogo Roblox define habilidade, nome, efeito por revisão, compatibilidade por modo e peso do sorteio. O perfil por UserId guarda coleção, habilidade equipada, saldo de giros e recibos. A roleta concede uma habilidade permanente. O avatar conserva a aparência do usuário e os atributos esportivos base são comuns. Um modificador temporário da habilidade pode afetar uma jogada. Ao admitir um humano, fixar a revisão equipada para aquela participação. A spec define a transação, o primeiro acesso e a troca de controlador. Habilidades legadas que penalizam a própria equipe precisam de revisão de design antes de entrar no conjunto de prêmios.

**Salas, retorno e resultados.** No lobby publicado, usar MemoryStoreService para mapear código público e UserId à reserva com expiração. Admitir cada jogador por lista de membros mantida no servidor, reservar slots atomicamente e liberar reservas se o transporte falhar. O servidor usa TeleportService para enviar o grupo e encaminhar o jogador que retorna à mesma quadra. Aplicar a política de reposição e reconexão da spec 021. Uma revanche cria novo matchId. Gravar resultado imutável por matchId com UpdateAsync, repetir em caso de falha transitória e indexar por UserId idempotentemente. Ler o registro canônico para reparar índices parciais. Em queda definitiva da instância, expirar a rota e devolver ao lobby com motivo, sem inventar vencedor.

## Ordem de entrega e aceite

| Etapa | Entrega jogável ou verificável | Evidência para avançar |
| --- | --- | --- |
| 1. Domínio e quadra | Place1 sincronizado, escala, perfil 4 e replay de uma sequência fixa sem interface | Comparar com as fixtures de `packages/domain/tests` e o replay `docs/benchmarks/020-match-replay.mjs`. Mesmos contatos, fases, sacador e placar por tick. Registrar tolerância numérica para posição da bola. |
| 2. Primeira partida solo | Equipar habilidade, sacar, disputar um rally, usar habilidade e chegar ao resultado contra bots. Incluir a HUD definitiva e os três adaptadores de entrada já nesta etapa. | Jogar dos dois lados em fixtures. Conferir efeito único, validação de alvo, recarga e rejeição fora de fase. Conferir mira, salto + ataque e troca de dispositivo em rally. |
| 3. Multiplayer e ciclo completo | 1v1 e 2v2 online, preenchimento por bots, entrada tardia, abandono, retorno, revanche e histórico | Quatro clientes reais ou simulados. Interromper a conexão durante saque e rally. Confirmar mesmo placar, slot e cooldown no retorno. Repetir a gravação de resultado e verificar um registro. Exercitar teleporte e reentrada em experiência de teste publicada. |
| 4. Dispositivos e desempenho | Controles finais, navegação por foco, câmera, efeitos e qualidade gráfica adaptada | Capturas das quatro plataformas em saque, rally e recarga. Medir frame time com quatro atletas e efeitos durante 5 min. Metas iniciais propostas de p95 ≤ 33,3 ms no celular de referência e ≤ 16,7 ms no PC e consoles de referência. Registrar modelo, resolução e qualidade. |

Para aceitar a quarta etapa, concluir lobby → partida → resultado → revanche no PC com teclado, em telefone com dois polegares, no Xbox e no PlayStation com controle. Incluir tablet, telefone estreito com recorte, TV vista do sofá e troca de teclado para gamepad no PC. Conferir em captura que a habilidade está centrada na área útil, o quadrado mantém 1:1, nome e comando cabem juntos na borda e a grade permanece inteira e acionável no canto direito. Comparar as legendas LB e L1 nos respectivos aparelhos. Simular atraso e perda de snapshots e verificar que uma pressão produz no máximo uma ação e todos veem o mesmo ponto. Registrar separadamente o que foi medido no emulador e em aparelho físico.

**Primeiro trabalho do Sol.** Entregar as etapas 1 e 2 em sequência, salvando o place de desenvolvimento e os fontes reproduzíveis no repositório. Usar a primeira partida solo para ajustar escala visual, alcance dos polegares e tamanho da HUD com capturas. A entrega de referência segue o [backlog da spec 021](../specs/021-roblox/tasks.md). A expansão para quatro jogadores depende da paridade de regras e do fluxo de entrada demonstrados nessa partida.
