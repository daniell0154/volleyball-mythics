# Banco e identidade
Status: especificado, não implementado.
Requisito R01: Usuário guest recebe identidade e lê elenco ativo; apenas servidor registra resultados.

## Aceitação
Sem sessão, acesso privado é negado; um usuário não lê resultado alheio. Repetir finalização não duplica resultado; payload conflitante é rejeitado.

Cenários adicionais e falhas obrigatórias constam dos critérios por tarefa. Requisitos globais: contracts.md e REFINAMENTO.md.

