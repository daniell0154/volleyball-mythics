# Evidências — 008-character-models

Base: main d318ab8 (PR #10 integrada); branch feat/008-character-models. Não foram encontradas instruções AGENTS.md nem constitution no repositório. Lidos README, REFINAMENTO, contratos e spec/plan/tasks, além de docs/MELHORIAS.md.

## 008-T1 — Direção visual e baseline (parcial)

- Requisito R08: registrar aparência atual e direção concreta para revisão antes de produzir os dois modelos finais.
- Artefatos: docs/art/008-review.html e 008-direction.png registram Samuel/Caio nas vistas frontal, lateral e uma câmera ilustrativa distante. A faixa inferior propõe um corpo base arredondado genérico. docs/art/008-direction.md define proporções, paleta e limites.
- Inspeção: prancha renderizada no Chrome e examinada visualmente; nove vistas presentes. Proposta usa geometria Three.js real, não imagem ilustrativa gerada sem relação com a implementação.
- Verificação: node docs/art/008-baseline.cjs captura a prancha, mede a cena atual por cinco minutos e salva 008-baseline.json e 008-baseline-court.png. A medição é de renderer local com quatro modelos atuais em rally sintético, sem rede; não mede desempenho da proposta.
- Resultado: 300.016,2 ms, 18.013 frames, p95 16,8 ms, máximo 34,1 ms, aba não oculta, zero exceções JavaScript. Meta de baseline <=33,3 ms atendida. Chrome 157.0.8103.79 headless, Windows 11 Pro, Intel i7-1185G7, Iris Xe via ANGLE/D3D11, 15,69 GiB, 1280×720/DPR1/qualidade baixa. O capturador observa pageerror, não é auditoria completa de logs de console.
- Gate T1: aprovado após orientação explícita do proprietário: “va no estilo happy hoops. pode seguir”. A direção escolhida usa proporções atléticas em vez do estudo arredondado inicial. T2 pode iniciar; aprovação de resultado final permanece na T4.
- Integração: renderer da aplicação, dados publicados e contratos permanecem na versão anterior; nenhuma mudança de catálogo ou migração foi aplicada. git diff --check sem erros. Sem testes de domínio/servidor porque a alteração contém apenas documentação e ferramenta de revisão isolada.

## 008-T2 — Rig e modelo reutilizável

Modelo atlético em athleticAvatar.ts, com tronco afunilado, pernas alongadas, rosto e mãos, pivôs nomeados em hierarquia. Aparência vem da semente existente, sem nomes embutidos na construção. Nenhuma alteração de hitbox ou atributo.
Teste cobre ligação dos pivôs sob rotação e descarte único de geometria/material. Primeira execução detectou pés elevados; corrigida a extensão das pernas antes da integração. Recursos são próprios de cada instância; materiais internos compartilhados são descartados uma vez via Set.
Resultado T2: suíte web 10/10 passou.

## 008-T3 — Integração versionada

avatarManifest.ts mapeia explicitamente as duas chaves iniciais para athletic-v2; createAvatar v1 segue intacto e atende chaves fora do manifesto. Preview e cena usam createPresentationAvatar. O servidor não recebe código de modelo nem muda assetKeys/revisões publicadas; contracts.md registra essa decisão de compatibilidade. Chave desconhecida segue erro no construtor e placeholder na cena.
Suíte web 11/11: repetição do resolvedor mantém dimensões e metadados, incluindo recriação de apresentação com a mesma chave após uma conexão ser reconstruída. Esse teste verifica o comportamento do renderer, não constitui novo ensaio de reconexão WebSocket real. Fonte de aparência é a mesma semente, tanto no preview quanto no jogo. Gate de implementação aprovado.

## 008-T4 — Aceite visual e custo

- Proprietário aprovou explicitamente: “Aprovo os dois modelos”, após apresentação de 008-models.png. O modelo segue a direção atlética autorizada. Rig estático pronto para animação na 009, sem declarar animações entregues.
- Chrome 157.0.8103.79, Windows 11 Pro, i7-1185G7/Iris Xe/D3D11, 1280×720, DPR1, baixa, Vite/headless: 300.010 ms, 18.009 frames, p95 16,9 ms, máximo 49,8 ms, aba visível, zero exceções JS. Baseline 16,8 ms: +0,595%, dentro de 10% e p95 <=33,3 ms.
- Um atleta: 41 chamadas de desenho, 4.756 triângulos. Dez ciclos de criação/render/descarte no mesmo renderer: 41 geometrias ativas e zero após descarte em todos; uma textura interna permanece constante (sem mapas de textura nos modelos). São contadores do renderer, não bytes de VRAM nem análise de heap.
- Critério inicial de textura igual a zero marcou falha por cache interno estável. Corrigido para ausência de crescimento entre ciclos; JSON preserva amostras e recalcula somente o gate. Não foi removida amostra. Primeira tentativa de medição foi invalidada por HMR e descartada; o relatório corresponde à segunda execução contínua.
- Capturas: 008-models.png e 008-candidate-court.png. Reprodução: 008-integration.md, script 008-candidate.cjs --candidate. O baseline antigo exige checkout histórico para não medir o manifesto novo.
- Verificação: suíte web 11/11, typecheck e build passaram. Avisos anteriores de bundle >500kB e use client continuam. Nenhum código de servidor/domínio foi alterado, portanto o ensaio de carga da 007 não foi repetido nem apresentado como novo resultado.
- Gate: aprovado no ambiente medido. Não é validação de Safari/Firefox, rede WAN ou capacidade de produção. Coerência revisada entre contrato, manifesto, preview e cena; T1–T4 completas. Próxima spec: 009, após integração da 008.
