# Plano técnico — 018

O ponto de partida é `apps/web/src/admin/Admin.tsx`, com dois painéis, seleção de modelo e seed numérica. `CharacterPreview.tsx` já monta um avatar por `assetKey`. A SPEC 018 pode partir da 012 integrada e independe da câmera.

1. Prototipar a grade em `styles.css` com dados de rascunho e publicado. Reutilizar serviços, revisão esperada e avisos de conflito da 012. Agrupar os itens carregados sem inferir o total do elenco pela quantidade da página.
2. Especificar uma chave procedural versionada para modelo, seed original, tom e penteado com IDs estáveis de uma paleta e galeria finitas. Renderizar legados v1/v2 pelo resolvedor atual. Só gerar a nova chave ao editar aparência. Na nova chave, usar a seed para as demais características. Conferir o limite da chave em banco e protocolo antes de definir a codificação.
3. Atualizar por migração a validação de `roster_write`, os tipos/validadores, manifesto e construtor do avatar usados por admin, lobby e quadra. Rejeitar combinações desconhecidas. Abrir, salvar e publicar fichas antigas sem mudar seu visual, inclusive no caminho que hoje converte chaves v1 para v2. Manter revisões publicadas imutáveis.
4. Gerar miniaturas a partir do mesmo modelo com enquadramento fixo da cabeça. Usar um único canvas interativo na prévia e liberar recursos ao sair. Validar edição repetida, falha de WebGL, conflito de revisão e retorno após recarga. Comparar capturas do admin à referência e verificar o atleta publicado no lobby e nos times A e B.
