# Contratos compartilhados v1
## Dados
IDs UUID. Horários persistidos UTC; simulação usa tick inteiro.
Character: id, version, name, attributes {serve,receive,set,attack,block,speed,jump}, overall derivado, abilityId, abilityConfig, assetKey, enabled. Revisões imutáveis; partida fixa versão.
Profile: userId vinculado à identidade Auth, displayName (2–24 caracteres).
Match: id, mode (1v1|2v2), status (created|active|finished|cancelled), scores A/B (0–6), winner (A|B|null), reason (points|forfeit|server_failure|null), rulesVersion, startedAt, endedAt.
MatchPlayer: matchId, userId, team (A|B), slot (0|1), characterId, characterVersion. Unique(matchId,userId) e unique(matchId,team,slot).
MatchResult: matchId como chave idempotente, payload final e hash. Repetição idêntica retorna sucesso; conflito retorna erro.
Sala é estado em memória do servidor: roomId, code, mode, members, ownerId, ready, status. Código expira quando sala fecha; código não substitui autenticação.
## Rede
Handshake de transporte: primeiro frame textual `auth` com envelope v1, requestId e payload `{accessToken}`; não aceita comandos antes de validar JWT no Supabase. Responde ack com userId derivado do Auth. Token nunca aparece em URL/logs. Prazo de autenticação 5 s, mensagem máxima 8 KiB, sessão fecha ao expirar. Apenas uma conexão ativa por identidade; renovar conexão com novo token após expiração. Origin deve estar na allowlist do servidor. Este handshake não modifica os comandos de jogo abaixo.
Envelope cliente: protocolVersion=1, type, requestId, payload. Input inclui seq monotônico, moveX/moveZ [-1,1], ações discretas. Nunca aceitar userId, score, posição ou cooldown como autoridade.
Comandos: createRoom(mode), joinRoom(code), selectCharacter(id,version), setTeam(team,slot), ready(value), start, input, leave, rematchVote.
Resposta: ack(requestId,result) ou error(requestId,code); eventos roomState, snapshot, point, matchEnded.
Snapshot: matchId, tick, phase, score, serverTime, lastProcessedSeq por jogador, atletas, bola, cooldowns.
Catálogo pode incluir overall, assetKey e abilityName para apresentação. Atletas no snapshot podem incluir assetKey, capturado da revisão selecionada ao iniciar. Ausência mantém placeholder compatível. Chaves `procedural:v1:male|female:seed` descrevem visual ficcional determinístico, sem efeitos de habilidade ou execução de código remoto.
Na etapa 004, fase é countdown/serving/rally/disconnectedSuspension; pontuação permanece 0 e cooldowns vazios até 005/006 integrarem regras de partida e habilidades. Cliente interpola snapshots por 100 ms e envia intenções até 50/s (abaixo do limite 60/s). Movimento sem novo input expira em 15 ticks; ações discretas são consumidas uma vez. Nenhum ponto ou resultado é fabricado pelo protótipo de transporte.
Servidor valida JWT, associação à sala, fase, versão, schema, tamanho (máximo 8 KiB), frequência (60 inputs/s; 10 comandos/s por sessão). Rejeita seq repetido/antigo.
Simulação inicial 60 ticks/s; snapshots 20/s; interpolação visual 100 ms, sem rollback inicialmente. Tuning exige registro de medição.
Estados: lobby → countdown → serving → rally → point → serving; sexto ponto → finished. disconnectedSuspension retorna à fase anterior; falha servidor → cancelled.
Desconexão: regras de 20/40 segundos em REFINAMENTO; comandos atrasados nunca geram ações retroativas.
## Regras arcade propostas
Quadra 9 x 18 m, rede central, chão y=0; unidades em metros. Bola e atletas têm volumes de colisão explícitos.
Bola sobre a linha é dentro. Contato chão dentro concede ponto ao oponente do lado atingido; fora concede ao adversário do último toque. Bola na rede continua se ainda puder cruzar; chão resolve ponto.
Até 3 toques por time. Em 1v1 são permitidos consecutivos; em 2v2 consecutivos do mesmo atleta são falta, exceto contato de bloqueio, que não conta como toque.
Bola em contato contínuo não gera vários toques: novo toque exige separação prévia. Colisões simultâneas resolvem por tempo de impacto e slot estável.
Saque inicial time A; vencedor do ponto saca. Em 2v2 slot sacador alterna apenas quando time recupera saque. Timeout saque 8s concede ponto ao adversário.
Um rally concede no máximo um ponto; demais contatos ignorados após transição point. Entre pontos: 2s; início: 3s.
Gravidade, alcance de ações, velocidades e força são parâmetros versionados a calibrar no spike; não produzir elenco final antes dessa calibração.

