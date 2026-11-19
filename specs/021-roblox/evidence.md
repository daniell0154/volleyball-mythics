# 021 · Evidências

## T1 · Quadra e domínio

Implementado em Place1 pelo MCP, em modo Edit. Fontes reproduzíveis em roblox/src/server e mapeamento Rojo em roblox/default.project.json. A quadra tem piso de 31,5 × 63 studs, escala 3,5 studs/m, rede de 2,43 m e bola de raio 0,11 m. O gerador eleva a quadra acima da baseplate. A inspeção visual inicial detectou sobreposição com o piso padrão e motivou esse deslocamento explícito de origem.

Verificações executadas:

- Build do domínio TypeScript via npm.cmd run build --workspace @volleyball-mythics/domain, concluído com código 0.
- Geração de fixtures via node roblox/scripts/fixtures.mjs, concluída. 24 trajetórias com 180 ticks cada, 20 golpes do perfil 4 em ambos os lados e alturas, duas sequências de contatos e duas de transições de partida, chão e deslocamento diagonal.
- Execução real de Parity.luau no Place1 via MCP. Resultado de 58.436 verificações, 4.320 ticks de bola e erro absoluto máximo 0, com tolerância 1e-9. Cobertos choque varrido na rede e chão, prioridade do chão, três toques consecutivos no 1v1, falta consecutiva no 2v2, quarto toque, bloqueio, rotação e final 6–5.
- Geração de roblox/Place1.rbxlx via node roblox/scripts/bundle.mjs. O arquivo contém os fontes para construir a quadra ao iniciar Play.

O limite de 200.000 caracteres por Source no Studio exigiu fragmentar os dados de teste. O gerador grava fragmentos abaixo desse limite e o runner fica separado dos scripts de produção.

## T2 · Solo, HUD e mapa

Implementado o fluxo selecionar lado/dificuldade/habilidade → contagem → saque → rally → ponto → resultado → jogar novamente ou voltar. O servidor executa passos fixos de 60 Hz e valida associação, fase, sequência, vetores finitos e frequência. Uma sessão contém um humano e três bots com observações atrasadas, responsabilidade por bola e dificuldades fácil, normal e difícil. As habilidades usadas nesta etapa são as existentes Bronca no Parceiro e Foi Sem Querer. A coleção é da T3.

O mapa usa as dimensões e cores de apps/web/src/scene/createScene.ts. Piso verde-azulado, entorno terracota, gramado, malha aberta da rede, prédio de 26 × 8 × 5 m, cobertura, duas fileiras de janelas e porta. A câmera segue o atleta no próprio lado, considera a bola e abre o enquadramento quando necessário. O avatar humano vem da aparência Roblox do usuário e é clonado após a chegada de todos os seus descendentes. Os bots têm identificação e cores de equipe.

As ações usam InputContext/InputAction/InputBinding. A HUD adapta comandos por PreferredInput e usa os glifos nativos Xbox/PlayStation. O quadrado mede 84 px de UI no desktop/console e 72 px na tela compacta. As quatro ações medem 88 × 48 px no desktop e 72 × 48 px no telefone, com espaço de 8 px. Nome e comando da habilidade ficam na borda inferior. O toque mantém dedos independentes para movimento e mira.

Verificações reais executadas no Studio:

- SoloAcceptance concluiu seis partidas, lados A/B em cada dificuldade, com exatamente três bots. Resultados com seed 42 e humano de fixture enviando comandos pelo Runtime: easy A 6–0 em 1530 ticks, easy B 6–0 em 1841, normal A 0–6 em 3209, normal B 6–0 em 2585, hard A 0–6 em 3551 e hard B 6–0 em 2927. São cenários automatizados de jogabilidade, com erros deliberados do humano de fixture.
- O cenário de Foi Sem Querer concedeu um único ponto e recusou uma sequência repetida. Bronca no Parceiro ativou e entrou em recarga nos seis cenários. A paridade da T1 foi reexecutada: 58.436 verificações, 4.320 ticks, erro máximo 0.
- Na partida interativa, J/K/L/U, salto e mira usam os bindings do cliente. Saque via teclado e ativação U mostraram rally e recarga de 20 s. Um ciclo completo terminou em 0–6 e abriu o resultado. Um observador de RenderStepped verificou as seis alterações de placar por bola no chão: zero alterações com a bola visual acima da altura de toque (2 + 0,11 × 3,5 studs, tolerância 0,001).
- No ensaio final de teclado, o observador dos snapshots registrou salto até y = 2,7911 m, deslocamento de x = -2 até o limite -4,175, saque e Bronca confirmados pelo servidor. O PlayerGui manteve LandscapeSensor. J e K foram enviados durante o rally e respeitaram a validação de alcance.
- Capturas inspecionadas em PC, iPhone 17 Pro em paisagem, Xbox e PS5 no simulador. O telefone iniciou com PreferredInput.Touch e analógico visível; menus e HUD couberam na área segura. GetImageForKeyCode resolveu ButtonLB no Xbox e ButtonL1 no PlayStation; a troca de dispositivo em runtime atualizou os ícones. O foco voltou a Start ao regressar ao menu com gamepad.
- Geração de roblox/Place1.rbxlx e git diff --check executados. O arquivo inclui servidor, cliente e configuração compartilhada.

A revisão do proprietário identificou ponto aparecendo cedo e botões grandes. A HUD passou a acompanhar o mesmo tick interpolado da bola. O intervalo de 2 s agora mostra a contagem até o próximo saque. Os snapshots completos excederam o limite do UnreliableRemoteEvent durante o ensaio; foram movidos para RemoteEvent a 20 Hz. O canal descartável transporta apenas movimento/mira. Um codec compacto para snapshots pode ser avaliado nas tarefas de rede.

Limites: validação de controles e telas no Studio, sem ensaio físico de dois polegares ou consoles. A injeção direta de toque foi recusada pelo runtime por exigir capacidade RobloxScript; a navegação touch foi inspecionada em PreferredInput.Touch e os bindings de botão estão conectados. O aceite em aparelhos físicos e desempenho é da T7. O Studio emitiu avisos de um asset de avatar incompatível; após a correção de carga, o modelo completo do usuário apareceu nas capturas. Não houve erros dos scripts na execução final. O simulador foi restaurado ao viewport padrão e o Play foi encerrado. A implementação para nesta T2 por instrução do proprietário.

Limites desta tarefa: comparação de módulos puros em Edit mode. O replay completo do runtime web 020, simulação interativa com quatro atletas, UI, habilidades, bots e desempenho em dispositivos seguem para tarefas posteriores. Ainda não foi executado analisador estático Luau independente. O comando de salvar o Place1 aberto retornou NeedsUserAction porque ele nunca foi salvo. A cópia local reproduzível foi gerada no repositório.

## T2.1 · Lobby e HUD de entrada — 2026-11-19

Implementada a arena circular azul com portal branco de Jogar, estação violeta de Assinaturas, estação dourada de Loja, rede e bolas de vôlei. A referência enviada pelo proprietário substitui o pátio inicialmente proposto. Quatro botões com ícones e contornos hexagonais ocupam a faixa inferior. As 29 paredes fecham o perímetro da arena. A quadra esportiva mantém os limites autoritativos da T2.

- Ambiente usado foi Roblox Studio conectado ao place 135811647282453, em Play local. O place publicado não foi atualizado.
- O percurso pelo clique real Jogar → Solo → iniciar → Voltar foi executado. Na entrada, lobby oculto, ações e placar visíveis. Na saída, avatar do lobby recarregado e navegação restaurada.
- Dois acionamentos seguidos do início produziram uma única partida. Cliente bloqueia o início enquanto aguarda resposta e o servidor recusa a criação de outra sessão ativa.
- Capturas no PC e em telefone iPhone 17 Pro em paisagem mostraram os painéis e a faixa inferior. Em telefone, os três modos usam cartões lado a lado. Algumas operações de mouse do emulador tiveram deslocamento de coordenadas, por isso o ensaio de toque físico continua na T7.
- Os perfis de Xbox e PS5 foram exercitados no simulador. PreferredInput retornou Gamepad e houve foco visível em Voltar. Há navegação direcional nos painéis e na faixa inferior. Controle físico e leitura em TV continuam como aceite da T7.
- Configurações aplicaram volume de 50% para 75%, com som carregado, e animação reduzida ligada. Os valores pertencem à sessão.
- Quatro fixtures de apresentação de Assinaturas cobriram chances 50/50, giro em andamento, revelação e coleção completa. A versão jogável informa disponibilidade futura. Resultado, saldo, equipamento persistente e giro real pertencem à T3.
- A loja mostrou o estado vazio do catálogo. O adaptador usa passes, consulta informações da plataforma, abre a confirmação nativa após escolha e aplica moldura somente após verificação de propriedade no servidor. Não há IDs de passes ou preços de lançamento configurados. Compra, cancelamento real e concessão em produção precisam de um catálogo definido para serem exercitados.
- O console apresentou o aviso de aparência legado do asset 203785492. Os módulos do jogo executados não produziram erro. A movimentação do lobby usa contexto de entrada próprio e o avatar conserva a aparência Roblox.
- O bundle local foi regenerado com os módulos da T2.1. O roteiro da T3 permanece pendente.

Decisão do gate da T2.1 aceita o lobby, os painéis e a integração local com Solo. Loja vazia e coleção indisponível são os estados previstos nesta etapa. Os ensaios financeiros com catálogo real e os aparelhos físicos permanecem explicitamente pendentes.

## T3 · Coleção e roleta — implementação de 2026-11-19

Nove cenários do módulo Collection passaram no Studio com adaptador de armazenamento em memória e 26 execuções de callbacks, incluindo repetição do callback, dois serviços sobre o mesmo perfil, reenvio da operação, revisão antiga, equipamento inválido, prêmio repetido, coleção completa e releitura. A amostra é fixada por operação e o recibo é gravado junto à dedução e ao prêmio. O perfil mantém sequência crescente e 32 recibos recentes, recusando repetições antigas pela sequência. O giro de conclusão usa matchId no perfil como chave idempotente.

O painel Assinaturas usa o serviço Collection para consultar, girar, recuperar resposta e equipar. O início da partida consulta novamente a habilidade no servidor. Fundamentos é a habilidade inicial neutra. Os dois poderes legados são conteúdo de desenvolvimento, habilitado no Studio. O catálogo público precisa dos efeitos finais aprovados antes de receber esses prêmios.

O serviço usa DataStoreService em namespaces distintos de Studio e produção. Um adaptador temporário exige o atributo explícito MythicsTemporaryProfiles no Workspace durante Studio. Falhas de acesso ao armazenamento são exibidas ao usuário e não substituem seu perfil por dados locais.

O aceite de persistência real e a captura do ciclo completo aguardam a confirmação dos acessos solicitada ao proprietário. A T3 permanece pendente desse aceite.

## T4 · Duelo humano — 2026-11-19

O módulo Session mantém slots A0 e B0, vínculo por UserId e geração do controlador. Runtime usa domínio 1v1 e não constrói Bots nesse modo. O aquecimento permite sacar e jogar, sem incrementar o placar. A chegada do segundo humano restaura posições, bola e recargas, iniciando a contagem em 0–0.

O ensaio DuelAcceptance no Studio passou oito cenários com zero bots. Cobriu aquecimento, segundo humano, pausa sem avanço do relógio, retorno com contagem de três segundos, contabilização do tempo de queda, expiração com desistência em 0–0, saída explícita e votação de revanche com novo matchId. O limite de retorno é 20 segundos por queda e 40 acumulados por jogador.

O servidor usa snapshots próprios para cada participante, recusa geração antiga e mantém sessões locais independentes. Os atores preservam a descrição Roblox de cada humano. A interface informa aquecimento e reconexão, respeita vencedor por desistência e oferece votação de revanche. O ensaio com dois clientes de rede e aparelhos físicos integra os aceites posteriores.

### T3 · Aceite adicional com DataStore real

Após a confirmação dos acessos pelo proprietário, CollectionAcceptance foi executado com DataStoreService no namespace MythicsAcceptance_v1 e escopo UUID exclusivo. Os nove cenários passaram com persistent=true. O teste usou handles de serviço distintos sobre a mesma chave e releitura persistente. O callback repetido foi coberto pelo adaptador anterior.

No cliente em Play, o perfil Studio iniciou com Fundamentos e um giro. O clique real em Girar assinatura confirmou “Você ganhou Bronca no Parceiro” e saldo zero. O namespace de produção permaneceu separado. Os testes simultâneos entre instâncias de servidor publicado ainda precisam do ambiente da T6.

## T5 · Duplas online — 2026-11-19

DoublesAcceptance passou nove cenários no Studio com quatro identidades humanas simuladas. O modo começou com um humano e três bots, reservou três entradas durante rally e aplicou os controladores no saque seguinte. A ocupação final foi de dois humanos por lado, sem bots. O ensaio verificou incremento de geração, recarga de slot preservada, troca imediata para bot após queda, retorno ao mesmo slot, expiração, saída explícita e participante que não chegou a jogar antes do sexto ponto.

O servidor habilita o cartão 2v2 online e devolve uma entrada pendente à busca quando a partida termina antes da admissão. A composição de cada trecho é guardada na sessão para o registro de resultado da T6. As validações de vários clientes de rede e de teleporte publicado permanecem nos aceites T6/T7.
