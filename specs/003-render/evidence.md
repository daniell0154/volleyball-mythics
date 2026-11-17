# Evid?ncias ? 003-render

Ambiente: Windows, Node 26.13.1; depend?ncias fixadas no package-lock.

## 003-T1 ? UI e adaptador (R03)

- UI React Native Web, entrada Vite e interface SceneAdapter com update/resize/quality/dispose.
- Snapshots sint?ticos de quatro placeholders, sem imports de dom?nio, f?sica, rede ou escrita de placar. O placar fixo ? fixture, n?o resultado.
- Verifica??o: npm.cmd run typecheck passou em todos os workspaces; build Vite passou (aviso de bundle >500 kB e diretivas use client do RN Web).
- Cleanup cancela RAF, desconecta ResizeObserver e libera geometrias, materiais, renderer/contexto.
- Limita??o: sem navegador control?vel nesta sess?o; ciclo WebGL real e fallback ainda precisam de valida??o visual. Aceite de separa??o UI/adaptador aprovado por compila??o e revis?o; gate visual permanece pendente.
