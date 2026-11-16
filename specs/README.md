# Ordem de execução SDD
Ler constitution → REFINAMENTO → contracts → spec/plan/tasks da feature.
Sequência: 001 dados → 002 domínio → 003 3D → 004 salas/rede → 005 1v1 → 006 2v2/habilidades → 007 beta.
Não iniciar feature dependente de gate reprovado. Consultar os checklists para identificar a próxima tarefa pendente.

## Commits, branches e PRs

- Uma tarefa = um commit próprio. Exemplo: `feat(001-T1): bootstrap workspace e contratos`. Incluir código, verificação, evidências e atualização do checklist da mesma tarefa juntos.
- Uma spec = uma branch e uma PR novas. `feat/001-data` contém os commits de `001-T1` a `001-T4` e gera uma única PR de `001-data` para `main`.
- Não misturar specs nem fazer squash das tarefas. Correções posteriores recebem commits identificando a tarefa original; não reescrever histórico publicado.
- Conferir status, branches e PRs antes de agir; retomar a branch/PR existente da spec sem duplicação e preservar mudanças alheias.
- Remote esperado: `origin`, `https://github.com/daniell0154/volleyball-mythics.git`. Conferir antes de publicar.
- Se não houver commit/base, executar `PREP-001`: registrar somente o planejamento em `docs(PREP-001): registra planejamento SDD` e publicar `main` como base inicial. Todas as implementações seguem por PR.
- Push e abertura de PR foram solicitados pelo usuário. Não fazer merge automaticamente. Aguardar integração da spec antes de iniciar a dependente.
- Tarefa bloqueada permanece pendente. Se houver trabalho parcial publicável, abrir PR draft com as pendências explícitas.

Prompt para Luna ou outro implementador:
> Leia specs/README.md e os documentos exigidos por ele. Inicie ou retome a primeira spec pendente cujas dependências estejam concluídas e integradas em main. Confira o estado do repositório e execute a preparação inicial se necessária. Implemente todas as tarefas dessa spec em ordem, uma por vez, com um commit separado por tarefa identificado pelo ID. Respeite caminhos, contratos, critérios e regras de Git deste guia. Não invente conteúdo de personagens. Se encontrar conflito, registre a decisão e atualize os documentos antes do código dependente. Execute as verificações indicadas, registre resultados reais e limitações em evidence.md e só marque a tarefa concluída quando o aceite passar. Ao concluir a spec, revise a consistência entre spec, plan, tasks, contratos e código; publique a branch no origin e abra uma PR exclusiva para main, descrevendo as tarefas, verificações e limitações. Não faça merge. Informe os commits, o link da PR e a próxima spec elegível após o merge. Se faltar acesso, conteúdo ou outro pré-requisito, avance nas partes independentes permitidas e relate o bloqueio concreto sem alegar conclusão.

Para executar, basta pedir: **Leia specs/README.md e execute o prompt de execução contido nele.** O padrão é implementar uma spec inteira. Após o merge, repetir a instrução seleciona a próxima spec. Para limitar o trabalho, informe uma spec ou tarefa específica.

Cada evidence.md deve registrar tarefa, requisito, comando/cenário, resultado real, ambiente, limitações e decisão do gate. Após cada feature analisar consistência entre spec, plan, tasks e contratos antes de prosseguir.
