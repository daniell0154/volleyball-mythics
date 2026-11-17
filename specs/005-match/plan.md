# Plano técnico
Integrar features anteriores; resultado persistido com retries limitados. Sem reinício do servidor transparente.

Escopo adicional confirmado em 2026-11-16: reunir nesta branch o cadastro/visuais de Samuel e Caio, câmera em terceira pessoa seguindo o jogador local e botões de ações funcionais. A UI deve distinguir demonstração de partida online. Habilidades especiais continuam registradas como conteúdo até o handler validado da 006; não ativar efeitos arbitrários do banco.

Convenção espacial: time A ocupa z<0, B ocupa z>0. Bola dentro concede ponto ao lado oposto ao chão atingido, independentemente do último toque; fora concede ao adversário do último toque. Corrigir o helper legado de domínio e seus testes antes de integrar pontuação. Teclado é relativo à câmera de cada lado e convertido em movimento do mundo pelo cliente; servidor limita valores e posições.

Dependências concluídas: 004.
Respeitar contratos v1. Pastas abaixo são destinos futuros, não código existente. Não criar infraestrutura além do necessário para a feature.

Gate: todos os aceites de tasks.md comprovados em evidence.md; decisões alteradas registradas antes da próxima feature.

