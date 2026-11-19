# 021 · Evidências

## T1 · Quadra e domínio

Implementado em Place1 pelo MCP, em modo Edit. Fontes reproduzíveis em roblox/src/server e mapeamento Rojo em roblox/default.project.json. A quadra tem piso de 31,5 × 63 studs, escala 3,5 studs/m, rede de 2,43 m e bola de raio 0,11 m. O gerador eleva a quadra acima da baseplate. A inspeção visual inicial detectou sobreposição com o piso padrão e motivou esse deslocamento explícito de origem.

Verificações executadas:

- Build do domínio TypeScript via npm.cmd run build --workspace @volleyball-mythics/domain, concluído com código 0.
- Geração de fixtures via node roblox/scripts/fixtures.mjs, concluída. 24 trajetórias com 180 ticks cada, 20 golpes do perfil 4 em ambos os lados e alturas, duas sequências de contatos e duas de transições de partida, chão e deslocamento diagonal.
- Execução real de Parity.luau no Place1 via MCP. Resultado de 58.436 verificações, 4.320 ticks de bola e erro absoluto máximo 0, com tolerância 1e-9. Cobertos choque varrido na rede e chão, prioridade do chão, três toques consecutivos no 1v1, falta consecutiva no 2v2, quarto toque, bloqueio, rotação e final 6–5.
- Geração de roblox/Place1.rbxlx via node roblox/scripts/bundle.mjs. O arquivo contém os fontes para construir a quadra ao iniciar Play.

O limite de 200.000 caracteres por Source no Studio exigiu fragmentar os dados de teste. O gerador grava fragmentos abaixo desse limite e o runner fica separado dos scripts de produção.

Limites desta tarefa: comparação de módulos puros em Edit mode. O replay completo do runtime web 020, simulação interativa com quatro atletas, UI, habilidades, bots e desempenho em dispositivos seguem para tarefas posteriores. Ainda não foi executado analisador estático Luau independente. O comando de salvar o Place1 aberto retornou NeedsUserAction porque ele nunca foi salvo. A cópia local reproduzível foi gerada no repositório.
