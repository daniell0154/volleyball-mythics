# Partida online 1v1 completa
Status: implementação e aceites locais concluídos em feat/005-match, incluindo teste de produção em dois navegadores e persistência normal no Supabase real. Antes do deploy completo, aplicar a migration 202611160004 de cancelamento na nuvem; validada em PostgreSQL/WASM local, ainda não aplicada ao projeto remoto.
Requisito R05: Dois jogadores completam partida e revanche.

## Aceitação
Clientes concordam sobre vencedor; desconexão respeita 20s e orçamento 40s; ambos ausentes cancela.

Cenários adicionais e falhas obrigatórias constam dos critérios por tarefa. Requisitos globais: contracts.md e REFINAMENTO.md.

