# Rallies dinâmicos e resposta de controle
Status: T1–T3 implementadas; T4 técnica verificada e melhoria qualitativa aprovada pelo proprietário. A amostra humana de 20 rallies por modo ainda está pendente.
Requisito R10: rallies dinâmicos e resposta de controle para a versão de tese.

## Escopo e referência
Seguir [documento de melhorias](../../docs/MELHORIAS.md). Samuel e Caio são iniciais; permitir expansão do catálogo. Preservar autoridade do servidor, 1v1/2v2 e primeiro a seis.

## Dependências
009 integrada; regras atuais como baseline.

## Aceitação
- **Instrumentar e medir:** Capturar 20 rallies por modo com parâmetros atuais; medir duração, contatos, devoluções e ações recusadas por alcance. Registrar ambiente, skill dos participantes e distribuição, sem salvar tokens ou inputs indefinidamente.
- **Clareza e resposta:** Feedback imediato de intenção sem afirmar contato; contato/habilidade só após confirmação. Documentar prioridade quando múltiplas ações chegam no mesmo tick; impedir ações atrasadas e spam. Não mudar limite de rede para mascarar atraso.
- **Calibrar trajetórias:** Comparar perfis versionados de saque, recepção, levantamento e ataque, um conjunto por vez. Dar janela de recuperação entre contatos, preservar monotonicidade dos atributos e avaliar 1v1 e 2v2 separadamente. Qualquer input buffering muda contrato e exige limite explícito.
- **Validar tuning:** Comparar baseline com 20 rallies novos por modo e metas do documento; proprietário avalia diversão e previsibilidade. Regressões cobrem 6–5, faltas, contatos simultâneos, habilidades, abandono, reconexão e resultado idempotente. Repetir carga e ensaio de latência com parâmetros finais.

Gate: todos os aceites de tasks.md com evidências reais; critérios visuais exigem aprovação do proprietário. Conteúdo novo, bots e publicação ficam fora desta spec.

