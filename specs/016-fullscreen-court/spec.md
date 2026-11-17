# Partida ocupa a tela e controles na quadra
Status: planejada; nenhuma implementação ou aprovação antecipada.
Requisito R16. Dependência: 015 integrada.

## Aceitação
- Ao começar countdown, a partida ocupa toda a área visível do site (100dvh/100dvw), sem header/lobby nem scroll da página; suportar online humano e bots. Usar viewport CSS como padrão. Fullscreen API opcional por gesto, com recusa/ESC recuperáveis.
- Placar/fase compactos no topo; ações e dicas de teclado dentro da área da partida na parte inferior, com fundo legível e safe areas. Opções de som/qualidade/reduzir movimento e sair acessíveis. Controles não podem cobrir bola nem recepção próxima à câmera.
- Separar área segura de jogo das faixas do HUD e ajustar projeção/câmera ao ResizeObserver: bola permanece visível pelos critérios da 014; não apenas esticar canvas sob painéis.
- Preservar foco de teclado ao entrar/sair, fechar opções devolve foco à quadra; ESC fecha menu/sai do fullscreen do navegador sem abandonar automaticamente. Perda de foco limpa input, menu não pausa online. Resultado/revanche permanecem no layout de partida.
- Verificar 1280×720, 1920×1080, resize, zoom 200%, ambos os lados, WebGL ausente e fullscreen negado; controles alcançáveis por Tab, texto >=4,5:1, sem dependência só de cor. Em espaço insuficiente, controles compactos expansíveis sem cortar ações essenciais.
- Medir quatro atletas por cinco minutos em 720p/DPR1/baixa: p95 intervalo render <=33,3ms e regressão <=10% contra baseline equivalente da 014. Registrar hardware/browser e aceitar limitações reais; revisão visual final obrigatória.

Gate: tarefas completas, evidências reproduzíveis e aceite do proprietário nos critérios de experiência. Mudanças de metas exigem decisão registrada antes do fechamento.

