# Roblox · execução da T1

Fontes em Luau estrito ficam em src/server. O domínio calcula em metros usando tabelas numéricas para preservar precisão. Court converte para studs e aplica origem (0, 2, 0), acima da baseplate.

Abrir Place1.rbxlx no Studio e iniciar Play constrói a quadra. O arquivo pode ser regenerado com `node roblox/scripts/bundle.mjs` na raiz do repositório. Para sincronizar com Rojo instalado, executar `rojo serve roblox/default.project.json` e conectar pelo plugin Rojo. O pacote gerado inclui somente código de produção.

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

O estado desta tarefa contém a quadra e o domínio. O runtime interativo, bots e HUD entram na T2.
