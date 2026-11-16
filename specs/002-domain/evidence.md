# Evidências — 002-domain

## 002-T1 — Estados e pontuação

- Requisito: R02; transições válidas, vitória em seis, regra sem vantagem e ponto idempotente por rally.
- Verificação: `npm run test --workspace @volleyball-mythics/domain` — 15 testes passaram; inclui fluxo de estados, placar 6–5, fase terminal e rally duplicado.
- Implementação: máquina de estados pura em TypeScript; partida guarda ids de ponto já aplicados.
- Ambiente: Windows, Node 22.14.0, TypeScript 5.8.3.
- Limitações: lista de ids processados permanece em memória no objeto da partida; persistência/replay no servidor pertence à feature de rede.
