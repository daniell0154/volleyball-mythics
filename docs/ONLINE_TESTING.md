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

## Hospedagem posterior

Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_GAME_SERVER_URL=wss://SEU_SERVIDOR/socket`.

Backend: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGINS=https://SEU_SITE` e porta da hospedagem em `PORT`. A escrita de resultados futura exigirá `SUPABASE_SECRET_KEY`. Localmente o servidor escuta em 127.0.0.1; no Render detecta RENDER e usa 0.0.0.0 com a PORT fornecida. HOST permite override explícito. Nenhuma hospedagem foi criada por esta implementação.

No Render, criar Web Service Node para o backend, Root Directory vazio, Build Command `npm ci --include=dev && npm run build --workspace @volleyball-mythics/server` e Start Command `npm run start --workspace @volleyball-mythics/server`. O monorepo precisa da raiz para acessar packages/domain e packages/protocol. Usar uma única instância enquanto salas e partidas estiverem em memória. O frontend pode ser Static Site, também com Root Directory vazio, Build Command `npm ci --include=dev && npm run build --workspace @volleyball-mythics/web` e Publish Directory `apps/web/dist`. Configurar os endereços públicos no frontend/backend e reconstruir o frontend após alterar variáveis VITE.
