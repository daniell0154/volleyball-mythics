# Plano

Fonte canônica em content/characters/initial.json. Script valida overall e identidade do visual, gera migration e publica sem sobrescrever revisões existentes. Fichas de habilidade descrevem alvo, fase, duração, cooldown, feedback e limite de aplicação.

Visual 3D criado em código Three.js, sem bitmap: seed aleatória gravada em assetKey para variar pele, cabelo, proporções e detalhes. Gênero explícito no dado, nunca inferido em runtime a partir do nome. A cor da equipe permanece legível. A partida captura assetKey no início, preservando aparência caso o catálogo mude.

Preparação iniciada em branch própria baseada na main com 004 integrada. Por solicitação posterior explícita, os commits de conteúdo/visuais foram reunidos na PR da 005-match, preservando IDs ROSTER-T1/T2. Não fazer merge automaticamente.
