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
