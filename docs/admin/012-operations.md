# Administração do elenco — operação

Aplicar as migrations pelo fluxo normal do Supabase, inicialmente em ambiente de teste. Nunca executar rollback apagando revisões publicadas referenciadas por partidas.

## Arquivos para aplicar

Se o banco já possui as migrations 001–004 do jogo, aplicar somente estas novas, nesta ordem:

1. supabase/migrations/202611170005_admin_roster.sql
2. supabase/migrations/202611170006_roster_api.sql

No SQL Editor é possível executar o conteúdo completo de cada arquivo, um de cada vez; não repetir migrations já aplicadas. Em banco novo, aplicar todos os arquivos de supabase/migrations em ordem. Não enviar arquivos de teste, fixtures ou conteúdo de .test-build ao Supabase.

O admin usa o mesmo projeto do jogo. Configurar VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente do frontend antes do build e no ambiente local conforme .env.example. Backend usa a mesma URL/chave pública; SUPABASE_SECRET_KEY continua exclusiva do servidor para salvar resultados e nunca recebe prefixo VITE_. Publicar frontend/backend da mesma versão após integrar a PR 012; acessar /admin.

## Conta administrativa

Criar a conta do proprietário pelo Supabase Auth com email/senha e confirmar o email. No SQL Editor autenticado como operador do banco, conferir o UUID e se a conta não é anônima; executar com o UUID real:

```sql
insert into public.roster_admins(user_id)
select id from auth.users
where id = 'UUID-REAL-DO-PROPRIETARIO'::uuid and is_anonymous = false;
```

Não promover guests. Nenhum endpoint público concede papel de admin. Para revogar, remover a linha de roster_admins; as próximas operações verificam novamente o papel. A sessão administrativa usa armazenamento separado da sessão guest. Não colocar senha ou secret/service role no frontend, arquivo versionado ou logs.

Depois de configurar: entrar em /admin com a conta real, salvar um rascunho, conferir que ele não aparece no jogo, publicar, conferir no catálogo e desativar. Confirmar também que uma conta comum não consegue executar roster_write. Esses testes remotos foram adiados pelo proprietário; o aceite local não comprova sua execução.

Backup/restauração e deploy continuam sujeitos ao gate da 007. Em incidente, revogar o papel e desabilitar a interface; preservar characters, rascunhos e auditoria. Reverter código somente para versão compatível com as revisões já publicadas.
