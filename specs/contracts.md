# Contratos compartilhados v1
Este arquivo descreve o contrato ativo. Mudanças planejadas para administração, somente 2v2, direção de ações e bots estão em [contratos futuros 012–016](future-contracts-012-016.md); não estão implementadas e serão incorporadas aqui junto às respectivas migrations/código.
## Dados
012: autorização e rascunhos administrativos definidos em [contrato 012](012-admin-roster/contract.md), migration 005. Membership privado com JWT não anônimo; RLS e escrita somente por RPC autorizada. Conteúdo publicado imutável, enabled mutável; id textual preserva catálogo existente. Publicação/API implementadas na T2.
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
009 (extensão aditiva v1): visualActions opcional, máximo 32 ocorrências dos últimos 120 ticks; {id, actorId, kind, tick, facing}, emitido somente após ação aceita. kind: serve/receive/set/attack/block/rant/freePoint. ID monotônico por matchId; tick de contato e facing finito autoritativos. Sem campo/comando de animação nos inputs. Leitores novos toleram ausência e validam a extensão; antigos ignoram-na. Contrato detalhado em docs/art/009-animation-contract.md.
Catálogo pode incluir overall, assetKey e abilityName para apresentação. Atletas no snapshot podem incluir assetKey, capturado da revisão selecionada ao iniciar. Ausência mantém placeholder compatível. Chaves `procedural:v1:male|female:seed` descrevem visual ficcional determinístico, sem efeitos de habilidade ou execução de código remoto.
008: manifesto local avatarManifest.ts seleciona a revisão de apresentação athletic-v2 para as duas chaves iniciais. A revisão do catálogo e o assetKey no snapshot continuam imutáveis; o construtor v1 permanece disponível e é usado para chaves fora do manifesto. Preview e partida usam o mesmo resolvedor. Toda nova associação exige revisão explícita do manifesto.
Na etapa 005, snapshots incluem countdown/serving/rally/point/finished/cancelled/disconnectedSuspension, placar autoritativo, sacador, vencedor/motivo e tempo de fase. Cliente interpola por 100 ms e envia até 50 inputs/s (limite 60/s). Movimento sem novo input expira em 15 ticks; ações discretas são consumidas uma vez. Cooldowns ficam vazios até habilidades da 006. Câmara em terceira pessoa; cliente converte movimento relativo para coordenadas do mundo.
Eventos adicionais: reconnectState (espera/retomada), actionFeedback (feedback ao próprio jogador), matchEnded (resultado e votos) e resultSaveState (pending/saved/failed por matchId). Revanche exige unanimidade de participantes conectados, novo matchId e zero pontos. Conclusão tardia de salvamento anterior nunca substitui resultado de outra partida.
Servidor valida JWT, associação à sala, fase, versão, schema, tamanho (máximo 8 KiB), frequência (60 inputs/s; 10 comandos/s por sessão). Rejeita seq repetido/antigo.
Simulação inicial 60 ticks/s; snapshots 20/s; interpolação visual 100 ms, sem rollback inicialmente. Tuning exige registro de medição.
010: ação discreta consumida uma vez; validade de fila limitada a 6 ticks desde recepção, sem renovar por pacote de movimento posterior. Movimento mantém validade de 15 ticks. Prioridade: salto → habilidade → saque ou ataque > levantamento > recepção, com atletas por equipe/slot. Intenção local é texto, não confirmação de contato. Sem nova janela de buffering.
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
010: perfis imutáveis de rally 1 (legado), 2 (comparação de alcance) e 3 (arcos com destino). Padrão de novas partidas é rulesVersion=3, fixada ao iniciar e persistida no resultado. Base física/tempo permanecem v1; alcance e recuperação pertencem ao perfil. Revisões 2/3 exigem separação >2,5 m e recuperação de 6 ticks por atleta; não mudam limite de toques nem poderes. RALLY_RULES_VERSION configura novos jogos no servidor; nunca é input de cliente. Detalhes em docs/benchmarks/010-profiles.md.

