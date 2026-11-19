# Contrato 013 — criação 2v2, histórico compatível

Mantém protocolVersion=1 e MatchMode=1v1|2v2 na leitura de histórico, snapshots e persistência. O parser ainda reconhece createRoom({mode:'1v1'}) para responder explicitamente mode_unavailable, sem tratar cliente antigo como mensagem malformada. O servidor rejeita antes de criar sala ou associação; o cliente novo explica que 1v1 foi removido e pede atualização para 2v2. Leitores antigos que não conheçam o código seguem recebendo error no envelope v1.

Somente createRoom 2v2 é aceito na aplicação pública. RoomRegistry e MatchRuntime mantêm suporte interno a fixtures históricas 1v1 para regressão e leitura de revisões legadas; não há comando ou configuração de produção que habilite criação pública 1v1. Não mudar enums, FKs ou RPC de resultados nem apagar dados. Não exige migration Supabase.

Novas salas exigem quatro humanos em A0/A1/B0/B1, seleção/prontidão de todos e início pelo dono. Não preencher com bots nem exibir botão sem funcionamento. Reconexão, limites de input, seis pontos, abandono e votos de revanche permanecem vigentes. Revalidar essas condições nos testes de integração.

Mapa de dependências: Lobby.tsx contém modo inicial/seleção; RoomApplication.command é a fronteira pública; envelope.ts valida sintaxe; RoomRegistry, domínio e results preservam histórico. main.tsx importa Demo.tsx, que importa Game.tsx; Game é exclusivo da demonstração e pode ser removido após confirmar seus consumidores. CharacterPreview, createScene, câmera, avatar e OnlineMatch são compartilhados e permanecem. Harnesses históricos 011/012 não são rotas da build de produção; cenários ativos desta spec devem usar quatro sessões.

Remover navegação e entrada Demo; rotas inexistentes como /demo ou /preview caem no comportamento SPA atual sem montar demonstração. Verificar bundle sem chunk Demo/Game e seleção/admin ainda disponíveis. Gates futuros de física/bots/fullscreen são das specs 014–016.
