# Evidências — 004-online

Dependências 001/002 integradas; 003 integrada por merge da PR #4, commit 792450d. Ambiente Windows, Node 26.13.1.

## 004-T1 — Autenticação e envelope (R04)

- Transporte WebSocket em `/socket`, allowlist de Origin, handshake auth v1 no primeiro frame (token fora de URL/logs), prazo de cinco segundos, payload máximo 8 KiB, encerramento por expiração e uma sessão por identidade.
- Verificador de produção usa Supabase getClaims (assinatura/expiração) e getUser (Auth remoto). Nenhum token é tratado como identidade sem validação. Contrato do handshake registrado em contracts.md.
- Validação estrita rejeita campos de autoridade, ações desconhecidas, tipos incorretos, números fora dos limites e versões incompatíveis. Limites por sessão: 60 inputs/s, 10 comandos/s; slow consumer fecha com backpressure >64 KiB.
- `npm.cmd run test --workspace @volleyball-mythics/server`: 5 testes de contrato/transporte em sockets reais, com verificador injetado: token inválido, identidade expirada, comando sem autenticação, frame excessivo, identidade autenticada e limite de comandos.
- Verificação inicial com Auth injetado; a integração posterior com assinatura real, guests, perfis e catálogo remoto foi executada e está registrada ao final deste documento. Nenhum segredo foi versionado ou exibido.
- Gate de transporte aprovado.

## 004-T2 — Salas privadas (R04)

- Registro em memória com UUID, código aleatório de seis caracteres e associação única por identidade autenticada. Código de query `?room=CODE` e código digitado resolvem a mesma sala. Admissão síncrona, sem await entre capacidade e inserção.
- Lotação 2/4, slots únicos por equipe; entrada/saída invalida prontidão; dono que sai transfere ao membro restante mais antigo e sala vazia expira.
- Testes: seis tentativas concorrentes em cada modo preservam lotação; código extraído do link resolve a sala; transferência de dono e expiração de código verificadas.
- Gate local aprovado; nenhum serviço remoto necessário para o registro de salas.

## 004-T3 — Seleção, equipes e prontidão (R04)

- Servidor carrega somente personagens habilitados e revisões existentes do catálogo Supabase; não cria elenco. Seleção e mudança de posição invalidam prontidão; slots ocupados/fora da capacidade são rejeitados. Start exige dono, lotação completa, conexão, personagem e prontidão de todos.
- Lobby web com login guest, perfil, criar/entrar, convite, elenco versionado, equipes, pronto e start; comandos são validados pelo servidor. Identidade deriva do handshake, nunca de payload de jogo.
- Vite lê `.env` da raiz; somente variáveis VITE são expostas ao cliente. Entry point do servidor valida tokens com o Auth. Por solicitação do proprietário, o nome público é VITE_SUPABASE_PUBLISHABLE_KEY; a leitura do catálogo foi ajustada para usar o token do guest sob RLS, sem exigir secret key nesta etapa. Nenhuma credencial de produção foi lida nesta implementação.
- Teste de aplicação cobre versão inválida, slot ocupado, start por não dono, alteração invalidando ready e início somente com todos prontos. Suite servidor: 8 testes aprovados; typecheck de todos os workspaces aprovado.
- Aceite das regras de seleção aprovado com catálogo de teste injetado. Integração real de login guest, perfis e leitura do catálogo aprovada conforme registro abaixo. O catálogo remoto vazio permite testar salas, mas bloqueia prontidão/início conforme o contrato; nenhum personagem fictício foi inserido no banco remoto.

## 004-T4 — Inputs e snapshots (R04)

- Relógio autoritativo com passo fixo 1/60 s e snapshot a cada três ticks (20 Hz). Payload inclui tick, fase, score, serverTime, lastProcessedSeq, atletas, bola e cooldowns. Intenções são vinculadas à identidade autenticada e à associação à sala; seq antigo/repetido não é aplicado. Movimento stale zera após 15 ticks sem novo input.
- Cliente transmite até 50 inputs/s, abaixo do limite 60/s, e interpola visualmente 100 ms sem extrapolação de resultados. Sem cálculos de ponto na UI. Teclado limpa no blur; qualidade e recursos de cena mantêm cleanup do spike.
- Teste integrado de sockets reais: dois usuários criam/entram, selecionam fixture local, ficam prontos, somente dono inicia; terceiro é rejeitado, três segundos produzem 180 ticks e 60 snapshots por membro, nenhum snapshot chega ao terceiro; seq 2 seguido de seq 1 aplica apenas 2; atleta B não é movido pelo input de A; saque muda fase e desconexão suspende.
- Teste de relógio puro comprova 60 ticks e 20 snapshots por segundo; teste cliente comprova interpolação 100 ms com offset de relógio, descarte de tick antigo e ausência de extrapolação.
- `npm.cmd run test --workspace @volleyball-mythics/server`: 10/10 passaram. `npm.cmd run test --workspace @volleyball-mythics/web`: 5/5 passaram. Typecheck dos workspaces e build web passaram; build continua com avisos de tamanho de bundle/diretivas RN Web.
- Entry point aceita PORT da hospedagem e bind 0.0.0.0 no Render; defaults locais permanecem em loopback. Docs de teste e configuração em `docs/ONLINE_TESTING.md`. Nenhum serviço Render foi criado por esta implementação.

## Integração com Supabase real e navegador

- Proprietário informou aplicação manual das migrations e configurou `.env` local em 2026-11-16. Foram lidos somente em memória os valores necessários; arquivo ignorado pelo Git.
- Teste técnico real: duas sessões guest, perfis salvos, getClaims/getUser reais, leitura de catálogo sob RLS, autenticação dos dois sockets, criação/entrada/saída de sala: aprovado. Os dois guests temporários foram removidos. Uma tentativa inicial teve erro no import do harness de teste (ws 7 resolvido na raiz); o harness foi corrigido antes de repetir com sucesso; seus dois guests também foram removidos.
- Edge 157 headless, duas browser contexts independentes, UI real + Supabase real + servidor Node real: login, perfil, criar/entrar por código, dois participantes visíveis, transferência de dono e saída passaram; zero erros JavaScript. Os dois guests temporários desse ensaio foram removidos ao final.
- Catálogo remoto retornou zero revisões habilitadas. Start bloqueado corretamente na UI real. A parte de seleção/start/simulação foi comprovada com fixtures exclusivamente em testes locais; precisa de elenco do proprietário para reprodução completa na nuvem.
- Gate 004 aprovado para revisão/integração. Após merge, próxima spec elegível: 005-match. Pontuação, resolução de rally, resultado persistido e reconexão com janela temporal não pertencem a esta entrega; desconexão ativa congela o protótipo e sala é descartada quando todos saem. Não declarar partida completa online ou lançamento pronto.
