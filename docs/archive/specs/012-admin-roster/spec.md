# Administração do elenco
Status: T1–T4 concluídas com testes locais e aprovação do proprietário. Configuração/validação Auth/RPC remota no Supabase adiada explicitamente pelo proprietário.
Requisito R12. Dependência: 011 integrada.

## Aceitação
- Admin autenticado pode criar, revisar, publicar e desativar personagens; jogador guest não acessa escrita. Papel de admin validado no servidor e RLS; nunca confiar em flag do navegador ou expor service role. Provisionamento inicial do proprietário documentado, sem senha fixa no código.
- Formulário com nome, sete atributos inteiros 1–100, overall calculado, habilidade existente com configuração validada e visual procedural permitido. Mostrar erros junto aos campos e preview do atleta. Criar novas mecânicas de habilidade e importar modelos arbitrários ficam fora do escopo.
- Rascunho não aparece no jogo. Publicação é transacional e cria revisão imutável; edição posterior gera nova versão. Desativar impede novas seleções sem apagar histórico ou mudar partidas em andamento. Conflitos de edição retornam erro recuperável.
- Catálogo publicado aparece em novas entradas/salas sem rebuild do frontend. Versão selecionada é revalidada ao iniciar; partidas fixam revisão e visual. Resolver visuais de novos atletas sem exigir edição manual do manifesto; manter visuais aprovados de Samuel/Caio.
- Auditar autor/data/operação/versões sem tokens. Testar escrita direta não autorizada, payload inválido, publicação concorrente, desativação e partida já iniciada. Elenco real é fornecido pelo proprietário; fixtures só em teste.

Gate: tarefas completas, evidências reproduzíveis e aceite do proprietário nos critérios de experiência. Mudanças de metas exigem decisão registrada antes do fechamento.

Aceite final: após receber os resultados e limites, o proprietário informou “aprovado, depois eu configuro no supabase. so me passa o que eu preciso subir.” O gate desta entrega usa evidências locais e essa aprovação; provisionamento da conta, aplicação de migrations e validação Auth/RPC remota permanecem etapas de configuração posteriores, sem alegação de execução. Instruções em docs/admin/012-operations.md; gates de publicação da 007 continuam independentes.

