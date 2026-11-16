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
