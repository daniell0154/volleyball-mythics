# Tarefas — Salas e transporte
Todas referenciam R04; executar em ordem. Cada tarefa depende da anterior e das features indicadas no plan.md.

- [x] 004-T1 — Autenticar socket e validar envelope
  - Destinos: apps/server/src/network.
  - Aceite/verificação: Token inválido/expirado e payload excessivo rejeitados; não logar tokens.

- [x] 004-T2 — Criar e entrar em salas
  - Destinos: apps/server/src/rooms.
  - Aceite/verificação: Código/link resolve mesma sala; concorrência respeita lotação; dono que sai no lobby transfere ao mais antigo.

- [x] 004-T3 — Seleção e prontidão
  - Destinos: apps/web/src/lobby, apps/server/src/rooms.
  - Aceite/verificação: Equipe com capacidade, versão de personagem válida e somente dono inicia; mudança invalida prontidão.

- [ ] 004-T4 — Snapshots e inputs
  - Destinos: apps/server/src/runtime, apps/web/src/network.
  - Aceite/verificação: Simulação 60Hz e snapshots 20Hz; seq repetido ignorado, identidade de outro atleta não controlável.

