# Aceite de UX e navegadores — 007-T3

## Comportamentos

- O placar, a fase, a equipe e o lado do saque aparecem como texto; a leitura não depende da cor dos uniformes ou de um indicador visual.
- Ações de jogo têm botões com nomes e teclas visíveis, além de WASD. O foco do teclado fica visível no canvas; perder foco ou ocultar a aba limpa teclas pressionadas.
- O placar e o feedback de rede usam regiões acessíveis (`status`/`alert`). Se WebGL falhar, a partida online mantém um resumo textual de placar/fase e permite os botões de ação; a demonstração informa controles e requisito gráfico.
- Qualidade baixa/alta fica identificada por texto. O controle de volume silencia ou ajusta o sinal sonoro de ponto e persiste a preferência quando armazenamento local está disponível.

## Matriz executada neste ambiente

| Navegador | Versão | Resultado |
| --- | --- | --- |
| Chrome desktop (Windows) | 157.0.8103.79 | Smoke da demonstração: canvas único, instruções de teclado e console limpo. |
| Edge desktop (Windows) | 157.0.4341.60 | Smoke da demonstração: canvas único, instruções de teclado e console limpo. |
| Firefox desktop | — | Não instalado neste ambiente; pendente. |
| Safari desktop | — | Indisponível neste Windows; pendente em macOS. |

Execução reproduzível: `node .test-build/007-smoke.cjs` depois de iniciar Vite em `apps/web` e instalar Playwright sob `.test-build/browser`. O harness executado está em `.test-build` e não faz parte do repositório. Estes smokes não substituem o ensaio prolongado de renderer do spike 003, nem validam WebGL em cada navegador.

T3 permanece aberta até executar Firefox e Safari e inspecionar o fallback WebGL na partida online. Nenhum resultado é inferido para navegadores ausentes.
