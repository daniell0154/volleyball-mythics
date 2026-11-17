# Tarefas — 009
Todas referenciam R09; executar em ordem. Cada tarefa depende da anterior e das dependências do plan.md.

- [x] 009-T1 — Contrato de ações visuais
  - Destinos: apps/web/src/scene, apps/web/src/network, apps/server/src/runtime, packages/protocol.
  - Entrega/aceite: Especificar ação aceita com identidade, tipo, tick inicial e identificador de ocorrência. Compatibilidade com protocolo v1 deve ser decidida antes do código; leitores toleram ausência. Não confiar em animação enviada pelo cliente.

- [x] 009-T2 — Locomoção e saltos
  - Destinos: apps/web/src/scene, apps/web/src/network, apps/server/src/runtime, packages/protocol.
  - Entrega/aceite: Idle, deslocamento, salto, queda e aterrissagem com blends; orientação acompanha movimento/ação. Usar delta temporal, não número de frames. Pausa por desconexão congela poses e retomada não reinicia golpes.

- [x] 009-T3 — Golpes e especiais
  - Destinos: apps/web/src/scene, apps/web/src/network, apps/server/src/runtime, packages/protocol.
  - Entrega/aceite: Implementar saque, recepção, levantamento, ataque, bloqueio, bronca e reação de Caio. Estado visual distingue ação recusada de confirmada; contato visual fica a até um snapshot (50 ms na configuração atual) do contato na timeline interpolada.

- [x] 009-T4 — Rede e ciclo de vida
  - Destinos: apps/web/src/scene, apps/web/src/network, apps/server/src/runtime, packages/protocol.
  - Entrega/aceite: Eventos repetidos não repetem golpes; perdas/transições rápidas se recuperam via estado durável ou janela limitada de eventos nos snapshots. Reconexão busca pose vigente sem repetir sons/efeitos antigos. Verificar 30/60/120 FPS, RTT 150 ms/jitter 30 ms e orçamento de render.

