# Evid?ncias ? 003-render

Ambiente: Windows, Node 26.13.1; depend?ncias fixadas no package-lock.

## 003-T1 ? UI e adaptador (R03)

- UI React Native Web, entrada Vite e interface SceneAdapter com update/resize/quality/dispose.
- Snapshots sint?ticos de quatro placeholders, sem imports de dom?nio, f?sica, rede ou escrita de placar. O placar fixo ? fixture, n?o resultado.
- Verifica??o: npm.cmd run typecheck passou em todos os workspaces; build Vite passou (aviso de bundle >500 kB e diretivas use client do RN Web).
- Cleanup cancela RAF, desconecta ResizeObserver e libera geometrias, materiais, renderer/contexto.
- Limita??o: sem navegador control?vel nesta sess?o; ciclo WebGL real e fallback ainda precisam de valida??o visual. Aceite de separa??o UI/adaptador aprovado por compila??o e revis?o; gate visual permanece pendente.

## 003-T2 ? Quadra e c?mera (R03; parcial)

- Geometria Three.js em metros: quadra 9 ? 18, linhas inclusivas, rede a 2,43 m, pr?dio escolar e c?u. Placeholders n?o representam personagens finais.
- Decora??o existe somente no renderer e n?o pode alterar colis?es do dom?nio.
- npm.cmd run test --workspace @volleyball-mythics/web: 1 teste passou. Proje??o matem?tica enquadra extremos da quadra at? 6,11 m de altura em 1280?720, 1920?1080 e 390?844; amostra 120 segundos de rally sint?tico com quatro atletas. N?o ? benchmark nem ensaio visual.
- Gate: pendente. N?o existe ferramenta de navegador nesta sess?o; faltam inspe??o visual do rally, troca/recria??o de cena e confirma??o de libera??o de recursos WebGL reais. T2 continua desmarcada e T3/T4 n?o foram iniciadas por depend?ncia.

## Reprodu??o e pr?ximos aceites

1. npm.cmd ci; npm.cmd run dev --workspace @volleyball-mythics/web. Abrir a URL local indicada pelo Vite.
2. Conferir quadra inteira, bola, escola, c?u e quatro placeholders. Redimensionar janela, alternar qualidade e recriar cena repetidamente; inspecionar recursos/contextos no navegador.
3. Aprovar T2 antes de implementar entrada T3; instru??es de teclado na UI s?o o mapeamento planejado, ainda sem listeners.
4. T4 exige hardware, GPU, SO, navegador/vers?o, resolu??o 1280?720 e qualidade registrados; medir 5 minutos vis?veis com quatro atletas, p95 <=33,3 ms (60 fps alvo). N?o usar este teste matem?tico como evid?ncia de desempenho.
5. F?sica v1 permanece sem calibra??o: 60 Hz, gravidade 9,81, raio 0,11 m e rede 2,43 m; trajet?ria sint?tica ? exclusivamente visual. N?o iniciar 004-online nem arte final enquanto o gate 003 estiver pendente.

Verifica??o de regress?o final: 15/15 testes do dom?nio passaram; typecheck de todos os workspaces e build web passaram. Build ainda emite avisos de diretivas use client do RN Web e tamanho do bundle (~840 kB antes de gzip).
