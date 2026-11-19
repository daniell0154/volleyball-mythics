# Contrato de apresentação — 016

- A sala em `lobby` usa a navegação do site. Qualquer estado de partida, incluindo suspensão e resultado, usa a viewport da partida. A próxima revanche usa a mesma viewport.
- A Fullscreen API é acionada por botão. Recusa ou indisponibilidade retorna feedback dentro da tela; `fullscreenchange` só atualiza o controle. Nenhuma mudança de fullscreen envia um comando de rede.
- O render ocupa a viewport inteira. O espaço útil para os lances é o retângulo em pixels CSS entre as sobreposições superiores e inferiores. `ResizeObserver` mede o canvas e as sobreposições. A projeção usa esse retângulo ao enquadrar a quadra e a bola; o indicador usa as mesmas margens.
- Botões de ação passam pelo mesmo buffer e pipeline do teclado. A fase e a conexão determinam se há input; abrir opções não muda o relógio da partida. Perder foco limpa movimento, intenção pendente e mira.
- Snapshot, IDs de participantes, conexão, votos e resultado mantêm o contrato v1 das specs 014 e 015. A mudança é compatível com o servidor anterior e não exige migração.
