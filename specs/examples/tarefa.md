# Exemplo de tarefa futura

**Anunciar o nome da habilidade no botão Especial**

Este exemplo usa `NNN` como marcador de número. Ao abrir uma spec real, substitua pelo próximo ID livre. Crie a pasta `specs/NNN-habilidade-no-hud/` e separe os blocos abaixo em `spec.md`, `plan.md`, `tasks.md` e `evidence.md`.

## spec.md

O nome acessível do botão **Especial** deve informar qual habilidade o atleta usa na partida. Isso permite identificar o poder durante a navegação por teclado e com leitor de tela. A tarefa depende da 019 integrada e usa os metadados do catálogo já disponíveis para a revisão selecionada.

## plan.md

Em `apps/web/src/lobby/Lobby.tsx`, obter o nome da habilidade a partir da revisão selecionada. Passar o nome para `apps/web/src/game/OnlineMatch.tsx` e incluí-lo no nome acessível do botão. Reaproveitar as regras existentes de disponibilidade, tecla de atalho e recarga. Quando faltar o nome, usar o rótulo genérico atual.

## tasks.md

- [ ] `NNN-T1` — Incluir o nome da habilidade no botão Especial e verificar teclado e recarga.

| Cenário de aceite | Nome acessível esperado |
| --- | --- |
| Samuel em rally com a habilidade pronta | `Especial · Bronca no Parceiro · U` |
| Samuel durante a recarga, com 12 s restantes | `Especial · Bronca no Parceiro · 12s` |
| Nome da habilidade ausente, com a habilidade pronta | `Especial · U` |

Verificar que o botão pode ser alcançado por Tab quando disponível e fica desabilitado durante a recarga. Usar a [referência do botão e da área de jogo](../contracts/016-fullscreen-court.md) e o [contrato de habilidades](../contracts/019-random-roster-abilities.md).

## evidence.md

| Verificação prevista | Resultado |
| --- | --- |
| `npm.cmd run test --workspace @volleyball-mythics/web` | Pendente |
| Partida local com Samuel, foco por Tab e inspeção do nome acessível antes e durante a recarga | Pendente |
| Verificação do rótulo genérico com o nome da habilidade ausente | Pendente |

Ao executar, anotar commit, ambiente, resultado observado e limitações. Marcar a tarefa concluída quando os cenários de aceite passarem. Branch de exemplo `feat/NNN-habilidade-no-hud`, commit `feat(NNN-T1): anuncia habilidade no botão especial` e PR para `main`.
