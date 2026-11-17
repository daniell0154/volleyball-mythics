# Aceite funcional e de rede — 007-T1

Matriz executada contra os testes locais; não representa um ensaio em navegadores reais. Os cenários de banco usam PostgreSQL/WASM PGlite isolado, sem credenciais ou dados hospedados.

| Cenário | Cobertura automatizada | Resultado |
| --- | --- | --- |
| Partida 1v1 até 6–5 | `packages/domain/tests/match.test.mjs`, “first side to six wins 6–5”; `apps/server/tests/match.test.mjs`, conclusão em seis pontos | Passou |
| Lobby/partida 2v2 | `apps/server/tests/lobby.test.mjs`, quatro sessões, slots exclusivos, seleção repetida e snapshots para todos | Passou |
| Placar 2v2 até 6–5 | `packages/domain/tests/match.test.mjs`, regra primeiro a seis em 2v2 | Passou |
| Abandono e reconexão | `apps/server/tests/reconnect.test.mjs`, retorno em 19 s, prazo de 20 s, orçamento acumulado de 40 s e abandono | Passou |
| JWT expirado | `apps/server/tests/network.test.mjs`, identidade expirada rejeitada no handshake | Passou |
| Spam de habilidade | `apps/server/tests/match.test.mjs`, cooldown impede reaplicação; ponto de Caio só ocorre uma vez e só após validação de alcance | Passou |
| Resultado duplicado/idempotente | `supabase/tests/database/005_match.cjs`, retry idêntico aceito, conflito rejeitado, rollback e permissões | Passou |
| Reinício gracioso do servidor | `apps/server/tests/shutdown.test.mjs`; caminho de encerramento do processo cancela partidas 1v1/2v2 com `server_failure` e persiste sem vencedor | Passou |

## Limites deste aceite

- A matriz cobre regras e transporte por testes locais automatizados; a validação em quatro navegadores está na 007-T3.
- O caminho de cancelamento em nuvem depende da migration `202611160004_persist_cancelled_result.sql` estar aplicada. O ensaio local verifica o SQL por PGlite e não afirma estado da migration remota.
- O desligamento tenta persistir imediatamente os cancelamentos antes de fechar o serviço. Falhas de banco durante o próprio desligamento ainda podem impedir o salvamento; não há fila durável fora do processo.
