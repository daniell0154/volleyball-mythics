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

## 006-T3 — Contrato de habilidades

- Requisito: execução exclusiva no servidor; fase, alvo, duração e cooldown validados; reaplicação por spam bloqueada; efeitos expiram e são limpos ao encerrar partida.
- Cenários: configuração só aceita handlers revisados `teammate_rant` e `free_point_out`; fixture `speed_boost_fixture` só é permitida em desenvolvimento. Testes rejeitam fase, alvo, duração, multiplicador e cooldown fora do contrato. No servidor, Samuel debuffa um único companheiro, ignora spam em cooldown, expira em 5 s e limpa no fim; Caio não ativa fora de alcance, aplica recarga apenas quando aceito, posiciona a bola fora e concede um ponto adversário idempotente.
- Interface: botão U fica ativo apenas com habilidade configurada, durante rally e fora da recarga; o valor restante vem dos snapshots autoritativos.
- Comandos: `npm run test --workspace @volleyball-mythics/domain`; `npm run test --workspace @volleyball-mythics/server`; `npm run typecheck`; `npm run build`.
- Resultado: domínio 18/18 e servidor 32/32 passaram; typecheck e build do workspace passaram. Build web manteve avisos existentes de bundle acima de 500 kB e diretivas `use client` do RN Web, sem falha.
- Gate: aprovado.

## 006-T4 — Integrar elenco do proprietário (pendente)

- Requisito: atributos, visual e ficha de poder para todo o elenco final fornecido pelo proprietário; nenhum personagem pode ser inventado para preencher lacunas.
- Cenário/comando: `node scripts/roster.mjs check` validou `content/characters/initial.json` e retornou Samuel v1 overall 85 e Caio v1 overall 77. As fichas incluem atributos, assetKey procedural e configuração de habilidade; a prévia existente está em `docs/roster/initial-preview.png`.
- Resultado: os dois registros iniciais solicitados estão integrados e seus handlers são cobertos por 006-T3. Ainda não há confirmação de que Samuel e Caio compõem o elenco final completo; `specs/checklist.md` mantém “Elenco final e regras de poderes fornecidos” pendente. Não foram adicionados personagens nem regras inventadas.
- Ambiente/limitação: checkout local na branch `feat/006-roster`; apenas dois personagens constam no conteúdo fornecido.
- Gate: bloqueado por conteúdo do proprietário. Tarefa permanece sem marcação de conclusão; a PR será draft com essa pendência explícita.
