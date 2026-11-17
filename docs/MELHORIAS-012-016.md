# Novo ciclo — elenco administrável e vôlei 2v2

Status: planejamento solicitado pelo proprietário; não implementado. Base de trabalho: entrega da 011, commit d64df45. Confirmar sua integração em main antes de implementar 012. Este documento sucede as restrições de produto anteriores somente para o novo ciclo; contratos em execução continuam vigentes até suas migrações.

## Pedidos e sequência

| Ordem | Spec | Resultado |
| --- | --- | --- |
| 012 | [Admin](../specs/012-admin-roster/spec.md) | Criar e publicar personagens pelo site, com acesso administrativo |
| 013 | [Modos](../specs/013-2v2-modes/spec.md) | Consolidar 2v2 online e remover novas partidas 1v1 e demonstração pública |
| 014 | [Gameplay e bola](../specs/014-rally-balance/spec.md) | Combater domínio do saque, melhorar controle e acompanhar a bola |
| 015 | [Bots](../specs/015-coop-bots/spec.md) | Solo/coop contra bots com três dificuldades |
| 016 | [Tela de partida](../specs/016-fullscreen-court/spec.md) | Quadra ocupa viewport e controles ficam dentro, embaixo |

A ordem calibra regras antes da IA e valida a apresentação final nos dois modos. Planejamento pode ser revisado em conjunto; execução é sequencial, uma spec por branch/PR, após integrar a anterior. Gates de lançamento da 007 continuam independentes.

## Referência de gameplay: Just Volleyball

Fonte primária consultada em 2026-11-17: [página oficial do jogo na Steam](https://store.steampowered.com/app/5037200/just_volleyball/). Sua descrição apresenta vôlei arcade, movimentação manual e mira por cursor. A consulta foi textual; não houve sessão jogável nem análise quadro a quadro de vídeo. Não atribuir à referência tempos de reação, velocidades ou regras não verificados.

Aplicação proposta ao nosso jogo: controles acessíveis, direção intencional dos contatos, oportunidades de reposicionamento e preparação de jogadas entre colegas. Comparar mira por cursor com controle direcional pelo teclado num protótipo antes de escolher; conservar caminho completo por teclado. Não copiar assets, interface ou código, nem importar modos 1v1/6v6 da referência.

A melhoria de visão da bola é requisito próprio: contorno contrastante, tamanho visual mínimo, sombra de posição, oclusão tratada, câmera acompanhando o espaço útil e HUD com margem segura. Rastro é auxiliar e respeita reduzir movimento. Nenhum efeito visual altera contato ou confirma uma ação antes do servidor.

## Decisões propostas e limites

- “Jogadores” no admin significa personagens do elenco, não contas de usuários. Poderes novos programáveis e upload arbitrário de modelos não entram nesta etapa.
- “Preview do jogo” significa demonstração 3D pública. Preview do personagem permanece na seleção/admin.
- 2v2 online já existe: consolidar, testar e torná-lo principal. 1v1 histórico permanece legível, mas novas salas serão recusadas.
- Contra bots: solo com parceiro bot ou dois amigos contra dois bots; servidor obrigatório. Offline, matchmaking e substituição automática de humano desconectado ficam fora.
- Dificuldade fácil/normal/difícil pertence aos bots. Balanceamento do saque vale para todos, sem handicap secreto ou recepção garantida.
- Tela inteira significa ocupar a área do site ao iniciar. Fullscreen do navegador é opcional e depende de gesto/permissão; sua recusa não impede jogar.

Estes padrões resolvem detalhes não especificados pelo proprietário e podem ser ajustados antes da implementação. Não inventar nomes, atributos ou habilidades de novos personagens.

## Gate comum

Contratos futuros em specs/future-contracts-012-016.md; atualizar contratos ativos junto ao código. Testes de segurança/dados, regressões de regras/rede, percurso e evidências visuais conforme cada tarefa. Medições da 014/015 usam agentes exclusivamente de teste quando indicado; não alegar resultados humanos. A dispensa de coleta humana da 010 não dispensa novos gates automaticamente.
