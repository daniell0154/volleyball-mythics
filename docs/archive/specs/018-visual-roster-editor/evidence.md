# Evidências — 018

## 018-T1 — Contrato visual

A 012 está integrada pelo merge `a04aadb`. A branch parte da `origin/main` no merge `d3f0f2d` da 017. A referência local orientou a composição em três painéis e a separação das seleções de pele e cabelo.

No Windows, executei `appearance` do renderer atual para os dois personagens do catálogo e para a seed feminina 12 em v1 e athletic-v2. Cruzei o resultado com o manifesto e verifiquei a variante longa nas duas geometrias. A chave mais longa tem 65 caracteres, contra o limite 160 de `CharacterCatalogRevisions`; catálogo e snapshot têm o mesmo campo textual. A ficha atual reescreve v1 ao abrir uma revisão publicada, caso coberto na T2. Gate T1 aprovado com o [contrato](../../../../specs/contracts/018-visual-roster-editor.md).

## 018-T2 — Persistência e compatibilidade

`npm.cmd run test --workspace @volleyball-mythics/web` passou 31 testes no Windows com Node 26.13.1. O resolvedor compara a geometria e os materiais das chaves legadas e suas aparências explícitas, incluindo ambas as entradas do manifesto original. A especificação do modelo, a cor do cabelo e o detalhe gerado pela seed são preservados ao editar apenas a pele. Um campo de aparência que já contém a escolha selecionada preserva a chave literal.

`node supabase/tests/database/012_admin.cjs` passou com PGlite e todas as migrations, inclusive a 008. O RPC publicou uma chave v1 com zeros à esquerda e uma visual-v3 no mesmo atleta com avanço de revisão. A revisão anterior manteve a própria chave. Seeds fora do intervalo e IDs desconhecidos foram rejeitados junto com tipos inválidos. O ensaio também verificou as garantias de autorização, concorrência e auditoria da 012. Validação local em banco de teste. Gate T2 aprovado.

## 018-T3 — Editor e prévia

Com Vite na porta 5177 e `node docs/acceptance/012-admin.cjs --serve`, executei `node docs/acceptance/018-admin.cjs` no Edge 157.0.4341.60, Windows. O ensaio confirmou painel de elenco, ficha e prévia na mesma linha, histórico acessível, cancelamento e descarte de alteração, sincronização do slider com o campo numérico e overall 56 para o conjunto de teste. A galeria exibiu oito miniaturas geradas pelo resolvedor de avatares. A prévia girou por arraste, por teclado e pelo botão Frente, preservou o ângulo após trocar pele e cabelo e manteve um único canvas. Sem WebGL, o resumo textual refletiu a pele selecionada e o formulário continuou editável. Gate T3 aprovado.

A revisão das primeiras capturas motivou manter a prévia visível enquanto a ficha rola no desktop, reorganizar a galeria em duas fileiras de quatro e enquadrar a cabeça de lado para mostrar a extensão traseira. O ensaio de interface passou novamente com verificações da posição da prévia durante a rolagem e da grade da galeria.

## 018-T4 — Do rascunho à quadra

Para reproduzir, compile o projeto e instale as dependências locais dos ensaios a partir da raiz:

```powershell
npm.cmd run build
npm.cmd install --prefix .test-build/browser --no-save playwright
npm.cmd install --prefix .test-build/sql --no-save @electric-sql/pglite
node .test-build/browser/node_modules/playwright/cli.js install chromium
```

Abra dois terminais para Vite e a fixture. Reinicie a fixture entre execuções do percurso para limpar o banco em memória.

```powershell
node node_modules/vite/bin/vite.js --config apps/web/vite.config.ts --host 127.0.0.1 --port 5177 --strictPort
# Outro terminal
node docs/acceptance/012-admin.cjs --serve
```

Em um terceiro terminal:

```powershell
node docs/acceptance/018-admin.cjs
node docs/acceptance/018-roster-journey.cjs
node supabase/tests/database/012_admin.cjs
npm.cmd run test --workspace @volleyball-mythics/web
```

No Edge 157.0.4341.60, em Windows, salvei um atleta com saque 90, tom escuro e cabelo cacheado. A recarga manteve a ficha e as seleções. A revisão 1 publicou overall 56 e o catálogo colocou o atleta à disposição no lobby. A partida 2v2 levou a mesma chave de aparência nos snapshots dos quatro atletas. As capturas dos times confirmaram o mesmo modelo, pele e cabelo com uniformes azul e vermelho. [Time A](../../../acceptance/018-quadra-A.png) · [Time B](../../../acceptance/018-quadra-B.png).

O ensaio cobriu desktop 1440×1080, tela estreita 390×844, recolhimento do elenco, histórico e acesso direto à prévia. A navegação por Tab atravessou 40 paradas, incluindo slider, número, amostras, galeria, link para a prévia e comandos de rotação. O zoom nativo de 200% no Chrome for Testing 159.0.8154.6 resultou em 631×312 CSS px, DPR 2 e 631 px de largura de rolagem. [Desktop](../../../acceptance/018-desktop.png) · [Tela estreita](../../../acceptance/018-compacto.png) · [Resultados](../../../acceptance/018-results.json).

As migrations, o RPC de publicação e o runtime foram executados localmente com PGlite e autenticação de teste. A validação de login e deploy no Supabase hospedado fica fora deste ensaio. O build passou com o aviso de tamanho do chunk do Vite. Gate T4 aprovado.
