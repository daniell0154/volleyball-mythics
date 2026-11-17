# Gameplay, saque equilibrado e leitura da bola
Status: T1–T3 implementadas; T4 validada tecnicamente. O proprietário delegou execução/PRs/merges sem novas aprovações; revisão técnica e inspeção visual substituem o gate de aprovação intermediária nesta entrega, sem alegar playtest humano.
Requisito R14. Dependência: 013 integrada.

## Aceitação
- Usar Just Volleyball como inspiração de controle simples, movimento manual e intenção de direção; referência e limites em docs/MELHORIAS-012-016.md. Prototipar direção de saque/recepção/levantamento/ataque mantendo WASD e ações acessíveis por teclado. Mira por cursor é experimento comparado, não requisito automático.
- Reproduzir vantagem relatada do saque antes de alterar parâmetros. Medir tempo de voo, alcance do receptor, posição inicial, janela de ação, ace rate e devoluções com seed/atributos/lado fixados. Separar adversário inativo de adversário que tenta defender.
- Novo perfil de regras versionado, fixado no início; ajustar arco, velocidade, destino, preparação e recuperação com mudanças isoladas. Não garantir recepção automática nem conceder ponto por tecla; preservar três toques, alternância entre colegas, faltas, poderes e seis pontos.
- Bola distinguível de piso, céu, rede e uniformes: paleta própria, contorno de alto contraste e diâmetro visual mínimo proposto de 12 CSS px em 1280×720. Alteração visual não muda hitbox. Sombra/projeção no chão comunica altura; rastro curto opcional, reduzido/desativado com reduzir movimento.
- Câmera mantém bola e área útil no enquadramento dos dois lados, inclusive arco alto e laterais; indicador direcional quando sair da tela. Tratar oclusão pela rede/atletas com contorno ou marcador discreto. Marcador de queda estimado, se adotado, claramente distinto da sombra atual, atualizado com snapshot e sem prometer contato.
- Meta proposta: em 40 saques legais por lado com defensor de teste limitado a movimento/ações legais e reação de 200ms, ao menos 80% de devolução; testar atributos baixos/médios/altos, zonas e RTT 0/150ms com jitter 30ms. Registrar distribuição, não só média.
- Contra esse defensor, estratégia de apenas sacar e permanecer parado deve vencer no máximo 20% de 20 partidas com lados alternados. Não exigir esse limite contra adversário parado. Mediana alvo de três contatos após saque; metas precisam de baseline e aceite do proprietário, sem herdar dispensa da 010.
  - A mediana de três contatos será medida separadamente com ambos os times ativos; o cenário de abuso usa time sacador parado e testa a taxa de vitória, sem exigir que esse time devolva. Baseline que já passe as metas não será apresentado como reprodução do relato humano.
- Validar legibilidade com clipes dos arcos/oclusões em qualidade baixa/alta, 720p/1080p, zoom 200%, ambos os lados e câmera estável. Ensaio humano curto guiado e aprovação de visibilidade/diversão; registrar resultados reais sem substituir por automação.

Gate: tarefas completas, evidências reproduzíveis e aceite do proprietário nos critérios de experiência. Mudanças de metas exigem decisão registrada antes do fechamento.

Decisão de execução: o proprietário instruiu “pode seguir com tudo sem pedir mais nenhuma permissão, apenas continue trabalhando criando PRs e mergeando”. Para este ciclo, prosseguir por gate técnico, métricas e inspeção visual do implementador, registrando ensaio humano como validação posterior e sem inventar opinião/diversão humanas. Critérios quantitativos permanecem. Perfil 4 promovido após passar a comparação técnica e o benchmark visual; perfil 3 preservado por configuração como rollback.

