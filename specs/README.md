# Guia de execução das specs

Leia a [constituição](../.specify/memory/constitution.md), o [refinamento](../docs/REFINAMENTO.md), os [contratos vigentes](contracts.md) e os arquivos `spec.md`, `plan.md` e `tasks.md` da entrega. Consulte o [arquivo de specs](../docs/archive/specs/README.md) para histórico e evidências e o [exemplo de tarefa](examples/tarefa.md) para começar uma spec.

## Pendências de entrega

- **007 · Beta.** A T3 ainda exige Firefox, Safari e fallback gráfico online. A T4 exige ensaio real de staging. [Tarefas](../docs/archive/specs/007-release/tasks.md) · [Evidências](../docs/archive/specs/007-release/evidence.md) · [Roteiro](../docs/deployment/007-release.md).
- **019 · Liberação de habilidades.** O aceite da configuração e dos clipes precede a habilitação dos candidatos e do sorteio em produção. [Contrato](contracts/019-random-roster-abilities.md) · [Evidências](../docs/archive/specs/019-random-roster-abilities/evidence.md).
- **Operação e lançamento.** Confirmar o deploy do serviço único no Render e a configuração Auth/RPC da administração no ambiente alvo. O checklist inicial mantém hardware de referência, orçamento, hospedagem de produção, elenco e poderes finais como critérios para lançamento amplo. [Serviço único](../docs/archive/specs/hosting-single/evidence.md) · [Administração](../docs/admin/012-operations.md) · [Checklist](../docs/archive/specs/checklist.md).

## Execução e publicação

1. Inicie ou retome a primeira spec elegível com dependências integradas na `main`, ou a entrega explicitamente indicada pelo proprietário. Confira status, branches e PRs e preserve alterações alheias. O remoto é `origin` em `https://github.com/daniell0154/volleyball-mythics.git`.
2. Use uma branch e uma PR por entrega, com um commit por tarefa identificado pelo ID. Exemplo de mensagem de commit: `feat(001-T1): bootstrap workspace e contratos`. Inclua implementação, checklist e evidência da tarefa no mesmo commit. Preserve o histórico publicado e os commits por tarefa.
3. Execute as verificações de aceite na ordem das tarefas. Registre em `evidence.md` o requisito, comando ou cenário, resultado real, ambiente, limites e decisão do gate. Mantenha pendentes as tarefas bloqueadas. Em caso de conflito de contrato, registre a decisão antes do código dependente. Use o elenco fornecido pelo proprietário.
4. Revise a consistência entre código, contratos e documentação. Faça push e abra a PR para `main`, com as verificações e os limites. Use draft para entregas parciais. Aguarde autorização para merge e integração antes de iniciar uma entrega dependente.
