# Evidências — 006-roster

Base: branch `feat/006-roster`, partindo de `main` em `c912c9c` (PR #7 da 005 integrada). Ambiente: Windows, Node/npm do workspace. Nenhum gate foi inferido de documentação sem execução.

## 006-T1 — Quatro jogadores e equipes

- Requisito: quatro identidades humanas, dois slots exclusivos por equipe, estado distribuído a todos e rotação de saque conforme o contrato.
- Cenário: teste de lobby cria 2v2, conecta quatro sessões, escolhe a mesma revisão para todas, marca todos prontos e inicia; testa conjunto de slots e entrega de snapshots com quatro atletas a cada sessão. Teste de domínio simula sequência de pontos alternados e em série.
- Comandos: `npm run test --workspace @volleyball-mythics/domain`; `npm run test --workspace @volleyball-mythics/server`.
- Resultado: domínio 18/18 e servidor 32/32 passaram. A equipe mantém seu sacador durante a sequência; quando recupera o serviço, alterna seu próprio slot, independentemente da outra equipe. O sandbox bloqueou inicialmente a criação de subprocessos (`spawn EPERM`); as mesmas suítes passaram fora dele.
- Gate: aprovado.

## 006-T2 — Overall e catálogo versionado

- Requisito: overall calculado no domínio como arredondamento da média dos sete atributos; revisões identificadas por `id:version`, imutáveis e fixadas durante partidas.
- Cenário: valida fichas com médias 85/77, rejeita overall divergente, campos de atributo ausentes/adicionais, revisão duplicada e tentativa de alterar uma revisão publicada; substitui catálogo habilitado e confirma que a revisão antiga permanece consultável. O servidor agora valida as linhas lidas do banco por esse catálogo antes de distribuí-las; runtime já copia atributos e visual da revisão ao iniciar.
- Comando: `npm run test --workspace @volleyball-mythics/domain`.
- Resultado: build do pacote domínio e 17/17 testes passaram, incluindo arredondamento, sete chaves exatas, imutabilidade e consulta de revisão após remoção do catálogo habilitado. O servidor mantém atributos e visual em cópia da revisão ao iniciar uma partida; cobertura de partida e build conjunto registrada no gate final da spec.
- Gate: aprovado.
