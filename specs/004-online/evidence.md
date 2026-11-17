# Evidências — 004-online

Dependências 001/002 integradas; 003 integrada por merge da PR #4, commit 792450d. Ambiente Windows, Node 26.13.1.

## 004-T1 — Autenticação e envelope (R04)

- Transporte WebSocket em `/socket`, allowlist de Origin, handshake auth v1 no primeiro frame (token fora de URL/logs), prazo de cinco segundos, payload máximo 8 KiB, encerramento por expiração e uma sessão por identidade.
- Verificador de produção usa Supabase getClaims (assinatura/expiração) e getUser (Auth remoto). Nenhum token é tratado como identidade sem validação. Contrato do handshake registrado em contracts.md.
- Validação estrita rejeita campos de autoridade, ações desconhecidas, tipos incorretos, números fora dos limites e versões incompatíveis. Limites por sessão: 60 inputs/s, 10 comandos/s; slow consumer fecha com backpressure >64 KiB.
- `npm.cmd run test --workspace @volleyball-mythics/server`: 5 testes de contrato/transporte em sockets reais, com verificador injetado: token inválido, identidade expirada, comando sem autenticação, frame excessivo, identidade autenticada e limite de comandos.
- Limitação: projeto Supabase na nuvem em preparação pelo proprietário; assinatura real, guest e catálogo remoto serão exercitados após configuração. Os testes locais não alegam validação end-to-end do Auth remoto.
- Gate de transporte local aprovado; integração remota pendente.

## 004-T2 — Salas privadas (R04)

- Registro em memória com UUID, código aleatório de seis caracteres e associação única por identidade autenticada. Código de query `?room=CODE` e código digitado resolvem a mesma sala. Admissão síncrona, sem await entre capacidade e inserção.
- Lotação 2/4, slots únicos por equipe; entrada/saída invalida prontidão; dono que sai transfere ao membro restante mais antigo e sala vazia expira.
- Testes: seis tentativas concorrentes em cada modo preservam lotação; código extraído do link resolve a sala; transferência de dono e expiração de código verificadas.
- Gate local aprovado; nenhum serviço remoto necessário para o registro de salas.
