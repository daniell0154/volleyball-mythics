# 019 — Novas habilidades e sorteio na ficha

Em andamento · R19

No editor da 018, o administrador pode escolher uma habilidade pelo nome ou clicar em **Sortear habilidade**. O sorteio altera somente a habilidade do rascunho em edição. Antes de salvar, mostrar efeito, alvo, duração e recarga e permitir trocar manualmente ou sortear de novo. Publicar fixa a escolha na revisão do personagem. Durante a partida, a ativação continua manual durante o rally, como “Bronca no Parceiro” e “Foi Sem Querer”.

## Candidatas para experimentar

| Nome e ID propostos | Efeito e condição | Duração / recarga | Feedback |
| --- | --- | --- | --- |
| Café no Intervalo · `coffee_break` | O próprio atleta corre 15% mais rápido. | 3 s / 22 s | Ícone de xícara e texto “Velocidade +15%”. |
| Mão de Manteiga · `butter_fingers` | A recepção do próprio atleta cai 15%. Os contatos ainda seguem as regras do rally. | 4 s / 18 s | Ícone de luva e texto “Recepção −15%”. |
| Minha Bola! · `my_ball` | O grito dá confiança ao parceiro em quadra, aumentando sua recepção em 10%. Requer parceiro ativo, humano ou bot. | 4 s / 24 s | Identificar o parceiro e o bônus de recepção. |

Nomes e números são propostas de balanceamento. O sorteio é uniforme entre poderes habilitados para publicação, excluindo o atual quando houver alternativa. Com uma opção, exibir a escolha disponível. Com zero, desabilitar o sorteio e explicar o motivo. Abrir a ficha, recarregar, salvar novamente ou iniciar uma partida deve reproduzir o ID salvo.
