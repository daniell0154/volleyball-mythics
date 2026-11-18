# Contrato de aparência — 018

O campo `assetKey` continua sendo uma string em rascunhos, revisões publicadas, catálogo e snapshots v1. A escrita administrativa aceita as chaves legadas `procedural:v1:<sexo>:<seed>` e `procedural:athletic-v2:<sexo>:<seed>`, além de `procedural:visual-v3:<rig>:<sexo>:<seed>:<pele>:<cabelo>`. Os modelos combinam `classic|athletic` com `male|female`. A seed é uint32 em 1 a 10 dígitos decimais. A nova chave tem até 65 caracteres, dentro dos 160 do domínio e do campo textual do PostgreSQL.

| Campo | IDs e significado |
| --- | --- |
| Pele | `peach` #f1c7a5, `warm` #d8a07b, `bronze` #ab714e, `deep` #704931 |
| Cabelo | `short`, `swept`, `back` são as variantes legadas 0, 1 e 2. As formas `short-long`, `swept-long`, `back-long` reproduzem as mesmas variantes com extensão traseira longa. `bald` e `curly` completam a galeria. |

O LCG existente continua definindo cor do cabelo, cor de detalhe e escala. Ele avança na ordem histórica mesmo quando pele e penteado são explícitos. Para editar uma chave antiga, derive pele do primeiro sorteio e cabelo do quinto, acrescentando a extensão longa nas chaves femininas. As duas chaves v1 do manifesto usam o modelo articulado, as outras v1 usam o clássico e as athletic-v2 usam o articulado. O conversor captura esse modelo efetivo e preserva a seed. O modelo e o cabelo passam a ter seleções independentes.

| Chave anterior | Modelo | Pele | Cabelo |
| --- | --- | --- | --- |
| `procedural:v1:male:2626328580` | Articulado masculino | `warm` | `back` |
| `procedural:v1:male:2016838844` | Articulado masculino | `peach` | `short` |
| `procedural:v1:female:12` | Clássico feminino | `peach` | `swept-long` |
| `procedural:athletic-v2:female:12` | Articulado feminino | `peach` | `swept-long` |

Abrir uma ficha, salvar outros campos e publicar preservam a chave recebida, inclusive seus dígitos originais. Uma seleção que altera aparência grava visual-v3 e mantém as demais escolhas. A validação rejeita namespaces, modelos, IDs e seeds fora do contrato. O backend mantém as garantias de revisão otimista, autorização e imutabilidade da 012. A quadra resolve o visual pela chave fixada no início da partida.
