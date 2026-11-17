# 2v2 contra bots com dificuldade
Status: planejada; nenhuma implementação ou aprovação antecipada.
Requisito R15. Dependência: 014 integrada.

## Aceitação
- Padrão proposto: solo = um humano e um parceiro bot contra dois bots; cooperativo = dois humanos convidados contra dois bots. Sempre dois atletas por equipe. Não implementar offline nesta etapa: simulação continua no servidor.
- Escolher fácil/normal/difícil antes do início; normal padrão. Dificuldade controla reação, erro de previsão, deslocamento planejado e escolha de ações, sem mudar atributos, hitbox ou regras. Congelar perfil/seed por partida e preservá-los ou exibir nova escolha antes da revanche.
- Bots usam pipeline legal de movimento e ações, cooldown e alcance. Máquina de estados: posicionar, receber, levantar para colega, atacar, bloquear e sacar; atribuir responsabilidade para evitar dois perseguirem toda bola. Respeitar alternância de toques e habilidades existentes.
- Representar participantId e controller human|bot explicitamente; bot não recebe conta Supabase nem JWT fictício. userId só obrigatório para humano. Migrar FKs/RPC/hashes/resultados e clientes de modo compatível; histórico humano permanece legível.
- Somente humanos contam para prontidão, desconexão e votos. Solo: dono conectado inicia/revanche; coop: ambos humanos prontos/votando. Desconexão humana mantém política 20/40s, sem substituição silenciosa; sala sem humanos encerra runtime e bots.
- Servidor define bots, seed e dificuldade; cliente não envia identidade de bot, comandos por outro ator ou ações privilegiadas. Bots não entram em salas humanas. UI distingue parceiro/adversários bots e dificuldade.
- Repetir cenários determinísticos com mesmos inputs/seeds; aferir ordenação de dificuldade em 20 partidas por nível contra o mesmo agente de teste, reportando sobreposição. Fácil deve oferecer recepções e normal não pode perder para saque sozinho conforme 014. Confirmar diversão com proprietário.
- Medir dez salas 2v2 contra bots por quinze minutos: tick p95 <=16,7ms, memória e descarte estáveis; comparar com online humano. Persistência idempotente, reconexão e revanche cobertos.

Gate: tarefas completas, evidências reproduzíveis e aceite do proprietário nos critérios de experiência. Mudanças de metas exigem decisão registrada antes do fechamento.

