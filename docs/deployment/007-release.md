# Preparação de entrega — 007-T4

Este roteiro prepara um ensaio de staging. Ele não executa deploy, altera projetos Supabase nem cria recursos cobrados.

## Ambientes e configuração

- **Local:** `.env` na raiz para `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`; guest auth precisa estar habilitado no projeto Supabase de desenvolvimento.
- **Staging:** projeto Supabase e serviço Node separados de produção; frontend e servidor apontam ao mesmo projeto de staging. Registrar região, URLs, versão/commit e responsável pelo ensaio.
- **Produção:** somente após gates de UX, browsers, conteúdo e staging. Não reutilizar credenciais nem banco do staging.
- Chaves `service_role`/secret são server-only. Nunca usar prefixo `VITE_` nelas, incluí-las no bundle, Git, logs ou relatórios. Preferir secret manager do provedor e rotação após exposição.

## Ordem de migrations

Arquivos são aplicados em ordem pelo prefixo `202611160001` a `202611160004`: esquema/RLS, gravação de resultados normais, elenco inicial e resultados cancelados sem vencedor. Antes do ensaio, comparar `supabase_migrations.schema_migrations` com os arquivos; este projeto já teve instruções de aplicação manual via SQL Editor, então não misturar SQL manual e `supabase db push` até reconciliar o histórico.

1. Fazer backup do banco de staging e registrar o identificador/horário.
2. Aplicar apenas migrations ainda ausentes, em ordem, primeiro em staging.
3. Confirmar RLS, constraints e funções com `supabase/tests/database/005_match.cjs` e validar cadastro/readback de Samuel/Caio com `node scripts/roster.mjs check`.
4. Executar smoke de guest, lobby, partida, persistência de resultado e shutdown cancelado conforme `docs/ONLINE_TESTING.md`.
5. Guardar commit, logs sem segredos, versão de migration, backup e resultados; só então agendar decisão separada de publicação.

## Rollback e restauração

As migrations alteram esquema e políticas; não há migrations reversas revisadas. Em falha, interromper novos deploys e escritas, preservar logs, restaurar o backup verificado em um projeto de recuperação/staging e apontar o serviço de staging para ele. Não apagar tabelas nem executar SQL reverso improvisado. Corrigir com migration aditiva revisada, testar de novo e registrar a decisão. Para restauração, validar a cópia em projeto isolado antes de trocar qualquer endpoint; manter o projeto original disponível até confirmar contagens, RLS e persistência.

## Ensaio de staging — ainda não executado

Pré-condições: projeto de staging identificado, acesso ao dashboard/CLI, backup restaurável, variáveis configuradas no secret manager, domínio/URL de teste e janela autorizada. Registrar abaixo os dados quando o ensaio for autorizado:

| Campo | Registro |
| --- | --- |
| Commit e branch | pendente |
| Projeto/região Supabase de staging | pendente |
| Backup e restauração verificada | pendente |
| Migrations aplicadas e histórico reconciliado | pendente |
| Smoke de login, lobby, 1v1/2v2 e persistência | pendente |
| Rollback/retorno testado | pendente |
| Responsável, horário e resultado | pendente |

O ensaio fica pendente até todos os campos terem evidência real. Nenhum recurso foi publicado ou criado por este roteiro.
