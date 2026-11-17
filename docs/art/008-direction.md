# 008-T1 — Direção visual para revisão

Base: main d318ab8. Prancha: [008-direction.png](008-direction.png). Gerador: [008-review.html](008-review.html). As seis primeiras vistas são Samuel/Caio atuais. A faixa inferior é um corpo genérico de estudo; não é uma nova revisão publicada de personagem.

## Proposta concreta

- Altura visual próxima dos atuais dois metros, tênis no chão e tronco reconhecível à distância.
- Cabeça oval, olhos simples, cabelo em volume contínuo; membros arredondados com mãos e pés distintos.
- Ombros e quadril visíveis para suportar articulação futura; braços em postura relaxada neste estudo estático.
- Camiseta azul #215f99, short #192438 e tênis claro no corpo de estudo. Equipe B terá camiseta vermelha; as cores de pele/cabelo dos atletas continuam derivadas da aparência determinística existente. Não usar pele, altura ou atributos como caricatura de pessoas reais.
- As diferenças atuais de Samuel/Caio estão registradas na prancha; produzir os modelos finais exige preservar suas sementes e aprovar o mapeamento de aparência versionado em T3.

As vistas “distância de jogo” da prancha usam câmera ilustrativa em (2,4,9), não reproduzem exatamente o seguimento de câmera de uma partida. A captura 008-baseline-court.png registra a cena atual real com os quatro modelos v1.

## Reproduzir

Na raiz, instalar Playwright em .test-build/browser (dependência local de ferramenta) e iniciar:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5176 --strictPort
node docs/art/008-baseline.cjs
```

O script abre Chrome instalado em Windows, captura as nove vistas e mede cinco minutos de render contínuo a 1280×720, DPR 1, qualidade baixa. Os quatro atletas alternam as duas aparências existentes. A cena e a animação de posições são sintéticas; não validam rede nem habilidade. Hardware, browser, GPU, duração e métricas ficam em 008-baseline.json.

## Gate

T1 permanece pendente até aprovação visual explícita. T2–T4 dependem desse aceite; este estudo não muda o renderer do jogo, catálogo ou física. O baseline serve para comparação posterior, não prova desempenho dos modelos propostos.
