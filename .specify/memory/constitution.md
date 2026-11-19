# Constituição — versão 1.2
1. Requisitos confirmados do usuário prevalecem; padrões propostos são identificados em docs/REFINAMENTO.md.
2. Servidor determina física, pontos, cooldowns, vencedor e permissões. Cliente transmite intenção.
3. No web, domínio e contratos em TypeScript puro. No porte Roblox solicitado na 021, usar Luau tipado e comparar as regras com fixtures do TypeScript. O domínio permanece independente de interface, banco e renderer.
4. PostgreSQL persiste dados duráveis do web. No Roblox, usar DataStoreService segundo a spec 021. Nenhuma gravação por frame. Resultado deve ser transacional e idempotente.
5. Nenhum personagem real ou habilidade final será inventado pelo implementador.
6. Cada tarefa entrega evidência ligada a cenário de aceite. Não declarar testes não executados.
7. Uma feature por vez; dependências devem estar concluídas. Alterações de contrato atualizam consumidores e especificações.
8. Portabilidade é preparada com interfaces, não prometida sem ensaio em dispositivo.
9. Segredos ficam no servidor. Auth autentica; autorização é validada em cada operação.
10. Mudanças desta constituição exigem motivo, versão e atualização dos documentos afetados.
11. Cada tarefa gera um commit próprio com seu ID; código, verificações e evidências da tarefa ficam nesse commit. Não agrupar tarefas.
12. Cada spec gera uma branch e uma PR próprias. Exemplo: `001-data` é uma PR com os commits de `001-T1` a `001-T4`. Não misturar specs ou fazer squash das tarefas. Push e abertura de PR estão autorizados; merge não está autorizado.

Alteração 1.1: padrão de commits e PRs solicitado pelo usuário, refletido no guia specs/README.md.

Alteração 1.2: adaptar linguagem e persistência ao runtime Roblox autorizado na spec 021, conservando a autoridade do servidor e a comparação com as regras existentes.

