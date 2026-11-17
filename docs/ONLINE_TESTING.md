# Testar o protótipo online

Esta etapa testa login guest, salas privadas, seleção e sincronização. Ainda não é uma partida completa: recepção/levantamento/ataque, pontos, resultado e reconexão com prazo serão integrados em 005-match. Desconexão durante o protótipo congela o estado; encerre ambas as sessões para descartar a sala suspensa.

## Configuração mínima

Na raiz de `volleyball-mythics`, salve um `.env` contendo somente:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

URL e publishable key estão no Connect do painel Supabase. Habilite Anonymous Sign-Ins no projeto. As migrações precisam estar aplicadas; quem já executou os SQLs não precisa repeti-los. O `.env` é ignorado pelo Git. O Vite lê somente as variáveis VITE; o backend usa as mesmas duas para autenticar e consultar o catálogo como usuário autenticado, sob RLS. Nenhuma chave secreta é necessária para este teste.

Referências: [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous).

O backend também aceita `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` quando hospedado separadamente. `SUPABASE_SECRET_KEY` será necessária para persistir resultados, não para ler catálogo nem validar guest. Nunca usar uma variável VITE para secret key.

## Iniciar os dois processos

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

Abrir `http://localhost:5173` e clicar **Salas online**. O servidor usa `ws://127.0.0.1:3001/socket`; as origens `http://localhost:5173` e `http://127.0.0.1:5173` são permitidas por padrão. Porta 5173 ocupada é erro explícito, para evitar abrir uma origem não autorizada silenciosamente. Reinicie ambos os processos depois de alterar o `.env`.

## Roteiro

1. Entrar como guest com nome de 2–24 caracteres. Conferir em Authentication que o usuário foi criado e em `profiles` que o perfil foi salvo.
2. Criar 1v1; abrir outra sessão independente (por exemplo, navegador normal + janela privada ou Edge + Chrome). Duas abas com o mesmo storage compartilham identidade e não são dois jogadores; o servidor rejeita conexão simultânea da mesma identidade.
3. Entrar pelo código ou link. Tentar terceiro participante e conferir `room_full`. Em 2v2 o quinto deve ser rejeitado. Dono saindo do lobby deve transferir propriedade ao participante restante mais antigo.
4. Se o catálogo estiver vazio, os testes acima continuam válidos, mas não é possível ficar pronto/iniciar. Os personagens e poderes finais dependem do proprietário; este protótipo não insere elenco fictício no banco remoto.
5. Com revisões habilitadas no catálogo, selecionar personagem em cada sessão, conferir equipes/posições e marcar pronto. Mudança de seleção/equipe invalida prontidão. Somente o dono inicia, com todos conectados e prontos.
6. Após contagem de três segundos, clicar na quadra: WASD move seu atleta e Espaço salta; ambos os navegadores devem ver o mesmo estado. O lado A/posição 1 usa L para sacar. Bola e movimento são decididos pelo servidor; ao atingir o chão, a bola permanece parada nesta etapa, sem pontuação.
7. Alternar janela enquanto segura movimento: a intenção deve zerar, sem tecla presa. Desconectar uma sessão durante a simulação deve congelá-la.

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

Pode manter `SUPABASE_SECRET_KEY` apenas para o backend quando a persistência de resultados for usada. A configuração Vite copia exclusivamente URL e publishable key para o frontend durante o build; nunca copia a secret key. Os nomes VITE_SUPABASE_URL/PUBLISHABLE_KEY também são aceitos e têm precedência. Não é preciso duplicar as variáveis públicas no serviço único.

Remova `VITE_GAME_SERVER_URL` do Render para que o cliente use automaticamente `wss://volleyball-mythics.onrender.com/socket`. Em produção HTTP local, usa ws na mesma origem. No desenvolvimento Vite separado, continua usando ws://127.0.0.1:3001/socket. O override VITE_GAME_SERVER_URL permanece disponível caso separe os serviços no futuro.

Faça novo deploy depois de alterar variáveis públicas: elas são incluídas no build React. Não configure PORT manualmente no Render. A URL do serviço agora deve abrir a UI, em vez do texto de health check antigo. Cadastro de convidados/salas usa Supabase; nenhuma configuração de serviço Render é alterada automaticamente por este repositório.
