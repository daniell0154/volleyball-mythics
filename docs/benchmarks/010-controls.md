# 010-T2 — Contrato de resposta

Uma borda de tecla/clique produz intenção textual imediatamente, antes de ack. O texto diz “solicitado — aguardando confirmação”; não gera som de contato, rotação de golpe ou mudança de placar. Movimento não produz anúncio repetitivo. Animação e feedback de contato continuam vindos da confirmação do servidor (009).

Prioridade preservada no mesmo tick: salto se no chão → habilidade (se encerrar o rally, termina) → saque na fase serving; em rally, ataque > levantamento > recepção/bloqueio. Atletas são resolvidos por equipe/slot estável, sem escolher pela ordem de chegada do socket. Receber várias ações não concede vários contatos.

Ação discreta é consumida uma vez no próximo tick e só vale até seis ticks (100 ms) após recepção no servidor. Pacote posterior de movimento não renova a idade dessa ação. Movimento expira em 15 ticks; sequências antigas/repetidas continuam rejeitadas. Isso não detecta o tempo que um pacote ficou na internet antes de chegar; não há relógio do cliente autoritativo, predição ou rollback. Não existe fila para tentar contato automaticamente quando a bola se aproximar. Limites de 60 inputs/s, 50 envios/s do cliente, 60 Hz de simulação e snapshots 20 Hz permanecem.
