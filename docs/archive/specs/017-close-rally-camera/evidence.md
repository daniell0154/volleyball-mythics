# Evidências — 017

## 017-T1 — Referência da 016

Base `e819575` (PR #20 integrada). Execute `node docs/benchmarks/017-baseline.cjs` com Vite na raiz, porta 5180, e Playwright instalado em `.test-build/browser`, conforme [preparação da 016](../../../benchmarks/016-validation.md). Para reproduzir a referência visual depois da integração da câmera nova, execute no commit da 017-T1.

Edge 157.0.4341.60 no Windows, 1280×720, DPR 1 e qualidade baixa. O replay segue a câmera dinâmica da 016. HUD medido com 42 px em cima e 50 px embaixo. O script usa dois traces espelhados da 014, cada um medido das duas perspectivas. Foram 492 amostras de saque e rally, com quatro atletas. Menor diâmetro visual de bola de 12 CSS px e menor margem até a área útil de 169,95 px; nenhuma amostra fora.

O atleta local mede aproximadamente 28,93 px no preparo do saque e 28,78 px na primeira recepção em ambos os lados. Isso dá alvos de 37,61 e 37,42 px para a comparação com a candidata. Alturas estimadas com um segmento vertical de 1,8 m; usar o mesmo método ao comparar. A margem inclui o contorno da bola. Projeção geométrica não mede se rede ou atleta escondem o contato. Esses traces cobrem saque, recepção, levantamento e ataque; acrescentar casos específicos de levantamento alto junto à rede, ataque cruzado e defesa no fundo na validação.

Resultado e quatro capturas de referência em [017-baseline.json](../../../benchmarks/017-baseline.json). Gate T1 aprovado. A câmera utilizada na partida permanece a da 016.

## 017-T2 — Enquadramento adaptativo

`npm run test --workspace @volleyball-mythics/web` compilou e passou 29 testes no Windows. Cobertura nova: espelho entre lados, olho ancorado no piso durante salto, limite angular, abertura para arco alto, retorno gradual, resize e indicador fora da tela. `npm run build` passou com o aviso de tamanho de chunk do Vite.

`node docs/benchmarks/017-candidates.mjs` comparou 5,8/8 m de recuo e 3,2/5 m de altura nos mesmos 492 quadros da T1. Todos passaram as metas geométricas. O perfil 5,8/3,2 ampliou mais o atleta, de 28,93 para 184,18 px no preparo do saque e de 28,78 para 175,62 px na primeira recepção, nas mesmas poses de ambos os lados. Bola com mínimo de 12 CSS px, margem conservadora mínima de 64,27 px e nenhuma indicação de fora da tela nessas amostras. [Dados por variante](../../../benchmarks/017-candidates.json).

Edge 157.0.4341.60, 1280×720: sala solo no servidor local, saque e rally visíveis, marcador dentro da área útil e troca para câmera estável no menu sem exceções JS. [Captura do saque](../../../benchmarks/017-close-serve.png). No preparo do saque, o modelo pode esconder a esfera; o marcador existente mantém a posição visível. Esse ensaio não mede oclusão nos contatos nem substitui os cenários específicos, a reconexão e a revisão visual da T3 ou o benchmark da T4. Gate funcional da T2 aprovado.

## 017-T3 — HUD, oclusão e transições

Com Vite e o servidor de teste da [preparação da 016](../../../benchmarks/016-validation.md) em execução, rode a partir da raiz:

```powershell
npm.cmd run build
node docs/benchmarks/017-targeted.mjs
node docs/benchmarks/017-visibility.cjs
node docs/acceptance/017-camera.cjs
npm.cmd run test --workspace @volleyball-mythics/web
```

O gerador usou os mesmos inputs espelhados em profundidade no runtime v4, em 2v2. O saque foi recebido a 6,05 m da rede. No levantamento, a bola chegou a 4,76 m de altura a 2,16 m da rede. O ataque cruzado saiu de x=+1,02 m e caiu em x=−3,11 m no lado adversário. As ações, os contatos e o ponto vieram da simulação. O indicador fora da tela foi ensaiado em separado com uma posição sintética além da quadra.

No Edge 157.0.4341.60, em Windows 11, os replays da 014 e os lances direcionados somaram 4.848 quadros de saque e rally em 36 combinações. O renderer apresentou quatro atletas, perspectivas A e B, 720p e 1080p com qualidade baixa e alta (DPR 1 e 2 no canvas) e enquadramento estável nos dois lados. Depois do resize, o ensaio de 640×360 usou a faixa inferior expandida. A menor margem da esfera com contorno foi de 43,02 CSS px e o menor diâmetro de 12 CSS px. Todos os indicadores permaneceram dentro das faixas. A câmera ficou atrás do atleta e apontou para a rede nos quadros de contato. O enquadramento estável manteve posição e rotação por lado. [Medições por combinação](../../../benchmarks/017-visibility.json).

A amostragem dos pixels amarelos no canvas encontrou oclusão total da esfera no preparo do saque e na defesa próxima em algumas perspectivas. O indicador sobreposto permaneceu visível nessas amostras. Houve pixels da esfera em todos os quadros de contato amostrados de saque, levantamento e ataque. Essa leitura verifica a esfera no instante do contato e o indicador na tela. A revisão visual dos clipes fica registrada na T4.

Em partida solo contra bots no Edge, a reconexão preservou o ID da partida e o canvas, com o indicador entre as faixas durante a suspensão e após retomar. A partida passou pelo resize para 1080p e pela alternância da câmera estável. No Chrome for Testing 159.0.8154.6, o zoom nativo de 200% deixou 631×312 CSS px e DPR 2. O saque, o rally e a abertura/fechamento da faixa de ações passaram sem rolagem horizontal. Os 29 testes web passaram, incluindo limite angular, abertura em arco alto e retorno gradual. O build passou com aviso de tamanho de chunk do Vite. Gate T3 aprovado.

## 017-T4 — Comparação lado a lado e desempenho

Com o Vite ativo, gere os lances da T3 e execute os clipes e o benchmark em sequência:

```powershell
node docs/benchmarks/017-targeted.mjs
node docs/benchmarks/017-clips.cjs
node docs/benchmarks/017-render.cjs
```

Os clipes usam os mesmos snapshots e quatro atletas nas duas câmeras. O replay desenha as faixas do HUD e o indicador nos pontos medidos em cada viewport. A revisão dos quadros de contato mostrou a esfera sobre a rede no levantamento e no ataque e o indicador sobre o corpo na defesa próxima. O tamanho aparente do atleta aumentou de 28,93 para 184,18 CSS px no preparo do saque e de 28,78 para 175,62 CSS px na recepção da referência. O menor ganho entre os quadros de comparação foi de 510,2%, com margem mínima de 64,27 CSS px nessa série. Foi o maior ganho entre os quatro perfis que passaram o ensaio geométrico. Os lances direcionados confirmaram o enquadramento com o HUD ampliado. Esses resultados sustentam a escolha de 5,8 m de recuo e 3,2 m de altura. [Projeções por perfil](../../../benchmarks/017-candidates.json).

Os quatro WebM registraram de 130 a 138 quadros codificados em 9,75 a 9,92 s, do preparo do saque ao ponto. A captura apresenta os snapshots em ordem e pode reproduzir o lance mais devagar que a simulação.

| Saque | Perspectiva A | Perspectiva B |
| --- | --- | --- |
| A | [Câmeras lado a lado](../../../benchmarks/017-serve-A-view-A.webm) | [Câmeras lado a lado](../../../benchmarks/017-serve-A-view-B.webm) |
| B | [Câmeras lado a lado](../../../benchmarks/017-serve-B-view-A.webm) | [Câmeras lado a lado](../../../benchmarks/017-serve-B-view-B.webm) |

No Windows 11, Edge 157.0.4341.60, Core i3-1115G4 e Intel UHD via ANGLE/Direct3D11, cada câmera rodou por 300 s após 10 s de aquecimento. A execução usou o mesmo replay v4, quatro atletas, 1280×720, DPR 1 e qualidade baixa. A referência elevada da 016 teve p95 de 16,90 ms em 17.938 intervalos. A câmera próxima teve p95 de 17,10 ms em 17.614 intervalos, regressão de 1,18%, dentro dos limites de 33,3 ms e 10%. Ambas rodaram com a aba visível e sem exceções JavaScript. O intervalo máximo chegou a 906,5 ms na câmera próxima e a 50,8 ms na referência. A causa do pico ficou indeterminada neste ensaio de cadência do replay. [Relatório de renderização](../../../benchmarks/017-render.json).

O enquadramento continua subordinado ao retângulo útil da 016 e ao snapshot v1. A câmera adaptativa e a opção estável são decisões locais de apresentação. Gate T4 aprovado.
