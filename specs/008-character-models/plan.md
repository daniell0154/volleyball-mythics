# Plano técnico — 008

Base: 007 integrada; pendências de publicação não bloqueiam modelagem local.
Destinos: apps/web/src/scene/avatar.ts, createScene.ts, CharacterPreview.tsx; docs/art.

Modelo procedural articulado Three.js como primeiro caminho; separar construção, materiais, pivôs e descarte. Compartilhamento de geometria requer propriedade explícita para não liberar recursos usados por outro atleta. Modelos não dependem de nomes fixos no renderer.

## Verificação
Executar verificações proporcionais às alterações: domínio/servidor quando regras ou rede mudarem; testes de apresentação e inspeção visual para renderer; typecheck/build na integração. Registrar cenário, build, ambiente, resultados e limitações em evidence.md. Aplicar orçamentos de docs/MELHORIAS.md; nenhum resultado está antecipadamente aprovado.

## Entrega
Uma branch e PR para esta spec; um commit por tarefa. Correções identificam tarefa original. Não publicar nem fazer merge automaticamente. Alterações nos contratos ativos ocorrem junto à implementação e à decisão de compatibilidade.

