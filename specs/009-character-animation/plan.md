# Plano técnico — 009

Base: 008 integrada e rig aprovado.
Destinos: apps/web/src/scene, apps/web/src/network, apps/server/src/runtime, packages/protocol.

Máquina de estados de apresentação com prioridade e interrupção documentadas: fim/suspensão, ação, salto, locomoção. Rotação de pivôs e blends primeiro; AnimationMixer somente se adotados clips. Locomoção pode ser inferida, contatos de bola exigem sinal autoritativo. Toda mudança de wire schema atualiza validators, tipos, cliente, servidor e contracts.md juntos.

## Verificação
Executar verificações proporcionais às alterações: domínio/servidor quando regras ou rede mudarem; testes de apresentação e inspeção visual para renderer; typecheck/build na integração. Registrar cenário, build, ambiente, resultados e limitações em evidence.md. Aplicar orçamentos de docs/MELHORIAS.md; nenhum resultado está antecipadamente aprovado.

## Entrega
Uma branch e PR para esta spec; um commit por tarefa. Correções identificam tarefa original. Não publicar nem fazer merge automaticamente. Alterações nos contratos ativos ocorrem junto à implementação e à decisão de compatibilidade.

