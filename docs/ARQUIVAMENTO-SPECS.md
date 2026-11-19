# Plano de arquivamento das specs

Proposta para reduzir o volume de `specs/` e manter acessíveis os contratos em uso, as pendências de entrega e as evidências históricas. A execução cabe em uma PR de documentação própria, a partir da `main`.

## Destino dos documentos

| Hoje | Destino proposto |
| --- | --- |
| [Entrada do fluxo SDD](../specs/README.md) | Manter `specs/README.md` como índice curto de pendências, contratos, arquivo e exemplo de tarefa. Transferir a cronologia para o índice do arquivo. |
| [Contratos compartilhados](../specs/contracts.md) e os sete `contract.md` específicos | Manter `specs/contracts.md` como entrada. Mover os contratos ativos de 012, 013, 014, 015, 016, 018 e 019 para `specs/contracts/<pasta-atual-da-spec>.md`, com uma referência por assunto. Conservar o [contrato de animações](art/009-animation-contract.md) no caminho atual. |
| Specs numeradas encerradas | Mover as pastas para `docs/archive/specs/`, preservando IDs, `spec.md`, `plan.md`, `tasks.md` e `evidence.md`. Propor 001–006 e 008–019 como primeiro lote, após conferir a integração e a situação de cada uma. |
| [Checklist antigo](../specs/checklist.md) e [contratos futuros do ciclo 012–016](../specs/future-contracts-012-016.md) | Arquivar em `docs/archive/specs/` como documentos históricos. Destacar no índice ativo os itens ainda aplicáveis, com links para suas evidências ou roteiros. |
| Capturas, clipes, benchmarks e roteiros | Manter os caminhos atuais em `docs/acceptance/`, `docs/benchmarks/`, `docs/art/` e `docs/deployment/`. Corrigir os links relativos das specs quando elas mudarem de pasta. |
| [Elenco inicial](../specs/roster-initial/spec.md) e [hosting único](../specs/hosting-single/evidence.md) | Arquivar o conteúdo concluído depois de conferir o estado de cada entrega. Para hosting, conferir a pendência de deploy registrada e levar qualquer ação em aberto ao índice ativo. |

## Pendências que precisam continuar visíveis

- **007, UX e entrega.** Manter a [spec 007](../specs/007-release/tasks.md) acessível em `specs/` enquanto T3 e T4 estiverem abertas. O checklist registra Firefox/Safari, fallback online e staging. Vincular também o [roteiro de staging](deployment/007-release.md).
- **019, liberação em produção.** A implementação foi integrada no merge `98042fd` e validada localmente. Registrar no índice ativo o aceite da configuração e dos clipes, com links para o [contrato de habilidades](../specs/019-random-roster-abilities/contract.md) e as [evidências da 019](../specs/019-random-roster-abilities/evidence.md). A habilitação dos candidatos e do sorteio depende desse aceite.

## Sequência de execução

1. Partir da `main` atualizada. Conferir quais specs foram integradas, os checklists, os registros de aceite e as referências externas a cada pasta. Registrar os casos em aberto antes de mover os arquivos.
2. Mover os contratos ativos para os caminhos propostos e ajustar o índice compartilhado. Na revisão documental, conferir as transições de versão com o código e as migrations. Revisar, por exemplo, as menções aos perfis 3 e 4 como padrão e a distinção entre salas de quatro humanos e salas com bots.
3. Mover as specs encerradas. Criar `docs/archive/specs/README.md` com uma linha por entrega, link para a evidência e, quando disponível, referência à PR ou ao commit integrado. Manter os documentos históricos ligados aos contratos vigentes.
4. Enxugar `specs/README.md` e corrigir referências em `docs/MELHORIAS.md`, `docs/MELHORIAS-012-016.md`, `docs/PLANEJAMENTO.md`, neste plano e no [exemplo de tarefa](../specs/examples/tarefa.md). Ajustar a nota da constituição se o caminho do guia mudar. Atualizar referências dentro das pastas movidas. Por exemplo, um link de uma evidência arquivada para `docs/benchmarks/` passa a começar por `../../../benchmarks/`.
5. Rodar `git diff --check`. Conferir os links relativos dos Markdown alterados e buscar referências aos caminhos removidos com `git grep -n -I -e 'specs/' -e 'contract.md'`. Abrir pelo índice ativo os contratos, as pendências 007 e 019, o exemplo de tarefa e uma evidência com mídia arquivada. Revisar o diff para confirmar o escopo documental e os movimentos no Git.

Considerar a limpeza concluída quando cada contrato em uso tiver um caminho de referência, cada pendência continuar rastreável e o arquivo histórico apontar para a evidência correspondente. A PR documental pode ser revertida pelo Git se algum caminho importante precisar ser restaurado.
