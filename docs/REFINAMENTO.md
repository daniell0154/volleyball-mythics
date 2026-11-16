# Revisão e decisões de escopo
O plano anterior capturava o produto, mas não era executável sem decisões adicionais: backend em aberto, regras incompletas, pausa incompatível com jogo online, ausência de contratos, critérios vagos de desempenho e falta de persistência idempotente.

Este refinamento substitui decisões conflitantes de PLANEJAMENTO.md. Apenas requisitos explicitamente pedidos são confirmados; os demais são padrões propostos para implementação, reversíveis mediante atualização das specs.

Confirmados: React Native; web primeiro; 3D; online 1v1 e 2v2; personagens definidos pelo proprietário com overall e habilidade única; primeiro lado a 6 pontos vence; quadra escolar externa; PostgreSQL como próxima etapa futura; mobile e PC depois.

Padrões propostos fechados para o MVP:
- Supabase/PostgreSQL e Auth guest; servidor Node/TypeScript persistente com WebSocket autoritativo. Nakama deixa de ser alternativa simultânea. Mudança exige ADR antes de código dependente.
- Salas privadas por código e link, 2 ou 4 humanos, sem bots, espectadores, matchmaking ou split-screen.
- Sem pausa manual online. Abrir menu não interrompe jogo.
- Desconexão congela partida por até 20 segundos de relógio do servidor. Reconectar retoma com contagem de 3 segundos. Expiração derrota o time incompleto; ambos incompletos cancela sem vencedor. Máximo acumulado de 40 segundos de espera por time por partida.
- Resultado por abandono preserva placar real e motivo; não inventa seis pontos. Falha do servidor cancela partida ativa, sem recuperação de simulação no MVP.
- Guest mantém identidade enquanto houver sessão local; sem promessa de recuperar identidade após apagar dados.
- Personagens podem se repetir entre participantes, facilitando protótipos com elenco pequeno.
- Overall = arredondamento da média dos sete atributos; valores 1–100. Dados e poderes finais dependem do proprietário; fixtures apenas no desenvolvimento.
- Visual estilizado, câmera fixa elevada, teclado, navegador desktop. PC instalável e controles móveis ficam para especificação posterior.
- Histórico armazenado para resultado/reconciliação, sem tela de histórico no MVP. Não salvar inputs nem posições por frame.

Próximos gates reais: validar renderer e físico arcade; medir hardware de referência; receber elenco e habilidades. Esses gates impedem lançamento, mas não impedem banco, contratos e protótipos.

O fluxo adotado é o do [Spec Kit](https://github.github.com/spec-kit/quickstart.html): constituição, especificação, plano, tarefas e análise. Os artefatos foram preparados manualmente; CLI, skills e scripts não foram instalados ou executados. Na adoção futura, inicializar sem sobrescrever estes documentos e selecionar a feature ativa conforme a versão instalada.

