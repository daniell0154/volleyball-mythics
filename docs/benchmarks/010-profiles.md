# 010-T3 — Comparação de perfis imutáveis

Base física continua a de v1 (60 Hz, gravidade, quadra, rede, velocidade de atleta e salto). rulesVersion da partida representa também o perfil de rally. Todos os valores vêm de configuração revisada no servidor; cliente não escolhe versão por pacote.

| Revisão | Alteração | 1v1 / 2v2 no fixture |
| --- | --- | --- |
| 1 | Comportamento antigo | 60% devoluções; mediana 1 contato |
| 2 | Alcance 2,3 m, separação 2,5 m, recuperação 6 ticks; trajetórias antigas | 80% devoluções; mediana 10 contatos |
| 3 (candidato padrão) | Arcos com destino, alcance 2,15–2,35 m conforme atributo; mesma separação/recuperação | 100% devoluções; mediana 8 contatos |

Cada linha foi executada separadamente sobre 20 rallies por modo com as mesmas políticas de input. Arquivos 010-baseline.json, 010-reach-only.json e 010-targeted.json preservam todas as amostras. As metas humanas de 70%/3 contatos não são declaradas atingidas por pessoas. O fixture interrompe tentativas aos 15 s, portanto a distribuição de rallies longos é limitada artificialmente; não usar seu p95 como duração típica para humanos.

## Revisão 3

Saque e recepção miram uma zona interior a quatro metros da rede no lado adversário, em vez de carregar velocidade fixa que pode levar a bola além da quadra. Recepção ganha mais tempo de voo; levantamento mira o companheiro (ou zona interior do próprio lado no 1v1); ataque tem voo mais curto, e bloqueio tem perfil próprio. Não há auto-contato: tecla, alcance, fase, limite de toques, separação e recuperação continuam exigidos.

A velocidade inicial resolve a trajetória balística com gravidade 9,81 e altura de chegada igual ao raio 0,11 m. Não é teleporte nem garantia de passar pela rede. Atacar do chão muito perto da rede ainda pode prender a bola; salto e posicionamento importam. O solver não corrige colisões depois de lançar.

Serve/attack maiores reduzem tempo de voo e aumentam velocidade horizontal; receive/set maiores aumentam a janela de preparação; alcance do golpe cresce com seu atributo. Velocidade e salto continuam monotônicos e não mudam. Nenhum overall/habilidade foi reescrito. A penalidade de Samuel continua multiplicando alcance; poder de Caio mantém validação própria e ponto adversário único.

O perfil é congelado e fixado ao iniciar partida; resultado persiste rulesVersion real. Servidor aceita RALLY_RULES_VERSION=1/2/3 para novos jogos; versão desconhecida impede inicialização. Perfil 1 mantém fórmulas antigas. Mudar a configuração exige novo processo e não converte partida em andamento. Sem nova migration: schema/RPC já aceitam rulesVersion positivo.
