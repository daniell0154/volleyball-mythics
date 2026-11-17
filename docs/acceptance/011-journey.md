# Aceite do percurso — 011-T4

## Reprodução

Instalar Playwright 1.65.1 em `.test-build/browser` com `npm install --prefix .test-build/browser --no-package-lock playwright@1.65.1` (dependência apenas do harness), executar `npm run build`, iniciar os dois processos abaixo em terminais separados e executar o ensaio:

```powershell
node docs/acceptance/011-fixture-server.mjs
node node_modules/vite/bin/vite.js --config apps/web/vite.config.ts --host 127.0.0.1 --port 5176
node docs/acceptance/011-journey.cjs
node docs/acceptance/011-zoom.cjs
```

O gateway guest, os cinco personagens e a persistência sem banco existem somente no harness. A aplicação de salas, transporte WebSocket, simulação e ciclo de revanche são os módulos reais compilados do servidor. Nenhuma fixture entra no catálogo publicado. O teste não valida Supabase remoto.

O ensaio usa Tab para alcançar controles, Enter para ativá-los, Espaço para checkbox, Home/End para volume e L para sacar. Não usa clique, `focus()` programático nem alteração de placar. Depois de um saque aceito, os participantes permanecem inativos: os timeouts autoritativos de saque encerram a partida por seis pontos. Isso verifica o percurso, sem alegar playtest humano de rally. A revanche exige todos os votos, outro matchId e placar zero.

O relatório gerado é `011-journey-results.json`. Capturas `011-1v1-lobby.png`, `011-1v1-result.png`, `011-2v2-zoom-lobby.png`, `011-2v2-zoom-result.png` e `011-webgl-fallback.png` são renovadas durante a execução (o último navegador executado prevalece).

## Ambiente e limites da medição

Windows 11, kernel 10.0.26200; Intel Core i7-1185G7; 16 GiB RAM. Navegadores desktop instalados, executados headless pelo Playwright. Qualidade baixa, alternância alta/baixa exercitada, câmera estável habilitada pelo teclado. Não é benchmark de GPU nem substitui os orçamentos de desempenho das specs 008–010.

O cenário 1v1 usa 1440×1100 CSS px e DPR 1. O cenário 2v2 usa 720×550 CSS px e DPR 2: layout equivalente ao conteúdo disponível em uma janela 1440×1100 com zoom de 200%. Verifica ausência de overflow horizontal nos estados de entrada, lobby, partida, resultado e revanche.

Adicionalmente, `011-zoom.cjs` configura 200% pela página nativa de configurações do Chrome em perfil isolado. Entrada/catálogo com nome longo passaram: janela externa 1440 px, viewport 709 CSS px, DPR 2 e scrollWidth 709 px. Relatório `011-zoom-results.json` e captura `011-zoom-native-chrome.png`. A diferença para 720 vem da barra de rolagem. Não altera preferências do perfil pessoal. No Edge, o controle da página interna não ficou acessível à automação; zoom nativo permanece manual. O percurso completo usa o layout equivalente nos dois browsers.

Contraste calculado por luminância relativa sRGB dos textos HTML visíveis e habilitados, a partir dos estilos computados. Nos painéis com gradiente, usa o pior dos extremos opacos. Exige 4,5:1 inclusive para títulos; controles desabilitados são excluídos. Não mede pixels antialiasados, texto dentro do canvas nem constitui auditoria completa de acessibilidade. Foco visível vem da regra CSS de outline de 3 px; os controles são alcançados por navegação sequencial real.

Áudio: observa chamadas reais ao grafo Web Audio, ganho 0,08 em 100% e ausência de nova geração de sinal após um ponto com volume zero. Headless usa saída silenciada: não comprova som nos alto-falantes.

Fallback: bloqueia somente contextos WebGL no navegador de teste. Confere mensagem no preview, ficha/navegação preservadas, diagnóstico na partida, ações desabilitadas e saída pelo teclado. Não equivale a testar todas as falhas possíveis de driver.

## Matriz executada em 2026-11-17

| Navegador | Versão | Resultado real |
| --- | --- | --- |
| Chrome Windows | 157.0.8103.79 | Percurso completo 1v1 e 2v2 por teclado, resultado 6×5, revanche com novo ID/zero pontos, catálogo com cinco entradas/nome longo, áudio no grafo, contraste e fallback WebGL passaram. Entrada/catálogo em zoom nativo 200% também passaram. |
| Edge Windows | 157.0.4341.60 | Mesmos percursos 1v1/2v2 e fallback passaram. Layout equivalente 200% passou; zoom nativo pendente. |
| Firefox | — | Não instalado; não executado. |
| Safari | — | Indisponível neste Windows; não executado. |

Os quatro percursos terminaram sem exceções JavaScript. Menor contraste HTML observado 8,13:1, com mínimo 8,78:1 no HUD/opções e na revanche; todos acima de 4,5:1 no escopo medido. Resultado completo em `011-journey-results.json`. Estes são resultados de automação, sem aprovação visual inferida.

## Pendências do aceite

- Firefox não instalado: sem versão ou execução local a registrar.
- Safari indisponível neste Windows: requer macOS; WebKit de automação não seria evidência de Safari instalado.
- Zoom nativo 200% no Edge/percurso completo com zoom nativo, saída audível e revisão visual do proprietário permanecem pendentes.
- Não foram repetidos benchmark de cinco minutos, carga de quinze minutos ou ensaio de reconexão das specs anteriores; a T4 não altera física, rede ou renderer.

O gate da T4 permanece aberto até aprovação visual e resolução explícita dos aceites pendentes. Não há autorização implícita para dispensar critérios nem para fazer merge ou deploy.
