# Evidências — 010-rally-dynamics

Base: main d28744a (009 integrada). Branch feat/010-rally-dynamics. Lidos README, REFINAMENTO, contracts, MELHORIAS e spec/plan/tasks. Nenhum AGENTS.md/constitution encontrado.

## 010-T1 — Instrumentar e medir

- RallyMetrics guarda contadores/histograma fixo, sem identidades, tokens, posições ou inputs brutos. Registra duração do saque ao ponto, contatos após saque, devolução, recusas por alcance e atraso de processamento em ticks (não RTT). Estado reinicia por rally. Observer não persiste; logging JSON de agregados só com RALLY_TELEMETRY=1.
- node docs/benchmarks/010-rallies.mjs capturou 20 rallies por modo com regras v1. Fixtures de teste perseguem a bola, com reação 100/150/200/300 ms e erro de alvo 0/0,5/1,2/1,8 m, encerrando tentativas após 15 s. Não são participantes humanos nem bots no produto; “skill” é uma política mecânica explícita e idêntica para comparação posterior. Captura técnica satisfaz baseline reproduzível; metas humanas continuam na T4.
- Resultado por modo: 60% dos saques devolvidos, mediana 1 contato após saque, duração mediana 3,133 s, p95 16,683 s, 30 recusas por alcance. Mecanismo simétrico produz mesmas estatísticas nos dois modos; não prova equivalência de dificuldade humana.
- Relatório: docs/benchmarks/010-baseline.json, com todas as 40 linhas e ambiente. Teste dedicado de métricas passou (1/1); build servidor passou. Nenhum parâmetro foi alterado para medir o baseline.
- Gate técnico T1 aprovado; experiência humana ainda não avaliada.

## 010-T2 — Clareza e resposta

Teclado e botões compartilham onIntent: texto solicitado/aguardando confirmação antes de amostrar/enviar. Sem antecipar animação, som de contato ou placar. Mensagem local expira em 1,2 s. Idade de ação na fila do servidor separada da idade do movimento, máxima 6 ticks, consumida uma vez; movimento posterior não renova ação antiga.
Prioridade salto → habilidade → saque ou ataque > set > receive documentada em 010-controls.md/contratos. Sem mudança de limites de rede nem buffering de alcance. Web 19/19 e servidor 39/39 passaram (prioridade única, intenção antes de sample, repetição e fila antiga não renovada). Gate T2 aprovado.

## 010-T3 — Calibrar trajetórias

Perfis imutáveis 1 (legado), 2 (alcance/recuperação) e 3 (arcos com destino) comparados separadamente com as mesmas 20 amostras técnicas por modo. Perfil 2: 80% devoluções/mediana 10 contatos; perfil 3: 100%/8 contatos, contra 60%/1 no legado. Logs 010-reach-only.json e 010-targeted.json. Distribuição longa é limitada pelo fixture a 15 s de tentativas, não duração típica de pessoas.
Perfil 3 é candidato padrão de novos jogos; perfil fixado por partida e rulesVersion persistida. Perfil 1 disponível por RALLY_RULES_VERSION=1, versão desconhecida falha. Física base, atributos, overall, habilidades, faltas e seis pontos preservados; recuperação de 6 ticks e separação 2,5 m impedem contatos instantâneos. Detalhes/fórmulas em 010-profiles.md.
Domínio 21/21 e servidor 40/40 passaram: fórmulas legadas preservadas, solver chega ao alvo, atributos monotônicos, perfil fixado e repetição durante recuperação ignorada. Teste legado ajustado para comparar -0 explicitamente; não foi alterada a fórmula antiga para satisfazer teste. Teste de histórico denso da 009 usa agora explicitamente o perfil legado, que permite aquele fixture por tick.
Gate técnico T3 aprovado; diversão/previsibilidade e métricas humanas não inferidas do ensaio automatizado.

## 010-T4 — Validar tuning (parcial)

- Aceite qualitativo do proprietário após teste local: “cara funcionou perfeitamente, ta ate melhor de jogar”. Sem atribuir a esse comentário contagens ou experiência não informadas.
- Exportação encontrada em Downloads/010-playtest-human.json, timestamp 2026-11-17T14:09:01.960Z: 5 rallies 1v1, 3 saques legais, uma devolução; mediana zero contatos. Nenhum rally 2v2 e campos skill/opinion vazios no arquivo. Resumo sanitizado em 010-human-partial.json; o comentário acima vem da conversa, não foi inserido como se estivesse no arquivo exportado. Amostra pequena e experiência desconhecida: não concluir aprovação/reprovação estatística da meta 70%/3 contatos.
- Aplicação de playtest isolada em docs/benchmarks/playtest reutiliza OnlineMatch/MatchRuntime/RoomApplication, catálogo e habilidades reais do repositório; autenticação local de fixture e resultados sem banco. Padrão loopback, LAN só por configuração explícita. Não altera a autenticação de produção. Instruções e exportação em 010-playtest.md; resumidor exige 20 por modo e skill/opinion para relatório completo.
- Smoke Chrome com 2/4 contextos: sala, seleção, prontidão, saque, ponto e métrica em 1v1/2v2, sem exceções JS. Corrigida a ferramenta para desabilitar início incompleto e explicar participantes faltantes, após invalid_state reportado pelo proprietário ao tentar iniciar sozinho. Troca de personagem invalida prontidão; o harness agora espera todos escolherem antes de ready.
- Regressões: domínio 21/21, web 19/19 e servidor 40/40 passaram. Tipos/build passaram. Rede com 4 WebSockets/RTT configurado 150 ms e jitter 30 ms passou usando perfil 3; casos de 6–5, faltas, habilidades, reconexão, abandono, cancelamento e idempotência continuam cobertos. Resultado de cancelamento preserva rulesVersion real do perfil. Sem migration nova; schema/RPC existente aceita inteiro positivo.
- Carga: reuso de 009-load.mjs com --out docs/benchmarks/010-load.json, perfil 3; 900 s/10 salas/40 participantes, 54.000 chamadas, p95 0,5856 ms (limite 16,7), máximo isolado 174,2466 ms, atraso de agendamento p95 14,207 ms. 380 partidas reiniciadas, 180.780 snapshots, 723.120 entregas, 2.310 ações visuais observadas, ticks finais iguais. Passou; relatório guarda o rótulo de origem 009-T4 do runner reutilizado e identifica a execução desta T4 pelo caminho/comando. Node22.14/Windows/i7-1185G7/15,7GiB. Ensaios locais concorrentes; pico isolado não omitido. Sem prova de WAN ou capacidade de produção.
- Gate: técnico aprovado e aceite qualitativo recebido. T4 permanece aberta até 20 rallies humanos por modo com experiência/condições registradas e comparação das metas, ou uma revisão explícita desses critérios. Não marcar 010 concluída nem iniciar 011 enquanto esse gate estiver pendente.
