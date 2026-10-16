# Refutacao da tese H6 (rotulo dB -> faderSlot -> trackHeight)

Alvo: tese de que o tremor do fader Bus Master (BusGroups, Android) e um laco de layout causado por `adjustsFontSizeToFit` no rotulo dB do `GroupStrip`.
Commit: 457329c + worktree sujo. Leitura feita nos arquivos como estao no disco. RN 0.78.1, `newArchEnabled=false` (Paper), lido o codigo em `node_modules/react-native/ReactAndroid/.../views/text/ReactTextShadowNode.java` e `ReactTextView.java`.

## Divergencia worktree x commit

- `GroupStrip.tsx` e `FaderDbScale.tsx`: sem diff contra HEAD. As linhas citadas (GroupStrip :189-195, :276-290, :339-345, :374-379) sao as do commit.
- `VerticalGroupFader.tsx`: diff contra HEAD so nos hunks de `onMoveShouldSetPanResponder` (dy>dx) e `pointerEvents="none"` em track/dbScale/thumb (linhas ~204-290). `:117` e `:187-197` identicos ao commit.
- `MasterStrip.tsx` (sem `React.memo`, meter via `useValueStore`), `BusGroupsScreen.tsx` (`masterMeterStore`) e `useBusGroups.ts` divergem do HEAD. O mtime de VerticalGroupFader/MasterStrip/Screen/useBusGroups e 21:11, antes do `sessao.md` (21:18). Ou seja, o que foi observado no aparelho e worktree, nao o commit puro.

## Veredito por eixo

### logic: FALLS (a tese como enunciada; sobrevive um nucleo menor)

O que sobrevive: os elos 3-4 sao mecanicamente possiveis.
- No master retrato (`isCompactLayout = width > height` e falso), `labelPlateText` tem `fontSize: 13` e nenhum `lineHeight` (so o compacto fixa `lineHeight: 12`, GroupStrip :391-394). `mcaLabelPlateText` nao se aplica ao master. A altura do Text, portanto, acompanha a fonte.
- Em Paper, o shrink de `adjustsFontSizeToFit` ocorre no `YogaMeasureFunction` (`ReactTextShadowNode.java:79-110`): enquanto `lineCount > numberOfLines` reduz a fonte em passos de 1 dp (>=2 px) ate `minimumFontScale`, e a altura devolvida e `layout.getLineBottom(...)` do layout ja encolhido (:152-157). Ou seja, a altura medida do Text pode variar entre valores. Isso responde a pergunta "a altura realmente varia?": pode, so quando o texto estoura a largura do plate (ver limites).
- `faderSlot` e `flex:1` dentro de `card` (flex:1) dentro de `wrapper` de altura fixa (`stripHeight`). Qualquer variacao do rodape e absorvida por ele, e `minHeight: 220` nao e restritivo. `onLayout` -> `Math.floor` -> `setMeasuredFaderHeight` muda `trackHeight` quando cruza um dp inteiro.

O que cai:
1. Nao ha laco. A cadeia e aciclica: valor -> texto -> altura do Text -> altura do slot -> `trackHeight`. A altura do Text depende so da string e da largura do plate; nao depende de `trackHeight`. `trackHeight` so influencia o valor via `1 - Y/availableHeight` (audio.ts:12-14), com Y vindo do dedo (`startY + dy`). Ganho de realimentacao ~0 e `setState` com mesmo valor nao re-renderiza. Resultado: um degrau de <=1 dp por troca de valor, nao oscilacao.
2. "Conversao posicao->valor oscila": ordem de grandeza. Variar `availableHeight` em 1 dp (~280 dp uteis) muda `Y/avail` em ~0,35% no pior caso; com a curva X32 (160/80/40 dB por unidade de fader) isso e ~0,14 a ~0,56 dB, unidirecional e so no instante do degrau. Nao e jitter de valor. Alem disso o `useEffect` de sincronizacao (:237-258) sai cedo com `isDragging`, entao o thumb nao e re-posicionado durante o arrasto: o efeito visivel seria desencontro de <=1 dp entre thumb e regua, nao o valor pulando.
3. Suficiencia nao demonstrada: o degrau so existe se o texto realmente estourar a largura (nao medido) e se a fracao de dp cruzar o inteiro. Alternativas nao eliminadas (ver "O que a evidencia sustenta").

### log: FALLS

A evidencia citada (sessao.md) nao diz o que a tese diz.
- Elo (1) "ocorre no Android e muito menos no iOS": o proprio frontmatter do sessao.md descreve o iOS com outro sintoma ("fica sensivel demais ao toque/scroll"), nao tremor menor. Nao ha nenhuma observacao de iOS na sessao (so Redmi Note 9S). Elo sem evidencia.
- "Regua desloca 2-3 px": os dois pontos citados deslocam igual (-10: 1086 vs 1084; -60: 1484 vs 1482). Se `availableHeight` mudasse, as marcas escalariam com a posicao (FaderDbScale.tsx:27, top = (1-pos)*height): -10 fica a ~0,53 da altura e -60 a ~1,0, entao o deslocamento esperado do -10 e ~metade do -60. Deslocamento igual e o de uma translacao, nao de reescala. Com resolucao de 1 px nos numeros, nao exclui a tese, mas tambem nao a confirma; e mais coerente com o container todo se mover (por exemplo o slot centrado com altura diferente) do que com mudanca de escala. Dois screenshots sem timestamp nem correlacao com valor do rotulo.
- "Rotulo alterna '-14.7d' (cortado) / '-7.5dB'": o corte com `ellipsizeMode="clip"` indica que, naquele frame, o texto nao coube mesmo com o shrink. Isso e um indicio de largura apertada (compativel com shrink intermitente nos valores de 7 caracteres), mas tambem de frame inconsistente. Nao prova variacao de altura.
- Os falsificadores executados no mesmo sessao.md (swipe sintetico lento e rapido, gfxinfo 5% janky, p99 28 ms) nao reproduziram tremor; o proprio arquivo registra "tremor nao visto em video" e a lacuna "sem log JS/layout do app". Nenhum `onLayout` medido (a tese admite).
- Confianca "Media" e generosa: o que existe e leitura de codigo mais dois screenshots ambiguos. Eu classificaria como Baixa-Media (hipotese plausivel, nao testada).

### window: SURVIVES (com ressalva)

- As linhas citadas batem com o commit 457329c (GroupStrip e FaderDbScale sem diff; VerticalGroupFader com hunks fora das linhas citadas). Data (2026-10-15) coerente com commit e sessao.
- Ressalva: o runtime foi observado sobre worktree sujo (mudancas do fader do proprio feature, 21:11) e sobre um app reinstalado por outro agente as 21:16:08 (lacuna registrada no sessao.md). A tese fala em "commit fixado", mas o aparelho rodava codigo que inclui `pointerEvents="none"` nos filhos e o meter em store externo. Isso nao invalida a tese sobre o layout (essas mudancas nao tocam GroupStrip/faderSlot), mas a observacao nao e do commit puro.

### contract: SURVIVES (menos a palavra "laco")

- `adjustsFontSizeToFit` em Android/Paper: contrato (e implementacao) permite que o shrink altere a altura medida do Text quando `lineHeight` nao e fixo e a linha excede a largura. Confirmado no codigo RN 0.78.1 lido. Com `lineHeight` fixo (compacto/paisagem) a altura nao varia; a tese so se aplica ao retrato.
- `onLayout`: dispara quando o layout nativo (px inteiros) muda; o handler so muda estado quando o `Math.floor` em dp muda. Compativel com o que a tese descreve nos elos 4.
- `flex:1`: um filho flexivel realmente absorve variacao dos irmaos em container de altura fixa. Correto.
- O que o contrato nao sustenta: realimentacao ciclica. Nem `onLayout` nem `adjustsFontSizeToFit` fazem a altura do Text depender de `trackHeight`.

## O que a evidencia sustenta no lugar

- Sustenta: possibilidade de um degrau de layout de ~1 dp por troca de valor no retrato, quando o rotulo de 7 caracteres ("-14.7dB") passa a encolher e volta ("-7.5dB"). Efeito: regua/trilho reescalam ~1 dp e o thumb, que nao e re-sincronizado durante o arrasto, desencontra ~1 dp. Isso e cosmetico (regua), nao explica "botao treme" nem a conversao instavel.
- Nao sustenta: laco, oscilacao da conversao, causa unica do tremor, e a assimetria Android/iOS.
- Hipoteses concorrentes ainda abertas para o tremor percebido: re-render a ~20 Hz do `GroupStrip` por meter (agora isolado em `MasterStrip`), eco OSC do console brigando com o drag (H1-H5 da spec), captura do gesto pelo ScrollView.

## Falsificador barato proposto (nao executado)

1. No retrato, fixar `lineHeight`/`height` do `labelPlateText` e `labelPlate` (por exemplo `lineHeight: 16`, `includeFontPadding: false`, como ja ha para MCA) e repetir o arrasto: se a regua ainda desloca, a tese cai de vez.
2. Ou logar `onLayout` do faderSlot e o `fontSize` efetivo durante um arrasto real (dedo, nao `adb input swipe`).

## Limites do que nao consegui verificar

- Nenhuma execucao em aparelho nem medicao de `onLayout`; sem largura real do plate (`spacing.xs` nao lido) nem metricas da fonte 900 para saber se "-14.7dB" estoura de fato a 13sp.
- Nao ha dado de iOS.
- Os screenshots citados nao foram abertos (so os numeros do sessao.md).
- Nao verifiquei se `setMeasuredFaderHeight` dispara com frequencia real; so que pode.
- Comportamento do Fabric nao avaliado (app roda Paper).
