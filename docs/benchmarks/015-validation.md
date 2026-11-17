# 015 — bots: operação e evidências

## Banco e compatibilidade

Aplicar a migration 202611170007_bot_participants.sql após as anteriores. Ela mantém histórico e RPCs humanos e cria persist_bot_match_result e match_participants para atores sem conta Auth. A conta do proprietário já foi tratada na 012; não criar contas Auth para bots. Proprietário informou ter aplicado todas as migrations e criado a conta; isso é relato do proprietário, não teste remoto executado pelo implementador.

RPC nova exige service_role apenas no backend. Frontend usa chave pública e JWT humano; nunca expor secret em VITE_. Resultados de partidas contra bots podem retornar falha de salvamento até aplicar a migration/configurar o backend; não transformar essa falha em sucesso no cliente.

## Executar

```powershell
npm run build
node supabase/tests/database/015_bots.cjs
node docs/benchmarks/015-calibration.mjs
node docs/benchmarks/015-load.mjs
```

Calibração usa 20 partidas por nível com mesmos seeds/atributos e primeiro saque alternado contra um agente de teste fixo, política easy (400ms/erro1,8m). Normal contra espelho normal produzia rallies censurados longos; não foi usada para afirmar vitórias. Política final tem escolha de espaço vazio por observações atrasadas, usando aim limitado e inputs normais.

Resultados: fácil 10/20 vitórias, normal 20/20 e difícil 20/20; todas as 60 partidas terminaram. Normal/difícil saturam esse adversário e têm sobreposição total no resultado; não alegar separação estatística de habilidade humana. Dificuldades diferem em reação e erro, sem buff físico. Em 20 partidas solo de humano que só saca e fica parado, contra normal, humano venceu 0/20; não garante dificuldade apropriada para iniciantes reais.

Carga padrão roda quinze minutos de relógio real, dez salas solo/30 bots, comparando dez salas humanas ociosas no mesmo processo. Mede custo de advance, snapshots sem serialização/rede, histórico limitado e descarte. Não equivale a dez salas na internet nem uso de renderer. Se alterar a política, repetir a medição; não apresentar execução interrompida como carga aprovada.

Resultado prolongado: 900030ms, p951,52ms, máximo185,56ms, memória observada limitada e zero partidas após descarte. Depois foi corrigida uma condição constante de observação atrasada para não tocar no próprio saque; sem novo algoritmo/coleção. Gate registra separadamente regressão pós-correção de60009ms, p953,11ms e descarte aprovado, sem dizer que esta durou15min. O teste adicional de40 saques com normal passou a100% de devolução. Teste de navegador repetido depois da correção passou solo/coop,0x6 e revanche, com seed/dificuldade preservados.

## Aceite visual

Iniciar `node docs/acceptance/015-fixture-server.mjs` e Vite na raiz com config apps/web/vite.config.ts, porta 5180. Abrir http://127.0.0.1:5180/docs/acceptance/015-preview/ ou executar `node docs/acceptance/015-bots.cjs`.

Solo: um humano com parceiro bot contra dois bots. Dupla: dois humanos convidados contra dois bots. Dificuldade escolhida antes de criar a sala. Bot/seed/política são definidos no servidor e permanecem na revanche; somente humanos precisam marcar pronto, reconectar e votar. Sala humana continua exigindo quatro humanos e nunca recebe preenchimento automático.

Harness usa gateway guest local e persistência sem banco; runtime/transporte/IA/resultados são reais. Teste SQL separado cobre autorização e transações. Nenhum teste de login/RPC remoto Supabase é inferido. Delegação do proprietário permite concluir por testes/inspeção técnica e merge sem pedir novo aceite; diversão humana permanece sem medição.
