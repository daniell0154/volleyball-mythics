# 008 — Integração e reprodução

Direção autorizada pelo proprietário: proporções atléticas no estilo Happy Hoops. Modelagem original em Three.js, sem importar assets da referência.

## Identidade e versionamento

As chaves procedural:v1 iniciais permanecem no catálogo. avatarManifest.ts associa explicitamente as duas chaves ao renderer athletic-v2; o construtor createAvatar v1 mantém o visual antigo para compatibilidade e ferramentas de comparação. Outras chaves usam v1 até uma associação revisada. O renderer atlético usa as mesmas sementes de pele/cabelo/acento/altura. Nenhum atributo ou poder foi alterado.

Essa é uma revisão de apresentação distribuída com o cliente, não uma revisão de banco. Clientes com builds diferentes podem ver a versão visual anterior; servidor e resultado permanecem compatíveis. Preview e partida no mesmo build resolvem pelo mesmo manifesto. Para reverter a apresentação, remover as duas associações e gerar novo build.

## Rig

Raiz nos pés, metros, frente local +Z. hips → spine → neck → head. Braços: left/rightShoulder → Elbow → Wrist. Pernas: left/rightHip → Knee → Ankle. Cotovelo e joelho são origens dos segmentos inferiores; rotações não deslocam o encaixe do segmento. Há leve flexão inicial de cotovelo. Animação contínua pertence à spec 009.

Materiais são compartilhados apenas dentro do atleta; geometria é própria por mesh. disposeAvatar coleta recursos únicos antes de liberar e também atende a cena completa. Não chamar descarte enquanto outro consumidor usa o mesmo objeto de modelo.

## Medição e revisão

Iniciar Vite na raiz em 5176 como no documento de direção; executar:

```powershell
node docs/art/008-candidate.cjs --candidate
```

O script captura 008-models.png e 008-candidate-court.png, mede cinco minutos e testa dez ciclos de alocação/render/descarte de um atleta no mesmo renderer. Registra chamadas de desenho e triângulos de um atleta, e contadores de geometrias/texturas após cada descarte. São contadores do renderer, não medição de heap/VRAM em bytes. O arquivo 008-baseline.json é histórico da medição anterior; reproduzir a medição antiga requer checkout 3727800, porque createScene agora usa o manifesto novo.

As vistas distantes da prancha são ilustrativas. A captura da quadra vem do adaptador real usando snapshots sintéticos com quatro atletas; não é prova de nova sessão multiplayer. Aprovação da direção autoriza desenvolvimento, mas o reconhecimento final de ambos pelo proprietário continua no gate T4.
