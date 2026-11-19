# Roblox · execução da T2

Fontes em Luau estrito ficam em src/server. O domínio calcula em metros usando tabelas numéricas para preservar precisão. Court converte para studs e aplica origem (0, 2, 0), acima da baseplate.

Abrir Place1.rbxlx no Studio e iniciar Play abre a seleção solo. Escolher lado, dificuldade e uma das duas habilidades existentes, depois iniciar o 2v2 com três bots. O mapa reproduz as cores, o gramado, a rede e o prédio escolar do navegador. O arquivo pode ser regenerado com `node roblox/scripts/bundle.mjs` na raiz do repositório. Para sincronizar com Rojo instalado, executar `rojo serve roblox/default.project.json` e conectar pelo plugin Rojo. O pacote gerado inclui somente código de produção.

## Comparação com o domínio web

Na raiz, executar `npm.cmd run build --workspace @volleyball-mythics/domain` e `node roblox/scripts/fixtures.mjs`. O gerador usa o domínio compilado para produzir as fixtures. Cada fragmento respeita o limite de Source do Studio. Para incluí-las na sincronização de desenvolvimento, usar `rojo serve roblox/tests.project.json`.

Executar na Command Bar do servidor em Edit mode:

```lua
local tests = game.ServerStorage.MythicsParity
print(require(tests.Parity)(
    game.ServerScriptService.VolleyballMythics,
    require(tests.FixtureData)
))
```

A comparação cobre cada tick de 24 trajetórias, contatos legais e faltas, rotações, duplicatas de ponto e final 6–5 em ambos os modos. Tolerância numérica absoluta de 1e-9. Ao modificar fontes após um require, reiniciar a sessão ou recarregar os módulos para evitar o cache do Studio.

Executar também `require(game.ServerStorage.MythicsParity.SoloAcceptance)(game.ServerScriptService.VolleyballMythics)` para os cenários de partida solo e habilidades.

Controles de PC são WASD, setas ou clique na quadra para mirar, C para centralizar, espaço para pular, J para receber/bloquear, K para levantar, L para sacar/atacar e U para habilidade. No toque, usar o analógico esquerdo, arrastar na área direita para fixar a mira e os botões da HUD. No Xbox, usar analógicos, A, LT, RB, RT e LB. No PlayStation, usar analógicos, ✕, L2, R1, R2 e L1. O botão B/○ volta ao menu durante a partida.

A T2 é uma quadra solo por servidor. As próximas tarefas implementam coleção e os modos online. Os snapshots completos são confiáveis a 20 Hz; movimento e mira usam UnreliableRemoteEvent a 30 Hz. Placar e bola usam a mesma linha de tempo de apresentação. O porte mantém o intervalo de 2 s entre pontos e mostra a contagem para o saque seguinte.
