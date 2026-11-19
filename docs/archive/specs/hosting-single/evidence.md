# HOST-T1 — Serviço único solicitado pelo proprietário

Problema confirmado em https://volleyball-mythics.onrender.com/: GET / retornava HTTP 200, Content-Type text/plain e somente Volleyball Mythics. Era o backend, não o frontend React. O proprietário escolheu explicitamente hospedar ambos no mesmo Web Service.

Correção: root build compila domínio/servidor/frontend; root start inicia o backend. O entry point entrega apps/web/dist com MIME correto, HEAD, cache revalidado para HTML e cache imutável para assets Vite. Não entrega dotfiles, travessia de caminhos nem symlinks fora da pasta pública. Assets ausentes respondem 404, build ausente responde 503 com orientação. /healthz fica disponível sem WebGL/Auth.

Cliente usa WebSocket same-origin em produção e mantém localhost:3001 no Vite dev. Override explícito continua disponível. Build permite usar SUPABASE_URL/PUBLISHABLE_KEY para as duas partes, copiando exclusivamente os dois valores públicos; secret key não é definida no frontend.

Verificações reais: 11 testes servidor passaram (inclui HTTP HTML, JS/MIME/cache, HEAD, arquivo ausente, método não permitido, dotfile e travessia), 6 web passaram (inclui ws/wss de produção, dev e override). npm.cmd run build passou. Permanecem avisos conhecidos de bundle grande e diretivas RN Web. Prévia adicional via npm start foi bloqueada pela política do ambiente; a rota HTTP foi comprovada pelo teste integrado em porta efêmera. O deploy remoto precisa ocorrer após merge e ajuste dos comandos no Render; nenhuma configuração remota foi alterada.

Referências: https://render.com/docs/web-services e https://render.com/docs/monorepo-support. Roteiro atualizado em docs/ONLINE_TESTING.md. Conteúdo Samuel/Caio permanece na branch separada content/initial-roster.
