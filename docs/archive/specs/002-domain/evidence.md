# Evidências — 002-domain

## 002-T1 — Estados e pontuação

- Requisito: R02; transições válidas, vitória em seis, regra sem vantagem e ponto idempotente por rally.
- Verificação: `npm run test --workspace @volleyball-mythics/domain` — 15 testes passaram; inclui fluxo de estados, placar 6–5, fase terminal e rally duplicado.
- Implementação: máquina de estados pura em TypeScript; partida guarda ids de ponto já aplicados.
- Ambiente: Windows, Node 22.14.0, TypeScript 5.8.3.
- Limitações: lista de ids processados permanece em memória no objeto da partida; persistência/replay no servidor pertence à feature de rede.

## 002-T2 — Toques, limites e saque

- Requisito: linhas inclusivas, quarto toque e regras de contatos consecutivos para singles/doubles e bloqueio; timeout de saque.
- Verificação: a mesma suíte passou com 15/15. Casos cobrem bola exatamente na linha, fora, quarto contato, mudança de lado, contatos consecutivos, toque de bloqueio e saque expirado.
- Implementação: cálculo de ponto usa último lado a tocar; toque muda posse e zera contagem do outro time; bloqueio não incrementa contagem; serviço puro retorna lado que recebe ponto em timeout.
- Limitações: separação física da bola entre contatos é mantida pela simulação/servidor, não por este módulo de regras.

## 002-T3 — Movimento e bola em passo fixo

- Requisito: simulação reproduzível por ticks, movimento limitado e colisões com chão/rede mesmo atravessando o plano entre endpoints.
- Verificação: suíte 15/15 passou; inclui repetição de 30 ticks, queda a 100 m/s e atravessamento da rede a 120 m/s em um tick.
- Implementação: integração por passo fixo, colisão varrida por fração temporal, bounds para atleta e normalização de diagonal.
- Limitações: colisão da rede usa reflexão simplificada; rotação, efeito, colisão entre atletas e física artística ficam para spike/render e gameplay posterior.

## 002-T4 — Configuração física e atributos

- Requisito: configuração versionada, parâmetros arcade documentados, validação de NaN/inf, limites físicos e atributos válidos.
- Verificação: suíte final 15/15 passou; casos cobrem NaN, infinito, passo maior que 1/30 s, atributo acima de 100 e média geral arredondada.
- Parâmetros v1: 60 Hz, gravidade 9,81 m/s², bola raio 0,11 m, rede 2,43 m, quadra 9 × 18 m, restituição da rede 0,45, velocidade 2–8 m/s, salto 4–9 m/s, saque 8 s, countdown 3 s e intervalo 2 s.
- Limitações: parâmetros são ponto de partida técnico e devem ser ajustados no spike de jogabilidade; alterações que mudem replay devem aumentar `version`.
