# 009 — Contrato e decisões de apresentação

Decisão anterior à implementação: extensão aditiva de protocolo v1. Snapshot pode conter visualActions: até 32 ocorrências nos últimos 120 ticks (dois segundos de simulação). Cada ocorrência tem id inteiro positivo crescente na partida, actorId de atleta, kind permitido, tick inteiro do contato aceito e facing em radianos. Chave lógica de deduplicação é matchId/id. Não é um comando de cliente.

Tipos: serve, receive, set, attack, block, rant, freePoint. Somente o servidor registra após validar fase, alcance, toque e cooldown. facing aponta para a bola no contato, ou para o parceiro na bronca. A duração é uma política de apresentação local, nunca uma alteração da física. Contato ocorre no tick inicial; sem antecipação que atrasaria a bola, a pose de contato é aplicada no primeiro frame dessa ocorrência e decai em recuperação. Não inventar golpe para ação recusada.

Compatibilidade: leitores novos aceitam ausência e servidores antigos continuam permitindo locomoção. Leitores antigos ignoram o campo opcional; envelope e comandos não mudam. Cliente valida limite, enums, identidade, números finitos e ticks antes de consumir a extensão. Janela cheia descarta ocorrências mais antigas. Não há garantia de recuperar ações depois de dois segundos/32 ocorrências, mas gestos antigos não devem ser reproduzidos como novos.

renderTick é uma propriedade local fracionária do resultado de SnapshotBuffer, interpolada com os mesmos tempos/alpha da bola; não é um novo campo enviado pelo servidor. visualActions de ambos os frames são unidas e filtradas até renderTick. Nunca extrapolar além do último snapshot.

Suspensão congela tick e pose; retomada com o mesmo tick deve ser aceita e limpar a janela de interpolação de relógio. Fim tem prioridade e estabiliza a última pose. Mudança de matchId/revanche limpa controladores, IDs e tempo de locomoção. Reconectar calcula a fase atual do gesto pela idade em ticks, sem tocar sons nem reexecutar ações. Sons já existentes não são disparados pelo controlador de poses.

Prioridade: suspensão/fim → ação confirmada vigente → salto/queda/aterrissagem → locomoção/idle. Blends usam tempo da simulação, não contagem de frames. Posição raiz nunca é animada: continua no snapshot; pivôs internos e orientação visual não alteram hitboxes.
