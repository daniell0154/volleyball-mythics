# Tarefas — Banco e identidade
Todas referenciam R01; executar em ordem. Cada tarefa depende da anterior e das features indicadas no plan.md.

- [x] 001-T1 — Bootstrap workspace e contratos
  - Destinos: package.json, packages/protocol/src.
  - Aceite/verificação: Typecheck dos contratos e imports entre pacotes; registrar versões escolhidas.

- [ ] 001-T2 — Criar migrações de personagens versionados, perfis, partidas e participantes
  - Destinos: supabase/migrations.
  - Aceite/verificação: Aplicar em banco vazio; FK, uniques, atributos 1–100 e placares 0–6 rejeitam dados inválidos.

- [ ] 001-T3 — Aplicar políticas e identidade guest
  - Destinos: supabase/migrations, apps/web/src/auth.
  - Aceite/verificação: Dois guests distintos não alteram catálogo ou resultados; sessão persiste no reload.

- [ ] 001-T4 — Persistir resultado atomicamente
  - Destinos: apps/server/src/persistence.
  - Aceite/verificação: Retry idêntico retorna mesmo registro; concorrência não duplica; conflito rejeitado; falha rollback.

