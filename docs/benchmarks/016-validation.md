# Como verificar a tela da partida (016)

Execute da raiz do repositório, no Windows. Os percursos usam o servidor da aplicação com catálogo, autenticação e persistência de teste.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd install --prefix .test-build/browser --no-save playwright
node .test-build/browser/node_modules/playwright/cli.js install chromium
```

Em dois terminais separados, inicie o servidor local e o Vite:

```powershell
node docs/acceptance/015-fixture-server.mjs
```

```powershell
.\node_modules\.bin\vite.cmd --config apps/web/vite.config.ts --host 127.0.0.1 --port 5180 --strictPort
```

Execute os percursos:

```powershell
node docs/acceptance/016-viewport.cjs
node docs/acceptance/016-journey.cjs
node docs/acceptance/016-zoom.cjs
```

Os dois primeiros usam Edge por padrão. Defina `VOLLEYBALL_BROWSER=chromium` para usar o Chromium instalado pelo Playwright. O último ajusta o zoom nativo a 200% num perfil temporário do Chrome for Testing.

## Medição e revisão

Na mesma máquina, com o Vite ainda em execução, use o renderer publicado na spec 014 como referência.

```powershell
git worktree add --detach .test-build/016-baseline 1ee43f0
node docs/benchmarks/016-render.cjs
```

O script mede 300 segundos reais por variante, sequencialmente. Ambas usam a mesma sequência de snapshots v4, quatro atletas, canvas de 1280×720, DPR 1, qualidade baixa e câmera estável. A candidata usa o renderer da 016 com a projeção ajustada às sobreposições. Os clips mostram o canvas e as capturas do replay também mostram o HUD da candidata. Compare o p95 da candidata com 33,3 ms e com o valor da referência mais 10%. Na mesma máquina e configuração, é possível medir somente a candidata com `node docs/benchmarks/016-render.cjs .test-build/016-reference.json`.

Para revisão visual, veja a [referência da 014](016-baseline.png), o [replay na 016](016-candidate.png), a [partida em 720p](../acceptance/016-match.png) e a [partida em zoom nativo de 200%](../acceptance/016-zoom.png). No ambiente local, revise legibilidade da bola, controles, placar e resultado em 720p, 1080p e zoom. Os resultados são específicos do equipamento, navegador e replay registrados no relatório.
