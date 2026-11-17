# Evidências — 014

Base main edc3b9c, PR #16 integrada após autorização explícita do proprietário. Branch feat/014-rally-balance; nenhuma PR anterior. README, refinamento, ciclo, contratos e spec/plan/tasks lidos; sem constitution/AGENTS.md encontrados.

## 014-T1

Contrato em contract.md: perfil 4 candidato, padrão 3 preservado até gate; intenção aim opcional limitada, sem posição/contato do cliente; teclado e cursor em comparação. Referência oficial Just Volleyball e limites textuais já documentados em docs/MELHORIAS-012-016.md, sem alegar sessão jogável da referência.

`node docs/benchmarks/014-rallies.mjs 3`: passou, 40 saques por lado em RTT 0 e 150ms com jitter de aproximadamente 33ms, reação 200ms e perseguição a observações atrasadas da bola. Atributos 25/75/100 e zonas -3/0/3, dados por amostra em 014-profile-3.json. 100% de devoluções nos quatro grupos, mediana de um contato; estratégia só-saque 0/20 vitórias. Não reproduziu o domínio relatado contra esse defensor, sem concluir que a experiência humana não apresenta problema. Adversário inativo registrado separadamente. Meta de três contatos esclarecida para cenário separado com ambos os times ativos, não para o time que permanece parado.

Trajetórias reais capturadas em 014-traces-3.json, replay 014-review.html e clipe 014-before.webm. Renderer com quatro modelos aprovados, Chrome 157 no Windows, 1280x720/DPR1/baixa/câmera estável; sem modelo de física novo no baseline. Tentativas iniciais de replay inválidas (índice negativo no primeiro RAF) descartadas e corrigidas; não contadas como medição. Benchmark prolongado/aceite são T4. Gate T1 aprovado com resultado negativo da hipótese de domínio neste fixture, não com reprodução inventada.

## 014-T2

Perfil 4 imutável, ainda candidato; padrão de produção continua 3. Saque requer fundo da quadra e recebe arco mais longo; recepção/levantamento constroem no mesmo lado e ataque segue ao adversário. Mira opcional limitada x/z com teste de norma/valores finitos; nenhum destino/posição autoritativos vindo do cliente. Snapshots anunciam rulesVersion opcional para mostrar controles apenas no candidato. Teclado/setas e protótipo cursor emitem o mesmo formato; WASD e ações preservados. Perfis antigos ignoram aim e mantêm as fórmulas anteriores.

Domínio 23/23, servidor 45/45 e web 25/25 passaram; typecheck passou. Testes novos cobrem destino limitado, monotonicidade de atributos, ação no próprio lado, rejeição de mira inválida/autoridade e saque ilegal fora do fundo, sequência única e normalização/limpeza de teclado/cursor. Regressões existentes de faltas, três toques, poderes, seis pontos e perfil fixado passaram.

Fixture comparativa refinada antes do aceite T4: agora usa duas observações atrasadas por pelo menos 200ms mais RTT para estimar interceptação por gravidade, sem ler posição futura. Decide receber/levantar/atacar por contatos aceitos observados e limita tentativas de rallies longos a 15s. A versão intermediária de perseguição sem estimativa e recepção repetida gerava falhas artificiais de quarto toque/atraso; não usada como comprovação de melhora. A mesma política revisada foi aplicada a v3/v4, com linhas por amostra: 100% de devoluções em ambos os lados/RTTs e 0/20 vitórias só-saque nos dois; construção no time defensor de 1 para 3 contatos, mediana com ambos ativos de 9 para 10. Não é evidência humana. Gate funcional T2 aprovado; ativação de v4 depende da T4.

Para cada tarefa registrar: requisito, commit/build, comando/cenário, ambiente, resultado observado, limitações e decisão de gate. Aprovação humana deve identificar o comentário real e o que foi revisado.

