# 010-T4 — Playtest e critérios humanos

O perfil foi implementado e comparado em fixtures, e o proprietário aprovou a melhoria de jogabilidade. A coleta humana ampliada abaixo foi dispensada explicitamente como requisito de conclusão da 010. A ferramenta e as metas ficam disponíveis para investigação opcional futura; testes automatizados não são amostras humanas.

## Ferramenta local sem banco

Na raiz, em dois terminais:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5176 --strictPort
```

```powershell
npm.cmd run build --workspace @volleyball-mythics/server
node docs/benchmarks/010-playtest.mjs 3
```

Abrir http://127.0.0.1:5176/docs/benchmarks/playtest/. A ferramenta reutiliza MatchRuntime, RoomApplication, reconexão e OnlineMatch, com Samuel/Caio e seus dados reais do catálogo versionado no repositório. Não usa Supabase nem salva partidas em banco; autenticação de fixture vale somente nesta ferramenta, que por padrão escuta loopback. Não é uma alternativa de autenticação para produção.

1. Duas sessões para 1v1, quatro para 2v2. Não é possível iniciar sozinho; não há bots. Cada participante precisa de sua sessão de navegador.
2. Um participante cria a sala e compartilha código; os demais entram pelo código. Todos escolhem personagem e **depois** marcam Pronto. Mudar personagem invalida a prontidão de todos.
3. Iniciar pela sessão do criador; foco na quadra, WASD e Espaço/J/K/L/U ou botões. Intenção local diz “solicitado”; contato real vem do servidor.
4. Na mesma aba coletora, acumular 20 rallies por modo, usando revanche e saída/troca de modo. Não recarregar antes de exportar; os dados são apenas de sessão e limitados às últimas 60 amostras.
5. Preencher experiência dos participantes e opinião sobre diversão/previsibilidade; clicar Exportar métricas. Não declarar “familiarizados” se ainda estiverem aprendendo.

## Participantes em computadores da mesma rede

Se o teste for numa rede local privada, configurar explicitamente o IP do computador servidor. Exemplo a adaptar (192.168.0.100 é ilustrativo):

```powershell
node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5176 --strictPort
```

No terminal do servidor de playtest:

```powershell
$env:PLAYTEST_HOST='0.0.0.0'
$env:PLAYTEST_ORIGINS='http://192.168.0.100:5176'
node docs/benchmarks/010-playtest.mjs 3
```

Os participantes abrem http://192.168.0.100:5176/docs/benchmarks/playtest/ em seus computadores. Esse modo LAN é opcional e não foi exercitado no ensaio loopback; depende da conectividade/firewall local. A ferramenta não deve ser publicada como serviço de produção.

## Relatório e aceite

```powershell
node docs/benchmarks/010-human-summary.mjs CAMINHO/010-playtest-human.json
```

Para uma investigação quantitativa completa, o resumo exige experiência/opinião e 20 rallies por modo no perfil 3; --partial aceita relatório incompleto sem declarar meta atingida. Meta proposta: pelo menos 70% dos saques legais devolvidos e mediana de três contatos legais após saque. Timeout sem saque é contado separadamente, não melhora artificialmente o denominador. Essa coleta não bloqueia o aceite da 010, conforme dispensa do proprietário.

Para comparar manualmente com o legado, usar o mesmo comando do servidor com argumento 1 e arquivo separado. Na aplicação normal com Supabase, a opção equivalente é RALLY_RULES_VERSION e logging agregado RALLY_TELEMETRY=1.

Smoke automatizado: node docs/benchmarks/010-playtest-smoke.cjs, com Playwright sob .test-build/browser, verifica duas/quatro sessões, prontidão, saque e ponto/métrica. As sessões automatizadas são fechadas e não constituem dados humanos exportados.
