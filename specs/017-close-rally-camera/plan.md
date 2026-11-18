# Plano técnico — 017

Em `apps/web/src/scene/createScene.ts` a partida usa `followRallyCamera`. Em `camera.ts`, a posição de referência é y=22 e z=±25 com pequeno deslocamento horizontal. A função `followCamera` mais próxima existe, mas sua mira segue o atleta. Usar a câmera de rally da 016 como baseline e medir o resultado com a bola em movimento.

1. Reproduzir os mesmos snapshots e dimensões de HUD nas variantes. Experimentar recuos de 5,8 e 8 unidades e alturas de 3,2 e 5 acima do piso como pontos de partida. Comparar a altura aparente do atleta e a margem da bola até cada borda útil.
2. Calcular alvo entre atleta e bola, suavizar a mira e limitar velocidade angular. Projetar os dois corpos no retângulo útil a cada atualização. Afastar a câmera quando um deles ultrapassar a margem e usar uma margem maior para iniciar o retorno, evitando oscilações. Recalcular após resize, troca de lado e reconexão.
3. Reaproveitar os testes de projeção em `apps/web/tests`, os traces e clipes da 014. Registrar a menor margem da bola, menor diâmetro e altura do atleta nas mesmas poses. Comparar frame a frame as variantes finalistas e repetir o benchmark da 016 de cinco minutos (720p, DPR 1, quatro atletas, p95 ≤33,3 ms e regressão ≤10% em relação à baseline equivalente).
