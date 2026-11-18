# Contrato de habilidades — 019

`roster_abilities` mantém ID, configuração canônica (incluindo nome, descrição, alvo, duração e recarga) e disponibilidade para publicação. A leitura exige a autorização administrativa da 012. A aplicação tem acesso de leitura, e as migrations controlam o catálogo. `roster_write` aceita somente o ID no payload, valida disponibilidade no salvamento e na publicação e copia a configuração canônica para a revisão imutável. A recusa `ability_unavailable` preserva a revisão do rascunho. A retirada de um ID do catálogo não altera revisões anteriores nem partidas ativas.

A migration inicial contém as configurações legadas aprovadas. Os três candidatos da spec entram desabilitados após os handlers passarem os testes. A fixture de velocidade permanece restrita ao desenvolvimento. O aceite de produção da configuração e dos clipes precede a habilitação dos candidatos e do sorteio.

O servidor conserva a ativação manual em rally, o relógio por ticks e o feedback pessoal de ação. Cada alvo recebe no máximo um modificador simultâneo. Uma tentativa sem alvo ativo, durante recarga ou em colisão preserva o efeito e a recarga anteriores. Velocidade afeta o deslocamento. A recepção afeta o alcance de recepção e bloqueio. O ponto especial mantém seu próprio teste de alcance.
