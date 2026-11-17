# Contratos futuros — 012 a 016

Propostas, não implementadas. specs/contracts.md continua descrevendo o sistema atual. Schemas finais, migrations, rollback e compatibilidade devem ser fechados na T1 da spec responsável antes do código dependente.

## 012 — Catálogo administrativo

Rascunho separado de revisão publicada; publicação atômica atribui versão/overall e valida habilidade/visual. Escrita restrita a identidade autenticada com papel administrado no servidor/banco; guests leem somente revisões habilitadas. Endpoints autenticados de lista/criação/edição/publicação/desativação, sem SQL ou caminhos de asset fornecidos livremente pelo cliente. Paginação, limites de payload e conflito de versão definidos na T1.

Auditoria de autor, operação, data e revisão; nunca tokens. Sem hard delete de revisão referenciada. Cache do catálogo invalidado ao publicar; salas revalidam revisão ao iniciar. Partidas fixam revisões. Novos visuais devem usar resolvedor permitido compatível com histórico e sem rebuild por personagem.

## 013 — Remoção de novas partidas 1v1

Servidor aceita criação apenas 2v2 após migração; resultado histórico ainda pode ter mode=1v1. Não estreitar enum do banco apagando histórico. Mensagem explícita de modo não disponível para clientes antigos. Remover demonstração somente na navegação/rotas públicas.

## 014 — Controle e perfil

Novos parâmetros de física pertencem a rulesVersion imutável. Se houver mira, input carrega intenção direcional limitada/normalizada; servidor valida números finitos, magnitude, frequência e fase, calcula trajetória e rejeita autoridade de posição/contato enviada pelo cliente. Compatibilidade com cliente sem direção deve ser deliberada: padrão documentado ou versão de protocolo nova, sem interpretação silenciosa. Não transmitir resultado futuro de queda como fato autoritativo.

## 015 — Humanos e bots

Mode continua 2v2; matchKind distingue humans e vsBots. Dificuldade/policyVersion/seed fixadas na partida. Participante possui participantId, controller, team, slot e revisão do personagem; humano referencia userId Auth, bot não. Migrar MatchPlayer/FKs/RPC e validação idempotente de resultado antes de salvar bots; não criar usuários Auth fictícios. Unicidade de slot e de humano na partida permanece.

Snapshots/visualActions passam a referenciar identidade de participante, com mapeamento explícito para o humano local. Bot não abre WebSocket nem consome seq de humano. Ações passam pelo mesmo validador/simulação. Cliente não escolhe livremente controller/actorId. Estados de prontidão, votos e reconexão consideram apenas humanos; slots de bots são gerenciados pelo servidor. Persistir tipo/dificuldade para distinguir resultados. Sem conexão humana, liberar sala e IA.

Mudança de identidade pode exigir protocolo v2. T1 decide migração coordenada de cliente/servidor, leitura de histórico v1 e rejeição clara de cliente incompatível; não declarar a mudança aditiva sem demonstrar compatibilidade.

## 016 — Apresentação

Ocupar viewport não exige mudar regra de pausa ou autoridade. Eventos de resize, ESC, fullscreenchange e falha de fullscreen atualizam somente layout/foco. Controles usam o mesmo pipeline de input e respeitam estado autoritativo. Renderização da bola deriva do mesmo tick interpolado dos atletas.
