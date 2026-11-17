# Testar partida online 1v1

Esta etapa integra login guest, salas, câmera em terceira pessoa, controles e partida 1v1 até seis pontos, resultado, reconexão e revanche. Salas 2v2 permanecem disponíveis para desenvolvimento; balanceamento e habilidades especiais ficam para a spec 006. Samuel e Caio já foram cadastrados pelo pedido do proprietário; seus efeitos especiais ainda não estão ativos.

## Configuração mínima

Na raiz de `volleyball-mythics`, salve um `.env`:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

URL e publishable key estão no Connect do painel Supabase. Habilite Anonymous Sign-Ins. A secret key é usada apenas pelo backend para persistir resultados; sem ela a partida funciona, mas o salvamento fica pendente e falha após cinco minutos. O `.env` é ignorado pelo Git. O frontend recebe somente URL/chave pública; o servidor lê o catálogo como usuário autenticado sob RLS.

As migrações 001/002 são o esquema/RPC de resultado normal. A 003 registra o elenco inicial; quem já recebeu o cadastro pelo script não precisa recadastrá-lo. A nova 004 adiciona resultado de cancelamento sem vencedor: executar `supabase/migrations/202611160004_persist_cancelled_result.sql` no SQL Editor antes de testar ambos desconectados na nuvem. Não reexecutar migrations antigas nem misturar aplicação manual e CLI sem reconciliar histórico (ver SUPABASE_SETUP.md).

Referências: [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous).

O backend/build único também aceita `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. A secret key não é necessária para ler catálogo nem validar guest. Nunca usar uma variável VITE para secret key.

## Iniciar os dois processos

Para testar o build completo em um único processo, na raiz:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Abrir `http://localhost:3001`. Se definir ALLOWED_ORIGINS manualmente, inclua essa origem sem barra final. Como alternativa para desenvolvimento com recarga automática, use os dois terminais abaixo.

Terminal 1, na raiz:

```powershell
npm.cmd ci
npm.cmd run build --workspace @volleyball-mythics/server
npm.cmd run start --workspace @volleyball-mythics/server
```

Terminal 2, na mesma pasta:

```powershell
npm.cmd run dev --workspace @volleyball-mythics/web
```

Abrir `http://localhost:5173`: a tela inicial já é o lobby. O servidor usa `ws://127.0.0.1:3001/socket`; as origens de Vite e serviço único local são permitidas por padrão quando ALLOWED_ORIGINS não está definido. Porta 5173 ocupada é erro explícito. Reinicie ambos os processos depois de alterar o `.env`.

## Roteiro

1. Entrar como guest com nome de 2–24 caracteres. Conferir em Authentication que o usuário foi criado e em `profiles` que o perfil foi salvo.
2. Criar 1v1; abrir outra sessão independente (por exemplo, navegador normal + janela privada ou Edge + Chrome). Duas abas com o mesmo storage compartilham identidade e não são dois jogadores; o servidor rejeita conexão simultânea da mesma identidade.
3. Entrar pelo código ou link. Tentar terceiro participante e conferir `room_full`. Em 2v2 o quinto deve ser rejeitado. Dono saindo do lobby deve transferir propriedade ao participante restante mais antigo.
4. Se o catálogo estiver vazio, os testes acima continuam válidos, mas não é possível ficar pronto/iniciar. Os personagens e poderes finais dependem do proprietário; este protótipo não insere elenco fictício no banco remoto.
5. Com revisões habilitadas no catálogo, selecionar personagem em cada sessão, conferir equipes/posições e marcar pronto. Mudança de seleção/equipe invalida prontidão. Somente o dono inicia, com todos conectados e prontos.
6. Após contagem de três segundos, clicar na quadra: WASD move em relação à câmera e Espaço salta. O sacador indicado usa L ou botão Sacar. J recebe/bloqueia, K levanta, L ataca em rally. Os botões executam as mesmas intenções; é preciso estar ao alcance da bola. A câmera acompanha seu personagem por trás.
7. Completar rallies: chão resolve ponto, o vencedor do ponto saca e o primeiro lado a seis vence sem vantagem de dois. Conferir mesmo placar/vencedor e Resultado salvo nas duas sessões. Um clique sem alcance informa para aproximar da bola; não é falha do botão.
8. Interromper conexão de uma sessão: partida suspende e cliente tenta retornar com o mesmo guest; retorno até 19 s permite contagem de 3 s e retomada. Após 20 s perde por desconexão; tempo acumulado de espera é no máximo 40 s por equipe. Ambos incompletos ao expirar cancelam sem vencedor. Abandonar partida concede derrota com placar preservado.
9. Abrir a demonstração não fecha socket nem pausa partida. Blur limpa teclas. Após resultado, um voto de revanche mantém a tela; unanimidade abre novo matchId, placar zero e contagem. Sair da sala libera a associação; sala finalizada com todos ausentes expira após 20 s. Retry pendente de resultado continua, desacoplado da sala, por no máximo cinco minutos.

Envie apenas resultados e mensagens de erro, sem valores de chaves ou tokens. Um erro `unauthorized` pode indicar guest desabilitado, token expirado ou falha na leitura de catálogo; confira as duas variáveis, migrações e RLS. O catálogo é relido em cada conexão autenticada, portanto reconecte após adicionar revisões.

## Render com um único Web Service

O Web Service Node serve `apps/web/dist`, os assets e `/socket` na mesma porta. Não é necessário criar Static Site. A rota `/healthz` responde `ok`. O bind continua em 0.0.0.0 no Render com a PORT fornecida; localmente usa loopback.

Configuração do serviço existente:

- Branch: `main` após merge da correção de serviço único.
- Root Directory: vazio (raiz do monorepo).
- Build Command: `npm ci --include=dev && npm run build`.
- Start Command: `npm start`.
- Health Check Path: `/healthz`.
- Usar uma única instância enquanto salas/partidas estiverem em memória.

Variáveis no Render:

```dotenv
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ALLOWED_ORIGINS=https://volleyball-mythics.onrender.com
```

Configure `SUPABASE_SECRET_KEY` apenas para o backend salvar os resultados. A configuração Vite copia exclusivamente URL e publishable key para o frontend durante o build; nunca copia a secret key. Os nomes VITE_SUPABASE_URL/PUBLISHABLE_KEY também são aceitos e têm precedência. Não é preciso duplicar as variáveis públicas no serviço único.

Remova `VITE_GAME_SERVER_URL` do Render para que o cliente use automaticamente `wss://volleyball-mythics.onrender.com/socket`. Em produção HTTP local, usa ws na mesma origem. No desenvolvimento Vite separado, continua usando ws://127.0.0.1:3001/socket. O override VITE_GAME_SERVER_URL permanece disponível caso separe os serviços no futuro.

Faça novo deploy depois de alterar variáveis públicas: elas são incluídas no build React. Não configure PORT manualmente no Render. A URL do serviço agora deve abrir a UI, em vez do texto de health check antigo. Cadastro de convidados/salas usa Supabase; nenhuma configuração de serviço Render é alterada automaticamente por este repositório.
