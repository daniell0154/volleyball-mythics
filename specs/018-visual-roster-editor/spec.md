# 018 — Editor visual de atletas no admin

Planejada · R18

A referência é `image.png`, na pasta acima do repositório. À esquerda há uma lista compacta com “+ Novo”, identificação e overall. No centro aparecem a ficha, os sliders com valores, as amostras de pele e as miniaturas de cabelo. À direita, um painel próprio mostra o atleta de corpo inteiro e convida a girá-lo. Os painéis escuros, títulos claros e destaque dourado deixam a seleção visível.

## Fluxo proposto para /admin

| Área | Interação e aceite |
| --- | --- |
| Elenco | “Novo personagem” abre uma ficha vazia. Agrupar rascunhos e revisões do mesmo atleta, identificar a seleção, mostrar nome, overall e estado com texto. Manter paginação e acesso ao histórico. Ao trocar de ficha com alterações, oferecer manter a edição ou descartá-la. |
| Ficha | Destacar o nome exibido no jogo. Exibir saque, recepção, levantamento, ataque, bloqueio, velocidade e salto em sliders com valor numérico editável (inteiro 1–100). O overall acompanha a média arredondada e deve coincidir com o valor publicado. A habilidade, o modelo e as ações de salvar, publicar e desativar continuam na ficha. |
| Aparência | Escolher modelo, tom de pele por amostra e penteado por miniatura identificada. Cada seleção altera apenas a característica escolhida. Mostrar seleção por contorno, nome e estado acessível. Manter variações existentes ao reabrir. |
| Pré-visualização | Exibir de corpo inteiro ao editar, preservar ângulo ao trocar cabelo ou pele, permitir arrastar, girar por teclado/botões e voltar à frente. Indicar que as cores do uniforme dependem do time. Sem WebGL, exibir resumo textual das escolhas e manter o formulário utilizável. |

Em desktop, manter ficha e prévia visíveis ao mesmo tempo. Em largura estreita ou zoom de 200%, empilhar os painéis, permitir recolher a lista e dar acesso direto à prévia a partir da aparência. Verificar o fluxo inteiro por Tab. Usar a composição da imagem com os dados do vôlei. Campos escolares, camisa, altura e overall manual da referência ficam fora desta proposta.
