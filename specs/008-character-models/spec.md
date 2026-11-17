# Modelos articulados e identidade visual
Status: T1 em revisão visual; baseline e estudo preparados. T2–T4 aguardam aceite da direção.
Requisito R08: modelos articulados e identidade visual para a versão de tese.

## Escopo e referência
Seguir [documento de melhorias](../../docs/MELHORIAS.md). Samuel e Caio são iniciais; permitir expansão do catálogo. Preservar autoridade do servidor, 1v1/2v2 e primeiro a seis.

## Dependências
007 integrada; pendências de publicação não bloqueiam modelagem local.

## Aceitação
- **Direção visual e baseline:** Registrar vistas frontal/lateral e câmera de jogo de Samuel/Caio; definir silhuetas, proporções e paleta. Capturar baseline de quatro atletas e obter aceite da direção antes de produzir ambos.
- **Rig e modelo reutilizável:** Criar hierarquia com pivôs nomeados, volumes arredondados, mãos/pés e rosto legível. Ombros, cotovelos, joelhos e tornozelos giram sem separar membros. Hitboxes e atributos permanecem iguais.
- **Integração versionada:** Mesmo personagem tem mesma aparência no preview e na partida, inclusive após reconexão. Manter procedural:v1 e fallback; novas variantes usam chave/manifesto versionado, sem regenerar revisões publicadas.
- **Aceite visual e custo:** Proprietário reconhece Samuel/Caio em preview e na câmera de jogo. Dez montagens/desmontagens não acumulam objetos/recursos; medir chamadas de desenho e memória, e cumprir orçamento de render do documento. Registrar evidências.

Gate: todos os aceites de tasks.md com evidências reais; critérios visuais exigem aprovação do proprietário. Conteúdo novo, bots e publicação ficam fora desta spec.

