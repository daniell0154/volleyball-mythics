# Evidências — 005-match

Base main com 004 e serviço único integrados (38f2718). Por pedido explícito, reúne conteúdo Samuel/Caio, câmera em terceira pessoa e botões de partida; commits ROSTER-T1/T2 preservados como preparação. Nenhum gate de habilidades 006 é declarado concluído.

## 005-T1 — Loop, HUD e terceira pessoa

- Servidor aplica fases countdown, serving, rally, point e finished; vitória imediata em 6, intervalo de pontos 2 s, saque 8 s, até três toques, alcance/separação de contatos e volumes/colisão do domínio. Movimento/salto usam atributos fixados da revisão do personagem. Cliente envia intenção e não escolhe pontos.
- Corrigido resolveGround: dentro depende do lado atingido (A em z<0, B em z>0), fora depende do último toque. Timeout de saque resolve um ponto idempotente mesmo sem rally iniciado.
- Câmera acompanha jogador local por trás e movimento é relativo ao lado/câmera. Botões de salto, saque, recepção/bloqueio, levantamento e ataque enfileiram ações reais; habilidades especiais continuam explicitamente indisponíveis até 006.
- Site inicia no lobby online para evitar confundir demonstração automática com partida controlável. Diagnóstico do deploy existente: navegação Salas online→guest funcionou em HTTP 200, sem erro JavaScript; avisos de bundle/use client não eram falha de build.
- Testes: 15 servidor e 9 web passaram (incluindo câmera, partida até sexto ponto, saque autorizado, bola dentro no lado oposto, ação fora de alcance e contato contínuo). Typecheck passou; testes de domínio mantidos com regra de chão corrigida.
- Edge 157, dois contexts independentes, Supabase real, servidor/teste local: guest/perfil, personagens Samuel/Caio, pronto/start, clique no botão de saque e partida 0–0→6–5, vencedor A/points idêntico nos clientes; zero erros JS. Relógio acelerado 4× exclusivamente no harness, sem alterar parâmetros de produção. Guests temporários removidos. Captura de terceira pessoa inspecionada em .test-build/005-third-person.png.
- Gate T1 aprovado. Reconexão, resultado persistido e revanche são as tarefas seguintes.

## 005-T2 — Reconexão e abandono

- Relógio de espera é tempo de servidor, separado do tick congelado. Retorno em 19 s permitido, retomada após 3 s, limite 20 s por ocorrência/40 s acumulados por equipe. Ambos incompletos ao expirar cancelam sem vencedor; abandono explícito concede derrota preservando placar.
- Reautenticação restaura associação e estado da sala; cliente tenta reconectar com a mesma sessão guest e JWT atualizado. Inputs pendentes são descartados e teclas limpas. UI informa espera/contagem; alternar demonstração mantém socket conectado e partida ativa.
- Suite servidor: 19 testes passaram, incluindo retorno em 19 s, expiração 20 s, orçamento 19+19+2 s, ambos ausentes, retorno tardio e abandono. Typecheck passou.
- Edge real/Supabase real em dois contexts: socket do jogador A foi encerrado pelo harness; simulação suspendeu, cliente reconectou automaticamente, houve contagem e retomada. Alternar demonstração não parou ticks. Partida terminou 6–5 igual nos clientes, sem erros JS; guests de teste removidos.
- Gate T2 aprovado. A gravação de cancelamento exige a nova migration da tarefa T3; ela não é simulada como vitória.

## 005-T3 — Resultado persistido e retry

- Resultado vem exclusivamente do servidor; tela mostra vitória/derrota/cancelamento e estado pending/saved/failed. Payload final é copiado e imutável para retries idempotentes; fila aplica backoff até 30 s, timeout/abort por tentativa 5 s e deadline total 5 minutos. Esgotamento emite falha operacional sem fabricar sucesso ou vencedor.
- Persistência normal reutiliza RPC transacional de 001. Nova migration 202611160004_persist_cancelled_result.sql adiciona RPC restrita a service_role para status cancelled/winner null, preservando a função de partidas normais. Nunca concede seis pontos em abandono.
- Suite servidor: 22 testes passaram, incluindo falha transitória seguida de sucesso com payload idêntico, deadline virtual de 300000 ms sem sucesso falso e retry pendente após liberação da sala. Typecheck passou. Não se alega espera real de cinco minutos nesse teste de relógio injetado.
- Edge em dois contexts + Supabase real: partida 0–0→6–5 e ambos exibiram Resultado salvo após RPC real; testes também mantiveram reconexão/câmera. Guests e somente os registros da partida de teste foram removidos após verificação.
- Pendência de ambiente explícita: dry run sem escrita da RPC de cancelamento retornou PGRST202 (função ainda não aplicada). Arquivo SQL foi disponibilizado e sua aplicação solicitada ao proprietário; validação remota de cancelled deve ser feita após aplicação, sem bloquear o código/retry das demais situações. Não foi usada nenhuma técnica para executar DDL por API administrativa indevida.
- Gate de código/retry/resultado normal aprovado; deploy completo exige a migration e validação de cancelamento. Esta condição será mantida explícita na PR.

## 005-T4 — Revanche, limpeza e revisão final

- Voto idempotente por identidade; sem unanimidade mantém resultado, com unanimidade cria novo UUID/placar 0–0/countdown. Participante desconectado não fornece voto. Revisão de personagem continua fixada por partida. Limpeza remove runtime, associação, votos, estado de reconexão e resultado; sala finalizada com todos ausentes expira em 20 s. Retry pendente continua desacoplado e limitado a cinco minutos.
- Heartbeat ping/pong detecta sockets mortos; intervalo é removido no fechamento. RAF, resize, listeners de teclado, timers de feedback/retry e recursos 3D têm cleanup. Inputs em trânsito durante suspensão/finalização não deixam erro invalid_state preso na tela. Iniciar só fica habilitado quando todos estão prontos.
- Suite final: **28 testes servidor, 9 web e 15 domínio** aprovados (52), além de typecheck e build conjunto. Novos casos cobrem unanimidade, duplicação de voto, fechamento/TTL, voto ausente, save antigo após nova partida, cancelamento sem vencedor e abort de tentativa DB travada.
- Teste de produção: frontend compilado entregue pelo mesmo HTTP server do WebSocket, duas browser contexts Edge independentes, Supabase real. Login/perfis, seleção Samuel/Caio, start, reconexão, menu sem pausa, saque, partida 0–0→6–5 (A/points), Resultado salvo em ambos e revanche com novo matchId/zero pontos passaram, zero erros JS. Relógio de simulação 4× somente no harness; não é ensaio de performance. Guests e registros das partidas de teste removidos. Captura em docs/match/third-person.png.
- SQL novo validado sem credenciais em PostgreSQL/WASM PGlite: cancelamento com winner null, retry idempotente, conflito rejeitado, rollback transacional, funções antigas preservadas, permissão negada a anon/authenticated e overall 85/77 no banco. Fixture local emula service_role com BYPASSRLS; pgcrypto do ambiente hospedado não é carregado no WASM. Comando reproduzível: `node supabase/tests/database/005_match.cjs` após instalação temporária indicada no arquivo.
- Build web foi conferido para ausência da secret key: nenhum valor encontrado no bundle. Avisos de tamanho do bundle e diretivas RN Web permanecem conhecidos e não impediram o teste de produção.
- Gate de código/aceites aprovado para PR. Pendência de deploy: executar **somente** a nova migration 202611160004 no Supabase remoto antes de validar cancelamento em nuvem. Não fazer merge nem deploy automaticamente. Próxima spec após integração: 006-roster, para handlers e balanceamento de habilidades/2v2.
