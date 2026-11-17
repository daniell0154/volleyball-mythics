# Administração do elenco — operação

Aplicar as migrations pelo fluxo normal do Supabase, inicialmente em ambiente de teste. Nunca executar rollback apagando revisões publicadas referenciadas por partidas.

Criar a conta do proprietário pelo Supabase Auth com email/senha e confirmar o email. No SQL Editor autenticado como operador do banco, conferir o UUID e se a conta não é anônima; executar com o UUID real:

```sql
insert into public.roster_admins(user_id)
select id from auth.users
where id = 'UUID-REAL-DO-PROPRIETARIO'::uuid and is_anonymous = false;
```

Não promover guests. Nenhum endpoint público concede papel de admin. Para revogar, remover a linha de roster_admins; as próximas operações verificam novamente o papel. A sessão administrativa usa armazenamento separado da sessão guest. Não colocar senha ou secret/service role no frontend, arquivo versionado ou logs.

Backup/restauração e deploy continuam sujeitos ao gate da 007. Em incidente, revogar o papel e desabilitar a interface; preservar characters, rascunhos e auditoria. Reverter código somente para versão compatível com as revisões já publicadas.
