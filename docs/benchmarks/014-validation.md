# 014 — verificação e operação

## Reproduzir métricas

Após compilar o servidor, executar `node docs/benchmarks/014-rallies.mjs 3` e `node docs/benchmarks/014-rallies.mjs 4`. Arquivos profile contêm cada amostra e resumo; traces contêm snapshots de um rally por lado e condição. Política de teste usa reação atrasada de 200ms, RTT 0/150ms, jitter determinístico +-33ms, atributos 25/75/100 e zonas -3/0/3. Interceptação usa duas observações passadas/gravidade, sem posição futura. Limite de tentativas 15s por rally; duração longa é censurada. Métricas e partidas de agente não são resultados humanos.

40 saques por lado/RTT: ambos perfis tiveram 100% de devolução e 0/20 vitórias só-saque. Com time sacador parado, defensor passou de mediana 1 contato para 3 (receber/levantar/atacar). Cenário separado com ambos ativos: mediana 9→10 contatos. A comparação não demonstra que o saque anterior era impossível; o fixture final competente já defendia. Versões intermediárias de fixture com perseguição sem antecipação deram resultados diferentes e foram corrigidas antes do aceite; não usadas como prova de benefício.

## Renderer e clipes

Iniciar Vite na raiz em 5178 (com config apps/web/vite.config.ts). `014-review.html` reproduz a captura fixa de v3 em 014-render-traces.json para comparação visual antes/depois. O congelamento do arquivo evita mudar o workload quando o agente de métricas é refinado. `014-render.cjs before|after` grava canvas e mede cinco minutos, com HMR desabilitado para evitar navegação durante edição. Captura before deve usar renderer anterior à T3 (commit e32f204); after usa renderer novo. Não executar before no código novo e chamá-lo baseline antiga.

Chrome 157/Windows/i7-1185G7, 1280x720/DPR1/baixa, quatro modelos aprovados, câmera estável, replay Vite/headless. P95 16,8ms antes/depois, regressão 0%, abaixo de 33,3ms e 10%. Máximos 33,1ms antes e 99,9ms depois; não omitidos. Houve trabalho de implementação/testes concorrente no ambiente, portanto não é medição de hardware de produção ou garantia de frames. Relatórios render-before/after registram resultados reais.

`014-visibility.cjs`: 72 probes de rede, arco alto e fora da tela, lados A/B, câmeras fixa/dinâmica, baixa/alta e 720p/1080p/640x360 DPR2. Último é layout equivalente a 200%, sem acionar zoom nativo. Verifica marcador contido/tamanho e seta; capturas ball-A/B. Clipes candidate-A/B gravam só canvas; page-A/B são vídeos completos com marcador DOM, oclusão e seta. `014-page-clips.cjs` reproduz esses vídeos. Inspeção visual do implementador não equivale a playtest humano.

## Testar controles

Iniciar `014-fixture-server.mjs` (3018/3019) e Vite na raiz em 5179; abrir http://127.0.0.1:5179/docs/acceptance/014-preview/. Quatro sessões separadas completam sala 2v2. Servidor fixture fixa perfil 4; gateway guest é local e persistência sem banco. `014-input.cjs` verifica saque aceito e intenção de direção por teclado/cursor com quatro sessões; não valida Supabase remoto.

Produção: perfil 4 é padrão após o gate técnico delegado pelo proprietário. RALLY_RULES_VERSION=3 no servidor oferece rollback para novas partidas; as em andamento mantêm sua versão. Setas escolhem direção/profundidade, C centraliza, WASD move. Cursor é opção experimental acessível, teclado permanece padrão. Nenhuma migration nova. Sem alegação de avaliação humana de diversão ou dificuldade; recomendação de ensaio posterior mantida, conforme a delegação de executar e mergear sem novas aprovações.
