# Criar o banco Volleyball Mythics no Supabase

Este repositório contém as migrações SQL; elas criam as tabelas quando aplicadas ao projeto Supabase. O código não cria nem acessa um projeto online automaticamente.

## Criar as tabelas pelo painel web

1. Crie um projeto no [Supabase Dashboard](https://supabase.com/dashboard) e guarde a senha do banco em local seguro.
2. Abra **SQL Editor → New query** no projeto.
3. Abra em ordem todos os arquivos `supabase/migrations/*.sql`, copie o conteúdo do primeiro e execute no SQL Editor; repita para cada migration seguinte. O SQL Editor não registra automaticamente os arquivos no histórico CLI, então não misture o fluxo manual com `supabase db push` sem reconciliar a tabela `supabase_migrations.schema_migrations`.
4. Em **Authentication → Sign In / Providers**, habilite **Allow anonymous sign-ins**. A configuração local correspondente está em `supabase/config.toml`.
5. Em **Table Editor**, confirme `profiles`, `characters`, `matches` e `match_players`. As quatro tabelas têm RLS habilitada.
6. Não cadastre personagens fictícios como conteúdo final. A tabela `characters` permanece vazia até o proprietário fornecer o elenco. Os visitantes guest podem então consultar somente personagens habilitados.

## Alternativa pela Supabase CLI

Instale a CLI, autentique com `supabase login`, vincule o projeto com `supabase link --project-ref SEU_PROJECT_REF` e aplique as migrações com `supabase db push`. O histórico local de migrações precisa coincidir com o remoto; em um projeto existente, confira o estado antes de aplicar.

## Chaves e segurança

Para a aplicação web use Project URL e publishable key, configuradas como `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no `.env` da raiz. Essas duas variáveis bastam para testar login e salas; o backend também lê o catálogo como guest autenticado sob RLS. Nunca coloque `service_role`/secret key no bundle web, no Git ou em mensagens. A escrita futura de partidas ficará no servidor e exigirá secret key. Sem personagens cadastrados, o seletor de elenco não terá conteúdo para iniciar uma partida. Veja [o roteiro online](ONLINE_TESTING.md) para iniciar os dois processos e testar sessões independentes.

O nome de exibição guest será escolhido pelo cliente; o perfil deve ser inserido com `user_id` retornado pelo Auth. A sessão anônima é armazenada no navegador pelo cliente Supabase e persiste em reload enquanto os dados do site não forem apagados. Não equivale a uma conta recuperável entre dispositivos.

## Esquema inicial

- `profiles`: identidade autenticada e nome público.
- `characters`: revisões imutáveis do elenco, atributos e configuração da habilidade; `overall` é calculado no banco pela média arredondada dos sete atributos.
- `matches`: modo, estado, placar até 6, vencedor, motivo e versão de regras.
- `match_players`: participantes, equipe/posição e revisão do personagem usado.

As migrations deste repositório são a fonte versionada do esquema. Não edite as tabelas manualmente sem criar uma migration correspondente. O ambiente de desenvolvimento local pode usar `npx supabase start`; esse comando requer Docker Desktop ativo e baixa as imagens dos serviços.
