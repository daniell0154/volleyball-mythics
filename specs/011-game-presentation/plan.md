# Plano técnico — 011

Base: 008, 009 e 010 integradas.
Destinos: apps/web/src/main.tsx, lobby, scene/CharacterPreview.tsx, game/OnlineMatch.tsx, results; docs/acceptance.

Reutilizar catálogo e RoomConnection; componentes de layout separados da simulação. Identidade visual própria da quadra escolar. Fallback WebGL deve preservar diagnóstico e navegação sem prometer jogo visual equivalente. Áudio inicia por gesto válido e nenhum controle fica sem efeito real.

## Verificação
Executar verificações proporcionais às alterações: domínio/servidor quando regras ou rede mudarem; testes de apresentação e inspeção visual para renderer; typecheck/build na integração. Registrar cenário, build, ambiente, resultados e limitações em evidence.md. Aplicar orçamentos de docs/MELHORIAS.md; nenhum resultado está antecipadamente aprovado.

## Entrega
Uma branch e PR para esta spec; um commit por tarefa. Correções identificam tarefa original. Não publicar nem fazer merge automaticamente. Alterações nos contratos ativos ocorrem junto à implementação e à decisão de compatibilidade.

