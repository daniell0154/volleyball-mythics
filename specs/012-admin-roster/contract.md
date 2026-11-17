# Contrato 012

API de gestão: RPCs PostgREST autenticadas com JWT de usuário, sem secret no cliente. is_roster_admin exige membership no banco e JWT não anônimo; RLS filtra leituras, escrita direta negada inclusive ao admin. Funções mutantes verificam autorização a cada chamada e executam com search_path fixo.

character_drafts: id textual 1–64, revision otimista, payload <=8KiB, autor/data. O id textual mantém compatibilidade com samuel/caio e gera UUID textual para novos atletas. Save espera revision=0 para criar ou revision atual para editar; conflito 40001. Publish e disable também exigem revision esperada, serializando operações pelo id e incrementando revision. Publicação cria max(version)+1 e desabilita revisões anteriores na mesma transação. Apenas enabled pode mudar numa revisão publicada. Auditoria registra autor/operação/revisão, sem credenciais.

Payload: name 1–64, attributes com serve/receive/set/attack/block/speed/jump inteiros 1–100, abilityId de um dos dois handlers existentes e assetKey procedural permitido. A API resolve configuração canônica da habilidade já publicada; JSON de mecânicas arbitrário não é aceito. Overall calculado pelo banco. Rascunho só salva payload válido.

Leituras paginadas até 50 itens, ordenação id; revisões por personagem ordenadas por version. Catálogo do jogo inclui somente enabled. Servidor recarrega catálogo antes de comandos de seleção/prontidão/início/revanche e periodicamente enquanto houver sessões; falha ao revalidar rejeita comando. Partidas ativas têm atributos/visual/poder fixados pelo runtime. Novos visuais usam namespace procedural:athletic-v2 com seed uint32 e resolvedor compartilhado; chaves v1 preservam o comportamento histórico.
