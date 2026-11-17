# Tarefas — Qualidade e beta web
Todas referenciam R07; executar em ordem. Cada tarefa depende da anterior e das features indicadas no plan.md.

- [x] 007-T1 — Matriz funcional e rede
  - Destinos: docs/acceptance.
  - Aceite/verificação: 1v1/2v2, 6–5, abandono, reconexão, token expirado, spam, duplicação de resultado e reinício servidor cancelando partida.

- [x] 007-T2 — Carga e desempenho
  - Destinos: docs/benchmarks.
  - Aceite/verificação: 10 salas 2v2 por 15min: p95 tick <=16,7ms; quatro clientes com RTT 150ms e jitter 30ms sem divergência de placar; ajustar capacidade antes de ampliar.

- [ ] 007-T3 — UX e navegadores
  - Destinos: apps/web/src, docs/acceptance.
  - Aceite/verificação: Chrome/Firefox/Edge/Safari desktop estáveis com versão registrada; fallback gráfico, contraste, volume, teclado e feedback além de cor. Chrome/Edge e fallback da demonstração medidos; Firefox/Safari e fallback online permanecem pendentes.

- [ ] 007-T4 — Preparar entrega
  - Destinos: docs/deployment.
  - Aceite/verificação: roteiro em `docs/deployment/007-release.md`; ensaio real de staging ainda pendente. Publicação e custos só com autorização correspondente.

