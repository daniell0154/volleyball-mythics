# 021 · Volleyball Mythics no Roblox

Esta spec define o produto Roblox. Os contratos 013, 015 e 019 descrevem a versão web. A arquitetura, o mapa de comandos e o desenho da HUD estão no [plano do porte](../../docs/PORT-ROBLOX.md).

## Entrada e andamento

| Escolha no lobby | Com um humano presente | Quando alguém entra | Quando alguém sai |
| --- | --- | --- | --- |
| Solo 2v2 contra bots | Jogador e parceiro bot contra dois bots. Inicia a contagem imediatamente. | Sessão individual, fora do diretório de vagas públicas. | Encerra ao sair o humano. |
| 1v1 online | Acesso imediato à quadra e aquecimento livre com bola. Exibir “Aguardando adversário”. | O segundo humano encerra o aquecimento. Restaurar bola, posições e recargas, zerar placar e iniciar contagem de 3 s. | Durante o duelo, pausar e reservar a vaga ao mesmo UserId por até 20 s por queda e 40 s acumulados por lado. Retorno válido restaura o estado com contagem de 3 s. Abandono explícito ou expiração com adversário presente encerra por desistência. Sem humanos, encerrar. |
| 2v2 online | Começa valendo com um humano e três bots provisórios. Mostrar quais vagas são bots. | Admitir humanos até quatro. Priorizar o time com menos humanos e o adversário em caso de empate inicial. Trocar controlador antes do próximo saque. | Neutralizar comandos do ausente e passar seu slot a um bot. Reservar ao humano por 20 s em queda involuntária. Na saída explícita ou após expirar, abrir a vaga. Encerrar ao sair o último humano. |

**Invariante do duelo.** Existem apenas os slots A0 e B0. Ambos aceitam exclusivamente humanos. Aquecimento, desconexão, revanche e falta de adversário jamais criam bots ou concedem pontos de treino. Até três toques consecutivos do único atleta são legais. Uma habilidade que exige companheiro fica sinalizada na coleção como exclusiva de duplas. Antes do duelo, aplicar a habilidade inicial compatível se a equipada exigir dupla e informar a escolha.

**Entrada durante o 2v2.** Reservar uma vaga por usuário e admitir sob confirmação da instância. Se houver rally, mostrar placar e “Você entra no próximo saque”. Publicar o novo dono do slot e liberar comandos em uma única transição. Preservar placar, ordem do saque e recarga restante do slot. Remover modificadores pessoais expirados ou incompatíveis ao mudar de ocupante. Rejeitar comandos do controlador anterior. Se o sexto ponto vier antes da entrada, devolver o jogador à busca, sem registrar participação. Um resultado registra humanos que chegaram a jogar e a composição por trecho. Revanche gera novo matchId.

## Lobby e HUD de entrada

O avatar chega a uma arena circular azul, com estações iluminadas de Jogar, Assinaturas e Loja ao redor do centro. O portal branco leva à seleção de modos, a estação violeta usa uma bola de vôlei e a estação dourada apresenta um cartão de jogador. Rede, marcações de ataque e bolas completam a identidade esportiva. O HUD apresenta quatro ícones com contorno hexagonal na faixa inferior, conforme a referência visual fornecida pelo proprietário em 2026-11-19. Aproximar-se de uma estação permite abrir o mesmo painel pelo comando de interação. A arena tem paredes em todo o perímetro. O servidor limita a movimentação esportiva à quadra durante as partidas. A quadra das partidas conserva o cenário do navegador definido na T2.

| Acesso no HUD | Experiência |
| --- | --- |
| **Jogar** | Botão principal, com foco inicial no controle. Abre três cartões com composição e regra de entrada da tabela de modos. Selecionar Solo permite escolher lado e dificuldade antes de entrar. Nos modos online disponíveis, selecionar envia o pedido ao servidor e mostra o andamento até a chegada. Uma falha permite tentar novamente ou voltar. |
| **Assinaturas** | “Assinatura” é a jogada característica de um personagem. O painel reúne a equipada, a coleção e o botão **Girar assinatura**, com saldo e chances visíveis antes do giro. Cada prêmio concede uma habilidade. O jogador conserva seu avatar e leva uma habilidade ativa à quadra. O combate esportivo não inclui ultimates. |
| **Configurações** | Ajustar o volume dos efeitos do lobby e reduzir as animações de interface. Aplicar na prévia imediatamente, inclusive ao reabrir o painel na mesma sessão. A redução de animação preserva a leitura do resultado do giro. |
| **Loja** | Vitrine em Robux com nome, prévia, benefício e preço do item selecionado. Proposta inicial: cosméticos de apresentação, como uma moldura para o cartão do jogador. Os giros continuam gratuitos. Exibir estado vazio enquanto não houver ofertas configuradas. |

Ao entrar na quadra, recolher o HUD do lobby e apresentar a HUD compacta da T2. Voltar ao lobby restaura a navegação em Jogar.

## Roleta, coleção e aparência

No lobby, o jogador abre **Assinaturas**, vê os possíveis resultados e suas chances, gira, revela a habilidade ganha e escolhe se quer equipá-la. A coleção é permanente e uma habilidade fica ativa por vez. Mostrar nome, efeito, recarga e modos compatíveis antes de equipar. Camisa de time ou marcador identifica o lado em quadra. A roleta jamais troca rosto, cabelo, corpo, roupa ou avatar e jamais concede atributos permanentes de personagem.

**Defaults propostos para o protótipo.** Conceder uma habilidade inicial compatível com todos os modos e um giro gratuito no primeiro acesso. Cada partida concluída por pontos concede um giro a cada humano que participou até o fim. Aquecimento, cancelamento e desistência não geram giros. Sortear uniformemente entre habilidades habilitadas ainda não adquiridas. Com a coleção completa, mostrar “Você já tem todas” e preservar o saldo. Usar apenas giros gratuitos nesta versão. Conteúdo inicial para a implementação: uma habilidade base e pelo menos duas sorteáveis com efeitos e recargas definidos no catálogo de desenvolvimento. Validar o equilíbrio antes de habilitar o catálogo público.

**Transação.** O servidor recebe um ID de operação, lê a revisão do catálogo e calcula candidatos e probabilidades com base no perfil atual. Saldo, dedução de um giro, habilidade ganha e recibo são uma única atualização do perfil via DataStoreService:UpdateAsync. Fixar a amostra aleatória por operação para que reexecuções do callback sejam coerentes. Usar sequência monotônica por perfil e revisão de coleção para recusar comandos antigos ou telas desatualizadas. Em resposta perdida, consultar o recibo e atualizar a coleção. Confirmar a animação de prêmio só após a gravação. Conceder o giro de conclusão uma vez por par (matchId, UserId), inclusive ao retentar uma gravação. Equipar apenas habilidades possuídas e habilitadas. Fixar a escolha ao assumir o slot até o fim da partida.

**Aceite da experiência.** Em teclado, toque e controle, completar giro → equipar → entrar em quadra. Verificar inventário e aparência antes e depois de reconectar. O quadrado da habilidade fica no centro inferior; nome e comando ficam juntos na borda em todos os estados. A grade de ações permanece no canto inferior direito. Se um dia houver giros compráveis direta ou indiretamente com Robux, a mudança requer regras por jogador e divulgação das probabilidades reais segundo a [política Roblox para itens aleatórios pagos](https://create.roblox.com/docs/production/monetization/paid-random-items).
