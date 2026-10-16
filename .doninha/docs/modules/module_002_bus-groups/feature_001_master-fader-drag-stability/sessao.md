---
status: 'analyzed'
stepsCompleted: [1, 2, 3, 6]
feature_id: 'feature_001'
feature_title: 'Tremor do fader Bus Master no Android e sensibilidade no iOS'
feature_slug: 'master-fader-drag-stability'
feature_folder: '.doninha/docs/modules/module_002_bus-groups/feature_001_master-fader-drag-stability/'
mode: 'investigacao'
source_ref: ''
attachments_read: ''
rn_placement: ''
business_rules: []
initial_answers: {}
ideation_technique: ''
grilling: {}
derivado: {}
alternativas: ''
validation_approved: true
brainstorming_notes: ''
pbis_created:
  - {n: 1, id_local: 'pbi-001', slug: 'fader-master-altura-estavel', invest_ok: true}
  - {n: 2, id_local: 'pbi-002', slug: 'fader-master-gesto-osc-medidor', invest_ok: true}
ux_proposals: []
symptom_class: ['dado-errado']
capabilities: { source: { provider: git-local, access: 'cli:git', scope: 'x32-control @ 457329c' }, logs: { provider: none, access: 'manual', notes: 'adb logcat nao carrega logs JS; sem log de layout do app' }, runtime: { provider: adb, access: 'cli:adb', scope: 'Redmi Note 9S 7b877dc7 (gfxinfo, screencap, input swipe)' } }
lacunas: ['logs: sem log JS/layout do app em runtime', 'swipe sintetico (adb input) nao reproduz toque humano; tremor nao visto em video', 'outro agente reinstalou o app no aparelho as 21:16:08 (pid mudou)']
sintoma: 'Fader Bus Master (BusGroups) treme no Android (botao e regua) ao arrastar; no iOS fica sensivel demais ao toque/scroll. Persiste apos correcao de gesto/OSC/medidor.'
objetivo: 'Ajustar o volume do BUS com precisao enquanto toca/ensaia, sem o fader pular.'
---

## Achados da sessao (2026-10-15, commit 457329c + worktree)

- Janela: 2026-10-15; sem commit novo no fader desde a spec master-fader-drag-stability.
- Falsificadores executados: swipe vertical lento 3s/4s/8s e rapido 8x120ms (gfxinfo: 5% janky, p50 14ms, p99 28ms); swipe com deriva horizontal de 61px (nao rolou a faixa, fader moveu normal); bundle servido pelo Metro contem as correcoes (MASTER_FADER_SEND_INTERVAL_MS). H5 por deriva ate 61px: rejeitada nesse nivel.
- Observacao: entre screenshots durante o arrasto, regua dB do master desloca 2-3 px (-10: y=1086 vs 1084; -60: 1484 vs 1482, em px de exibicao) e o rotulo do valor alterna "-14.7d" (cortado) / "-7.5dB" (completo).
- Tese candidata (H6): rotulo dB do GroupStrip (adjustsFontSizeToFit, sem altura fixa) muda de tamanho a cada valor -> altura do rodape muda 1-2px -> faderSlot (flex:1) muda -> handleFaderSlotLayout -> setMeasuredFaderHeight -> trackHeight/availableHeight do VerticalGroupFader mudam durante o arrasto -> regua, trilho e conversao posicao->valor tremem.
  - GroupStrip.tsx:189-195 (onLayout -> setMeasuredFaderHeight), :276-290 (Text adjustsFontSizeToFit/numberOfLines 1), :339-345 (faderSlot flex 1), :374-379 (labelPlate sem height); VerticalGroupFader.tsx:117 (availableHeight), :187-197 (updateFromPosition usa availableHeightRef).

## Sondagem fora do roteiro (enquanto o estagio adversarial roda)

- FaderDbScale.tsx: posicao de cada marca = (1 - pos) * `height` (availableHeight); qualquer variacao de trackHeight move todas as marcas da regua juntas -> consistente com "regua tremendo".
- Toast vermelho "[Tacimix UDP] send_error host 2..." apareceu na tela de descoberta apos o app ser reinstalado pelo outro agente (21:16:08); origem em UdpTransport.ts:296; nao ligado ao fader, registrado como achado lateral (confianca baixa).

## Estagio adversarial (veredito lido de refutacao.md)

- logic: FALLS (nao ha laco; degrau de ~1 dp muda o valor 0,14-0,56 dB uma vez; so no retrato). Verifiquei: o useEffect de sincronizacao sai cedo com isDragging (VerticalGroupFader.tsx:~210) e availableHeightRef so muda por trackHeight; a cadeia valor->texto->slot->trackHeight e aciclica. Aceito.
- log: FALLS (deslocamentos da regua ~iguais nos pontos medidos, resolucao de 1 px, sem onLayout medido). Verifiquei nos meus screenshots: +10 fixo em 554, demais 0-3 px, dentro do ruido. Aceito.
- window: SURVIVES (com ressalva: runtime observado sobre worktree sujo + app reinstalado).
- contract: SURVIVES (sem "laco").
- Resultado: >= 2 eixos caem -> H6 morta como causa do tremor; fica no maximo como degrau cosmetico de ~1 dp. Antes: causa provavel (Media). Agora: nao provada.
- Falsificador que decidiria: logar onLayout do faderSlot + grant/terminate/move + remoto durante arrasto com dedo real (exige edicao de codigo; este modo nao edita).

## Instrumentacao com dedo real (Redmi, mesa real, BUS 07, ~10 s de arrasto) — 2026-10-15 21:2x

Excecao autorizada pelo usuario a regra "nao editar" (logs temporarios, removidos ao fim; tsc e jest busGroups verdes apos remocao).

- faderSlot.onLayout do Bus Master: 57 eventos em ~10 s (~6/s); altura alterna 466.9 <-> 462.9 <-> 465.8 dp -> availableHeight 406 <-> 402 <-> 405 (27x 406, 17x 402, 11x 405). Amplitude 4 dp, repetida durante o arrasto.
- TERMINATE: 0 (o gesto nao e cancelado). remote.master: 0 (sem eco da mesa; H2 rejeitada neste teste). meter updates: 0 (sem sinal no BUS; H1 nao testada com sinal).
- master.move ~26-39/s, setMasterFader idem, master.osc.send ~12-16/s (throttle de 40 ms funciona), renders do fader ~34-49/s.
- Resultado: H6 CONFIRMADA empiricamente como fonte da variacao de trackHeight durante o arrasto. A refutacao adversarial acertou que nao ha laco (cadeia aciclica), mas errou a magnitude/frequencia ("degrau unico de ~1 dp"): medido 4 dp, varias vezes por segundo. Antes (adversarial): tese morta / confianca Baixa-Media. Agora: causa do tremor de regua/trilho confirmada (Alta p/ a oscilacao de altura; que ela seja TODA a sensacao de tremor do botao nao foi medido).
- Pendente: iOS (sensibilidade) sem dado; meter com sinal nao testado.

## Confirmacao (2026-10-15)
- Usuario confirmou no Android, com dedo real, que o tremor do Bus Master foi corrigido (lineHeight fixo no rotulo dB). Laudo/PBIs do doninha-analisar nao gerados; iOS em aberto.
- iOS: usuario confirmou que funcionou (2026-10-15). Feature considerada resolvida; laudo/PBIs nao gerados por nao serem mais necessarios.
