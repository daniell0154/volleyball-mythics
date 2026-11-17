# Elenco inicial — revisão 1

Nomes, overall e ideia das habilidades fornecidos pelo proprietário. Distribuição de atributos, detalhes do poder e visuais aleatórios autorizados pelo mesmo pedido. O visual é ficcional e não reproduz a aparência de pessoas reais. Gênero fica explícito no dado; nomes ambíguos futuros precisam de indicação do proprietário.

| Personagem | Saque | Recepção | Levantamento | Ataque | Bloqueio | Velocidade | Salto | Overall |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Samuel | 88 | 80 | 82 | 90 | 83 | 86 | 86 | 85 |
| Caio | 72 | 78 | 79 | 75 | 76 | 80 | 79 | 77 |

Samuel soma 595/7 = 85; Caio soma 539/7 = 77. O banco continua gerando overall pela média arredondada; o valor não é imposto pelo cliente.

**Samuel — Bronca no Parceiro:** ativação U durante rally 2v2, alvo companheiro; velocidade e recepção ×0,85 por 5 s, cooldown 20 s, sem acumular. Em 1v1 não há alvo, portanto fica indisponível sem gastar cooldown. Feedback: balão de bronca e ícone de debuff. A curta duração e a possibilidade de não ativar evitam uma penalidade permanente; trata-se deliberadamente de uma habilidade prejudicial à própria equipe, conforme solicitado.

**Caio — Foi Sem Querer:** ativação U durante rally com bola ao alcance, força a bola para fora e encerra o rally concedendo um ponto ao adversário, cooldown 25 s. A resolução autoritativa deve conceder esse ponto somente uma vez, sem somar outro ponto pelo contato com o chão. Feedback: trajetória exagerada e reação de constrangimento. Trata-se de desvantagem intencional fornecida pelo proprietário.

Handlers de habilidades foram integrados na 006 para este elenco inicial. O servidor valida fase, alvo, cooldown e limites de duração e executa somente IDs revisados; configurações do banco não selecionam código arbitrário. Samuel aplica o debuff temporário ao companheiro no 2v2; em 1v1 fica indisponível sem cooldown. Caio só ativa com a bola ao alcance, mostra a bola fora e encerra o rally com um único ponto adversário. Os efeitos e cooldowns vêm do servidor e são enviados nos snapshots. A tarefa de elenco final da 006 continua pendente até o proprietário confirmar que o elenco está completo ou fornecer os demais personagens.

Os visuais procedurais foram integrados à cena online na 005. Cada partida fixa a revisão de atributos, assetKey e habilidade selecionada ao iniciar; atualizar o catálogo não altera partidas em curso.

Visuais: modelos procedurais masculinos com sementes aleatórias persistidas em assetKey. São variações 3D estilizadas de cabelo, pele, proporções e detalhes, sem downloads externos. Seeds: Samuel 2626328580; Caio 2016838844. Não gerar nova aparência a cada frame ou reconexão. Cor principal da camiseta acompanha a equipe.

Fonte: `content/characters/initial.json`. Para validar e cadastrar:

```powershell
npm.cmd run build --workspace @volleyball-mythics/domain
node scripts/roster.mjs check
node scripts/roster.mjs publish
```

Publish lê a credencial server-only do `.env`, recusa revisão existente com conteúdo diferente e faz readback. Repetir não altera revisões idênticas. Para instalação limpa existe a migration `202611160003_initial_roster.sql`, gerada com `node scripts/roster.mjs sql`. O cadastro remoto desta entrega foi feito pelo script, sem reexecutar migrations de esquema. Ao aplicar a migration depois, as mesmas chaves não serão duplicadas.

Reconecte o lobby para reler o catálogo. Repetição de personagem entre jogadores continua permitida, inclusive em 1v1.
