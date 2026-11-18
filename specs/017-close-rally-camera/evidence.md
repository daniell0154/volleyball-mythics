# Evidências — 017

## 017-T1 — Referência da 016

Base `e819575` (PR #20 integrada). Execute `node docs/benchmarks/017-baseline.cjs` com Vite na raiz, porta 5180, e Playwright instalado em `.test-build/browser`, conforme [preparação da 016](../../docs/benchmarks/016-validation.md). Para reproduzir a referência visual depois da integração da câmera nova, execute no commit da 017-T1.

Edge 157.0.4341.60 no Windows, 1280×720, DPR 1 e qualidade baixa. O replay segue a câmera dinâmica da 016. HUD medido com 42 px em cima e 50 px embaixo. O script usa dois traces espelhados da 014, cada um medido das duas perspectivas. Foram 492 amostras de saque e rally, com quatro atletas. Menor diâmetro visual de bola de 12 CSS px e menor margem até a área útil de 169,95 px; nenhuma amostra fora.

O atleta local mede aproximadamente 28,93 px no preparo do saque e 28,78 px na primeira recepção em ambos os lados. Isso dá alvos de 37,61 e 37,42 px para a comparação com a candidata. Alturas estimadas com um segmento vertical de 1,8 m; usar o mesmo método ao comparar. A margem inclui o contorno da bola. Projeção geométrica não mede se rede ou atleta escondem o contato. Esses traces cobrem saque, recepção, levantamento e ataque; acrescentar casos específicos de levantamento alto junto à rede, ataque cruzado e defesa no fundo na validação.

Resultado e quatro capturas de referência em [017-baseline.json](../../docs/benchmarks/017-baseline.json). Gate T1 aprovado. A câmera utilizada na partida permanece a da 016.
