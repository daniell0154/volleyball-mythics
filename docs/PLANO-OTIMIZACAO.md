# Plano de otimização do jogo 2v2

Os comandos de reprodução e os resultados da implementação estão no [registro dos ensaios](benchmarks/020-optimization.md).

O objetivo é reduzir o trabalho por quadro no navegador e por sala no servidor, mantendo a experiência atual. A primeira entrega é uma referência reproduzível. As demais entram em ordem de ganho observado, cada uma em um commit reversível.

## 1. Medir a versão atual e fixar o comportamento

| Cenário | Medição antes e depois |
| --- | --- |
| Rally com quatro atletas | Repetir o [replay de câmera](benchmarks/017-render.cjs) por cinco minutos em 1280×720, DPR 1, qualidade baixa e câmera próxima. Medir intervalos entre quadros (p95, p99 e contagem acima de 50 ms). Em uma captura separada, medir tempo de CPU em interpolação, atualização da cena e renderização. |
| Salas simultâneas | Repetir a [carga com bots](benchmarks/015-load.mjs) e a [carga de dez salas por 15 minutos](benchmarks/007-load.mjs). Registrar p95 de trabalho por tick, atraso do agendamento e uso de memória. Para avaliar envio, acrescentar clientes WebSocket locais e medir serializações, bytes e tempo de CPU por snapshot entregue aos quatro clientes. |
| Entrada e saída | No build de produção, medir bytes JS transferidos com cache frio até o lobby utilizável e tempo de entrar na sala até o primeiro quadro jogável. Repetir dez ciclos de prévia, partida e saída, contando canvases, geometrias, texturas e memória após estabilização. |

Registrar commit, máquina, GPU, versões, cenário e configuração. Fazer três execuções por versão, alternando base e candidata, e comparar medianas. O [ensaio 017](benchmarks/017-render.json) registrou p95 de 17,1 ms e máximo de 906,5 ms na câmera próxima. O [ensaio 015](benchmarks/015-load-postfix.json) registrou p95 de 3,11 ms e excluiu serialização e rede. Esses dados orientam as medições. O pico isolado precisa de uma captura que identifique sua causa.

Gravar na base sequências de entradas por tick, com relógio, elenco, estado inicial e fontes de aleatoriedade controlados. Reexecutar nas duas versões em 2v2 humano e com bots nas dificuldades existentes. Comparar por tick bola, atletas, contatos, decisões dos bots, eventos de habilidade, cooldowns, fase, placar e resultado. Incluir saques pelos dois lados, suspensão, reconexão e revanche. Para o cliente, reproduzir os mesmos snapshots nos mesmos instantes e comparar posições interpoladas, ações visuais e indicação da bola.

## 2. Reduzir o trabalho por quadro

Começar pelo [buffer de interpolação](../apps/web/src/network/interpolation.ts). Cada amostra copia parte do histórico com `slice(1)` e, entre dois snapshots, combina as ações em um novo `Map`. A primeira experiência é percorrer o histórico por índice. Se a combinação de ações aparecer no perfil, calculá-la uma vez por par de snapshots e manter o filtro dependente do tick de renderização. Verificar também snapshots atrasados, mudança de fase no mesmo tick, troca de partida e limpeza na suspensão. Preservar o atraso de 100 ms, o limite do histórico e a posição final quando faltam amostras novas.

Na [cena](../apps/web/src/scene/createScene.ts), a atualização cria uma lista e um conjunto de IDs para reconciliar quatro atletas a cada quadro. Medir esse trecho separadamente. Se o custo justificar, reaproveitar o conjunto e manter a atualização de posição e animação por quadro, inclusive na troca de modelo ou time. Conferir as duas câmeras de equipe, a leitura da bola, a qualidade alta e baixa e o modo de movimento reduzido com os mesmos enquadramentos da base.

## 3. Reduzir o custo de envio por sala

O [broadcast da sala](../apps/server/src/rooms/application.ts) distribui a mensagem aos participantes e o [transporte](../apps/server/src/network/server.ts) serializa o envelope a cada envio. Se o ensaio com quatro clientes confirmar custo relevante, serializar o snapshot comum uma vez por emissão e reutilizar o texto para os destinatários daquela sala. Manter a verificação de conexão e de fila cheia por socket. Comparar mensagens recebidas byte a byte, em ordem, incluindo o caso de um cliente lento e a reconexão. A economia esperada é de CPU do servidor. O volume por cliente deve permanecer igual.

Preservar a simulação a 60 Hz, a emissão periódica a cada três ticks, as emissões de transição e o envio de entradas a cada 20 ms. Manter regras de física, saque, contatos, pontuação, habilidades e dificuldade dos bots durante toda a reforma.

## 4. Otimizar carregamento somente onde houver custo medido

O [lobby](../apps/web/src/lobby/Lobby.tsx) já carrega a partida sob demanda e a [vitrine](../apps/web/src/lobby/CharacterShowcase.tsx) faz o mesmo com a prévia 3D. Inspecionar a sequência de requisições do build para identificar dependências antecipadas ou código duplicado. Caso apareçam, ajustar o ponto de importação e repetir tanto o acesso com cache frio quanto a entrada efetiva em quadra. Medir os dois tempos evita transferir uma espera do lobby para o saque.

## Critério de conclusão

Como meta inicial, aceitar cada alteração quando reduzir em pelo menos 10% sua métrica principal de custo (CPU do trecho, alocações ou bytes iniciais), com ganho acima da variação entre execuções. Conservar o limite existente de 16,7 ms para o p95 do trabalho do servidor no ensaio 007. Investigar qualquer piora reproduzível na cadência dos quadros, entrada em quadra ou memória após os ciclos. Se o custo já for baixo demais para medir o ganho, encerrar a hipótese e registrar o resultado.

Antes de integrar cada alteração, executar o typecheck, o build e os testes dos workspaces afetados. Exigir equivalência dos replays e repetir a jornada real de lobby, rally, resultado e revanche. Registrar comandos, relatórios da base e da candidata e decisão junto à tarefa. Uma divergência de mecânica exige reverter a alteração correspondente antes de prosseguir.
