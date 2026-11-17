# Evidências — 010-rally-dynamics

Base: main d28744a (009 integrada). Branch feat/010-rally-dynamics. Lidos README, REFINAMENTO, contracts, MELHORIAS e spec/plan/tasks. Nenhum AGENTS.md/constitution encontrado.

## 010-T1 — Instrumentar e medir

- RallyMetrics guarda contadores/histograma fixo, sem identidades, tokens, posições ou inputs brutos. Registra duração do saque ao ponto, contatos após saque, devolução, recusas por alcance e atraso de processamento em ticks (não RTT). Estado reinicia por rally. Observer não persiste; logging JSON de agregados só com RALLY_TELEMETRY=1.
- node docs/benchmarks/010-rallies.mjs capturou 20 rallies por modo com regras v1. Fixtures de teste perseguem a bola, com reação 100/150/200/300 ms e erro de alvo 0/0,5/1,2/1,8 m, encerrando tentativas após 15 s. Não são participantes humanos nem bots no produto; “skill” é uma política mecânica explícita e idêntica para comparação posterior. Captura técnica satisfaz baseline reproduzível; metas humanas continuam na T4.
- Resultado por modo: 60% dos saques devolvidos, mediana 1 contato após saque, duração mediana 3,133 s, p95 16,683 s, 30 recusas por alcance. Mecanismo simétrico produz mesmas estatísticas nos dois modos; não prova equivalência de dificuldade humana.
- Relatório: docs/benchmarks/010-baseline.json, com todas as 40 linhas e ambiente. Teste dedicado de métricas passou (1/1); build servidor passou. Nenhum parâmetro foi alterado para medir o baseline.
- Gate técnico T1 aprovado; experiência humana ainda não avaliada.
