# Evidências — 018

## 018-T1 — Contrato visual

A 012 está integrada pelo merge `a04aadb`. A branch parte da `origin/main` no merge `d3f0f2d` da 017. A referência local orientou a composição em três painéis e a separação das seleções de pele e cabelo.

No Windows, executei `appearance` do renderer atual para os dois personagens do catálogo e para a seed feminina 12 em v1 e athletic-v2. Cruzei o resultado com o manifesto e verifiquei a variante longa nas duas geometrias. A chave mais longa tem 65 caracteres, contra o limite 160 de `CharacterCatalogRevisions`; catálogo e snapshot têm o mesmo campo textual. A ficha atual reescreve v1 ao abrir uma revisão publicada, caso coberto na T2. Gate T1 aprovado com o [contrato](contract.md).

## 018-T2 — Persistência e compatibilidade

`npm.cmd run test --workspace @volleyball-mythics/web` passou 31 testes no Windows com Node 26.13.1. O resolvedor compara a geometria e os materiais das chaves legadas e suas aparências explícitas, incluindo ambas as entradas do manifesto original. A especificação do modelo, a cor do cabelo e o detalhe gerado pela seed são preservados ao editar apenas a pele. Um campo de aparência que já contém a escolha selecionada preserva a chave literal.

`node supabase/tests/database/012_admin.cjs` passou com PGlite e todas as migrations, inclusive a 008. O RPC publicou uma chave v1 com zeros à esquerda e uma visual-v3 no mesmo atleta com avanço de revisão. A revisão anterior manteve a própria chave. Seeds fora do intervalo e IDs desconhecidos foram rejeitados junto com tipos inválidos. O ensaio também verificou as garantias de autorização, concorrência e auditoria da 012. Validação local em banco de teste. Gate T2 aprovado.
