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
