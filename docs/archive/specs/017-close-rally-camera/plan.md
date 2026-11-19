# Plano técnico — 017

Em `camera.ts`, a posição de referência da 016 é y=22 e z=±25 com pequeno deslocamento horizontal. O replay mantém essa referência. A partida usa `CloseRallyCamera` por padrão. A opção de movimento reduzido mantém o enquadramento fixo por lado.

1. Reproduzir os mesmos snapshots e dimensões de HUD nas variantes. Experimentar recuos de 5,8 e 8 unidades e alturas de 3,2 e 5 acima do piso como pontos de partida. Comparar a altura aparente do atleta e a margem da bola até cada borda útil.
2. Calcular alvo entre atleta e bola, suavizar a mira e limitar velocidade angular. Projetar os dois corpos no retângulo útil a cada atualização. Afastar a câmera quando um deles ultrapassar a margem e usar uma margem maior para iniciar o retorno, evitando oscilações. Recalcular após resize, troca de lado e reconexão.
3. Reaproveitar os testes de projeção em `apps/web/tests`, os traces e clipes da 014. Registrar a menor margem da bola, menor diâmetro e altura do atleta nas mesmas poses. Comparar frame a frame as variantes finalistas e repetir o benchmark da 016 de cinco minutos (720p, DPR 1, quatro atletas, p95 ≤33,3 ms e regressão ≤10% em relação à baseline equivalente).

Na T2, o perfil de 5,8 m de recuo e 3,2 m de altura teve o maior ganho de proximidade entre os quatro perfis medidos. A mira acompanha atleta e bola com limite angular. O deslocamento pela direção inversa da câmera garante profundidade para projetar atleta, bola e indicador no chão; o recuo é imediato quando a margem fica insuficiente. O retorno usa margem maior e transição gradual. A expansão usa a projeção atual da 016, inclusive após mudanças de viewport e HUD. A mudança é local ao renderer.
