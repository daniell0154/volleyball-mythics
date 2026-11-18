# Evidências — 017

## 017-T1 — Referência da 016

Base `e819575` (PR #20 integrada). Execute `node docs/benchmarks/017-baseline.cjs` com Vite na raiz, porta 5180, e Playwright instalado em `.test-build/browser`, conforme [preparação da 016](../../docs/benchmarks/016-validation.md). Para reproduzir a referência visual depois da integração da câmera nova, execute no commit da 017-T1.

Edge 157.0.4341.60 no Windows, 1280×720, DPR 1 e qualidade baixa. O replay segue a câmera dinâmica da 016. HUD medido com 42 px em cima e 50 px embaixo. O script usa dois traces espelhados da 014, cada um medido das duas perspectivas. Foram 492 amostras de saque e rally, com quatro atletas. Menor diâmetro visual de bola de 12 CSS px e menor margem até a área útil de 169,95 px; nenhuma amostra fora.

O atleta local mede aproximadamente 28,93 px no preparo do saque e 28,78 px na primeira recepção em ambos os lados. Isso dá alvos de 37,61 e 37,42 px para a comparação com a candidata. Alturas estimadas com um segmento vertical de 1,8 m; usar o mesmo método ao comparar. A margem inclui o contorno da bola. Projeção geométrica não mede se rede ou atleta escondem o contato. Esses traces cobrem saque, recepção, levantamento e ataque; acrescentar casos específicos de levantamento alto junto à rede, ataque cruzado e defesa no fundo na validação.

Resultado e quatro capturas de referência em [017-baseline.json](../../docs/benchmarks/017-baseline.json). Gate T1 aprovado. A câmera utilizada na partida permanece a da 016.

## 017-T2 — Enquadramento adaptativo

`npm run test --workspace @volleyball-mythics/web` compilou e passou 29 testes no Windows. Cobertura nova: espelho entre lados, olho ancorado no piso durante salto, limite angular, abertura para arco alto, retorno gradual, resize e indicador fora da tela. `npm run build` passou com o aviso de tamanho de chunk do Vite.

`node docs/benchmarks/017-candidates.mjs` comparou 5,8/8 m de recuo e 3,2/5 m de altura nos mesmos 492 quadros da T1. Todos passaram as metas geométricas. O perfil 5,8/3,2 ampliou mais o atleta, de 28,93 para 184,18 px no preparo do saque e de 28,78 para 175,62 px na primeira recepção, nas mesmas poses de ambos os lados. Bola com mínimo de 12 CSS px, margem conservadora mínima de 64,27 px e nenhuma indicação de fora da tela nessas amostras. [Dados por variante](../../docs/benchmarks/017-candidates.json).

Edge 157.0.4341.60, 1280×720: sala solo no servidor local, saque e rally visíveis, marcador dentro da área útil e troca para câmera estável no menu sem exceções JS. [Captura do saque](../../docs/benchmarks/017-close-serve.png). No preparo do saque, o modelo pode esconder a esfera; o marcador existente mantém a posição visível. Esse ensaio não mede oclusão nos contatos nem substitui os cenários específicos, a reconexão e a revisão visual da T3 ou o benchmark da T4. Gate funcional da T2 aprovado.
