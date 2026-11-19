# Plano técnico — 010

Base: 009 integrada; regras atuais como baseline.
Destinos: packages/domain, apps/server/src/runtime/matches.ts, apps/web/src/input, apps/web/src/game; docs/benchmarks.

Mudanças físicas entram em nova rulesVersion com perfil anterior disponível; partidas já abertas fixam regras. Sem alterar overall ou habilidades para encobrir problema de controle. Predição/rollback, se necessários, exigem ADR e orçamento específico; não são pressupostos deste ciclo.

## Verificação
Executar verificações proporcionais às alterações: domínio/servidor quando regras ou rede mudarem; testes de apresentação e inspeção visual para renderer; typecheck/build na integração. Registrar cenário, build, ambiente, resultados e limitações em evidence.md. Aplicar orçamentos de docs/MELHORIAS.md; nenhum resultado está antecipadamente aprovado.

## Entrega
Uma branch e PR para esta spec; um commit por tarefa. Correções identificam tarefa original. Não publicar nem fazer merge automaticamente. Alterações nos contratos ativos ocorrem junto à implementação e à decisão de compatibilidade.

