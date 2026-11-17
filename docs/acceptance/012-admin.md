# Aceite 012 — admin do elenco

Reprodução local, sem acesso a dados hospedados:

```powershell
npm run build
node node_modules/vite/bin/vite.js --config apps/web/vite.config.ts --host 127.0.0.1 --port 5177
# Em outro terminal:
node supabase/tests/database/012_admin.cjs
node docs/acceptance/012-admin.cjs
```

Dependências dos harnesses: Playwright em .test-build/browser e @electric-sql/pglite em .test-build/sql. Somente teste; não são dependências de produção. O ensaio carrega todas as migrations reais no PGlite, chama roster_write real, inicia RoomApplication/MatchRuntime/WebSockets compilados e abre o formulário/Lobby/preview reais no Chrome instalado.

Autenticação é substituída exclusivamente no harness local. Não comprova login email/senha ou JWT do Supabase hospedado, entrega de emails, configuração de RLS via PostgREST nem deploy. Testes SQL separados verificam papéis, RLS, escrita direta, revogação e conflitos. O teste de navegador verifica a composição de publicação, catálogo, seleção, partida e desativação; o refresh de catálogo do harness é imediato, e o polling de produção não é medido por esse ensaio.

Resultado em 012-results.json. Capturas 012-admin.png e 012-match.png. Chrome 157.0.8103.79, Windows, viewport admin 1440×1100 e partida 1280×900; sem exceções JS. Fixture criada em memória, nenhum novo personagem gravado em produção. Publicação gerou overall 56, partida fixou saque 90 e visual articulado female:1234, revisão posterior com saque 10 e desativação não alteraram a partida existente.

Para revisão interativa, iniciar Vite como acima e executar `node docs/acceptance/012-admin.cjs --serve`. Abrir http://127.0.0.1:5177/docs/acceptance/012-preview/ e usar email/senha fictícios (por exemplo admin@example.test); esse login é uma fixture, não uma conta real. `?game` abre o jogo ligado ao mesmo catálogo em memória. Encerrar o harness descarta tudo.

Para operar o admin real, aplicar migrations 005/006 e provisionar a conta conforme docs/admin/012-operations.md; abrir /admin usando configuração pública do Supabase. Não usar credenciais reais no preview de teste.

Experiência aprovada pelo proprietário, que adiou explicitamente a configuração/validação de login/RPC no Supabase para depois. Instruções em docs/admin/012-operations.md; nenhum teste remoto é inferido da aprovação. Sem evidência de Firefox/Safari ou benchmark de renderer nesta spec; não altera física, rede de inputs ou modelo inicial aprovado. Não iniciar 013 antes de integrar 012.
