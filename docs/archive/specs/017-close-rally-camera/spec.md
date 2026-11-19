# 017 — Câmera próxima e leitura da bola

Implementada · R17

O jogador deve reconhecer o próprio atleta em primeiro plano e acompanhar a bola desde o saque até a recepção. A SPEC 016 define o retângulo livre entre as faixas do HUD. Calibrar a aproximação depois de integrar esse layout.

## Comportamento e aceite

- No início do saque, enquadrar por trás e acima do atleta local, olhando para a rede. Espelhar posição e direção para o time B. Acompanhar a posição no piso para que o salto do atleta não faça a câmera subir junto.
- No rally, ajustar a inclinação pelo deslocamento e pela altura da bola. Quando ela subir ou se afastar para a lateral oposta, abrir o suficiente para manter atleta, bola e zona de recepção legíveis. Voltar à distância curta de forma gradual. Em “reduzir movimento”, usar enquadramento fixo por lado.
- Meta inicial de proximidade em 1280×720: aumentar em pelo menos 30% a altura projetada em pixels do atleta local, comparada ao mesmo frame da 016 no saque e na recepção próxima. Escolher a variante mais próxima que passe os ensaios de visibilidade.
- Em todos os frames amostrados dos lances legais de referência, a bola inteira deve caber na área segura da 016. Em 720p deve medir pelo menos 12 CSS px. Conferir nos clipes se o corpo em primeiro plano ou a rede esconde o contato. Em bola fora de quadra, conferir o indicador direcional da 014.
- Comparar os dois lados em saque, levantamento alto junto à rede, ataque cruzado e defesa no fundo. Cobrir quatro atletas, qualidade baixa/alta, 720p/1080p, resize, zoom 200% e movimento reduzido. Registrar quaisquer enquadramentos reprovados.
