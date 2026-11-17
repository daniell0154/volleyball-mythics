# Evidências — 013

Base origin/main a04aadb, merge da PR #15 (012). Branch feat/013-2v2-modes; nenhuma PR anterior. README, refinamento, contratos ativos/futuros, ciclo e spec/plan/tasks lidos; sem AGENTS.md/constitution encontrados. Configuração remota da 012 foi adiada pelo proprietário e não é apresentada como validada.

## 013-T1

Mapeamento por rg nos consumidores de 1v1, createRoom, Demo e Game. Decisão em contract.md: preservar formatos/dados históricos e reconhecer pedido antigo para rejeitar com mode_unavailable na fronteira pública. Nenhuma migration ou remoção de histórico. Remover Demo/Game somente após conferir dependências compartilhadas. Verificação documental proporcional; nenhum teste de implementação alegado nesta etapa. Gate T1 aprovado.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

## 013-T2

RoomApplication rejeita criação 1v1 com mode_unavailable antes de criar sala; protocolo v1 preservado, mensagem no cliente orienta atualizar para 2v2. Entrada sem seletor de modo envia sempre 2v2 e explica quatro humanos. Integração de sockets migrada para quatro jogadores mais um visitante recusado por lotação; verifica que pedido legado não cria sala e visitante não recebe snapshots. Fixtures de simulação/histórico mantêm 1v1 internamente; nenhuma migration destrutiva.

Servidor 40/40 passou, incluindo proprietário/prontidão/slots/personagens repetidos, snapshots/input em quatro sessões e RTT 150ms/jitter 30ms. Ambiente Node/Windows local; sem WAN ou Supabase remoto. Gate funcional T2 aprovado; UX completa na T4.

