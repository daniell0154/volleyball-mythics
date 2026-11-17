# Animações de locomoção e ações
Status: implementada; T1–T4 verificadas e animações aprovadas pelo proprietário. Aguardando integração.
Requisito R09: animações de locomoção e ações para a versão de tese.

## Escopo e referência
Seguir [documento de melhorias](../../docs/MELHORIAS.md). Samuel e Caio são iniciais; permitir expansão do catálogo. Preservar autoridade do servidor, 1v1/2v2 e primeiro a seis.

## Dependências
008 integrada e rig aprovado.

## Aceitação
- **Contrato de ações visuais:** Especificar ação aceita com identidade, tipo, tick inicial e identificador de ocorrência. Compatibilidade com protocolo v1 deve ser decidida antes do código; leitores toleram ausência. Não confiar em animação enviada pelo cliente.
- **Locomoção e saltos:** Idle, deslocamento, salto, queda e aterrissagem com blends; orientação acompanha movimento/ação. Usar delta temporal, não número de frames. Pausa por desconexão congela poses e retomada não reinicia golpes.
- **Golpes e especiais:** Implementar saque, recepção, levantamento, ataque, bloqueio, bronca e reação de Caio. Estado visual distingue ação recusada de confirmada; contato visual fica a até um snapshot (50 ms na configuração atual) do contato na timeline interpolada.
- **Rede e ciclo de vida:** Eventos repetidos não repetem golpes; perdas/transições rápidas se recuperam via estado durável ou janela limitada de eventos nos snapshots. Reconexão busca pose vigente sem repetir sons/efeitos antigos. Verificar 30/60/120 FPS, RTT 150 ms/jitter 30 ms e orçamento de render.

Gate: todos os aceites de tasks.md com evidências reais; critérios visuais exigem aprovação do proprietário. Conteúdo novo, bots e publicação ficam fora desta spec.

