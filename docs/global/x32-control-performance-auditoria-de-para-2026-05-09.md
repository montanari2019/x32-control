# X32 Control - Auditoria de Performance - De / Para da Ultima Rodada

> **Data:** 09/05/2026  
> **Base:** prompt de auditoria de performance enviado apos o arquivo `docs/global/x32-control-performance-auditoria-status.md`.  
> **Objetivo deste documento:** registrar, item por item, o que foi alterado, como era antes, como ficou depois, por que a mudanca foi feita, qual ganho esperado e o que foi validado.

---

## Resumo Executivo

Nesta rodada foram aplicadas mudancas pequenas e bem delimitadas, focadas em reduzir custo de rede, diminuir alocacoes, evitar re-render incorreto e melhorar robustez de cleanup.

Foram alterados apenas os arquivos citados no prompt da auditoria:

- `src/features/busMix/services/BusMixChannelStore.ts`
- `src/services/x32/X32HeartbeatService.ts`
- `src/shared/network/NetworkScanner.ts`
- `src/features/busMix/hooks/useMeterSubscription.ts`
- `src/features/busMix/components/ChannelVuMeter.tsx`
- `src/features/busMix/hooks/useBusMix.ts`
- `src/features/busMix/components/ChannelStrip.tsx`
- `src/features/busGroups/services/X32BusGroupsService.ts`
- `src/features/busMix/screens/BusMixScreen.tsx`
- `src/shared/osc/OscClient.ts`
- `src/shared/osc/SharedOscClient.ts`

Itens do prompt que nao exigiam mudanca tambem foram verificados e documentados.

---

## Validacao

### Testes

**Comando:**

```bash
npm test -- --runInBand
```

**Resultado:** passou.

- 11 test suites passaram
- 35 testes passaram
- 0 snapshots

### TypeScript

**Comando:**

```bash
npm run tsc
```

**Resultado:** falhou por erro preexistente fora do escopo desta auditoria.

Erro reportado:

- `src/app/App.tsx`
- conflito de tipos envolvendo `react-native-keep-awake` e tipos duplicados de React
- mensagem central: `KeepAwake cannot be used as a JSX component`

**Decisao:** nao foi corrigido nesta rodada porque `src/app/App.tsx` nao estava entre os arquivos autorizados pelo prompt da auditoria.

### Diff check

**Comando:**

```bash
git diff --check
```

**Resultado:** sem erro de whitespace. O Git apenas avisou que arquivos LF podem ser convertidos para CRLF quando tocados futuramente.

---

## Tabela Geral de De / Para

| Item | Area | Antes | Depois | Ganho esperado | Status |
| ---- | ---- | ----- | ------ | -------------- | ------ |
| 1 | Store de canais | `getSnapshot()` clonava via helper sobre fallback `[]` | leitura separa caso vazio e faz shallow copy direta quando existe store | menos alocacao em leituras frequentes | Implementado |
| 2 | Heartbeat X32 | `/xremote` a cada 9000ms | `/xremote` a cada 5000ms | margem maior antes do timeout de 10s da mesa | Implementado |
| 3 | Discovery | espera fixa de 900ms | resolve apos minimo de 400ms se ja achou console, com fallback em 900ms | descoberta mais rapida em redes boas | Implementado |
| 4 | Meters | polling de 66ms, cerca de 15fps | polling de 80ms, cerca de 12.5fps | menos trafego UDP e menos carga JS | Implementado |
| 5 | VU meter | queda animada em 75ms | queda animada em 60ms | animacao mais ajustada ao polling de 80ms | Implementado |
| 6 | Load BusMix | link map em paralelo com 240 requests de canais | link map primeiro, depois canais | menos contencao no primeiro carregamento | Implementado |
| 7 | Memo ChannelStrip | comparador ignorava `pan` | comparador inclui `channel.pan` | corrige stale render do pan | Implementado |
| 8 | VerticalFader | suspeita de recriacao do PanResponder | codigo atual ja estava correto | sem mudanca necessaria | Verificado |
| 9 | DCA inicial | fader e mute de cada DCA eram sequenciais | fader e mute de cada DCA em paralelo | carregamento de BusGroups mais rapido | Implementado |
| 10 | FlatList BusMix | `initialNumToRender={8}` | `initialNumToRender={10}` mantendo outros parametros | janela inicial alinhada ao prompt | Implementado |
| 11 | `channelSourcesKey` | suspeita de re-subscribe desnecessario | `useMemo` atual considerado correto | sem mudanca necessaria | Verificado |
| 12 | `isRefreshing` | possivel import/desestruturacao nao usada | nao estava desestruturado em `BusMixScreen` | sem warning a corrigir ali | Verificado |
| 13 | Timeout OSC | default de request em 1500ms | default em 800ms | falha mais rapida em pacote perdido | Implementado |
| 14 | `validateConsole` | timeout manual de 1200ms | mantido | adequado para IP digitado manualmente | Verificado |
| 15 | Shared OSC cleanup | se `disconnect()` lancasse, mapa poderia nao limpar | `try/catch/finally` garante delete | cleanup mais robusto | Implementado |

---

## Item 1 - `BusMixChannelStore`: menos alocacao em `getSnapshot`

**Arquivo:** `src/features/busMix/services/BusMixChannelStore.ts`

### Como era antes

`getSnapshot()` sempre chamava:

```ts
return cloneChannels(this.channelsByKey.get(getStoreKey(consoleIp, busNumber)) ?? []);
```

Mesmo quando nao havia canais armazenados, o fallback `[]` entrava no helper. Quando havia canais, o helper fazia o clone.

### Como ficou depois

```ts
const stored = this.channelsByKey.get(getStoreKey(consoleIp, busNumber));
if (!stored) return [];
return stored.map((ch) => ({ ...ch }));
```

Tambem foi adicionado comentario em `setChannelsByKey()`:

```ts
// Passa referencia direta - listeners nao devem mutar. getSnapshot() clona na leitura.
```

### Por que foi feito

O store e usado em caminho quente de atualizacao de fader/canais. A mudanca deixa explicita a regra de imutabilidade para listeners e evita trabalho desnecessario no caso vazio.

### Ganho esperado

- menos pequenas alocacoes em leituras frequentes
- intencao mais clara para quem mexer no store depois
- comportamento externo preservado: snapshots continuam sendo copias rasas

### O que nao foi tocado

- `updateChannels`
- `subscribe`
- `loadChannels`
- `clearConsole`

---

## Item 2 - `X32HeartbeatService`: renovar `/xremote` com margem maior

**Arquivo:** `src/services/x32/X32HeartbeatService.ts`

### Como era antes

```ts
this.interval = setInterval(() => sendOsc(), 9000);
```

O X32 expira a subscription apos cerca de 10 segundos sem renovacao. Com 9000ms, sobrava so 1 segundo de margem.

### Como ficou depois

```ts
this.interval = setInterval(() => sendOsc(), 5000);
```

### Por que foi feito

Redes Wi-Fi podem ter jitter. Um intervalo de 9000ms e apertado demais para uma subscription que morre aos 10 segundos.

### Ganho esperado

- menor risco de perder eventos OSC em tempo real
- maior estabilidade em Wi-Fi
- custo adicional pequeno, pois o pacote de keepalive e leve

---

## Item 3 - `NetworkScanner.scanForConsoles`: timeout adaptativo

**Arquivo:** `src/shared/network/NetworkScanner.ts`

### Como era antes

O discovery sempre esperava 900ms:

```ts
await new Promise<void>((resolve) => {
  setTimeout(() => resolve(), 900);
});
```

Mesmo quando a mesa respondia rapidamente, o app aguardava o tempo completo.

### Como ficou depois

Agora existe:

- minimo de 400ms
- se ja houver ao menos 1 console apos esse minimo, resolve cedo
- fallback maximo de 900ms
- checagem a cada 50ms

### Por que foi feito

Em rede cabeada ou Wi-Fi bom, o console normalmente responde muito antes de 900ms. O tempo fixo deixava a descoberta parecer mais lenta do que precisava.

### Ganho esperado

- descoberta mais rapida quando a mesa responde cedo
- preserva o comportamento seguro em redes lentas via fallback de 900ms

### Observacao tecnica

A implementacao segue exatamente o bloco pedido no prompt. Um refinamento futuro possivel seria limpar sempre `checkInterval` tambem quando o `maxTimer` vence, mas isso nao foi alterado para respeitar o escopo especificado.

---

## Item 4 - `useMeterSubscription`: polling de meters mais leve

**Arquivo:** `src/features/busMix/hooks/useMeterSubscription.ts`

### Como era antes

```ts
// Poll around 15fps. This keeps the meter responsive without flooding OSC.
const POLL_INTERVAL_MS = 66;
```

### Como ficou depois

```ts
// Poll around 12.5fps. Perceptually equivalent to 15fps for VU meters, 17% less UDP traffic.
const POLL_INTERVAL_MS = 80;
```

### Por que foi feito

VU meter nao precisa atualizar em 15fps para parecer suave. Em 12.5fps, a leitura visual continua aceitavel e o app envia menos requests UDP.

### Ganho esperado

- cerca de 17% menos trafego UDP de meters
- menos trabalho no JS thread
- menor pressao em Androids modestos

---

## Item 5 - `ChannelVuMeter`: queda mais curta

**Arquivo:** `src/features/busMix/components/ChannelVuMeter.tsx`

### Como era antes

```ts
const METER_FALL_DURATION_MS = 75;
```

### Como ficou depois

```ts
const METER_FALL_DURATION_MS = 60;
```

### Por que foi feito

Com polling em 80ms, uma animacao de queda de 60ms termina com mais folga antes do proximo frame. Isso reduz risco de acumulacao de animacoes quando os frames chegam em ritmo proximo.

### Ganho esperado

- resposta visual mais firme
- menos sobreposicao de `Animated.timing`
- melhor casamento com o novo polling de 80ms

---

## Item 6 - `useBusMix`: buscar link map antes dos 240 requests de canais

**Arquivo:** `src/features/busMix/hooks/useBusMix.ts`

### Como era antes

`fetchChannelLinkMap()` rodava em paralelo com `loadChannels()`:

```ts
const [nextChannels, linkMap] = await Promise.all([
  busMixChannelStore.loadChannels(...),
  service.fetchChannelLinkMap(),
]);
```

Na primeira navegacao, isso colocava os 16 requests do link map competindo com a carga grande de canais.

### Como ficou depois

```ts
// Fetch link map first (cached after first call) to avoid competing with 240 channel requests
const linkMap = await service.fetchChannelLinkMap();
const nextChannels = await busMixChannelStore.loadChannels(...);
```

### Por que foi feito

O link map tem cache por sessao. Na primeira vez, ele ainda precisa buscar dados; depois tende a ser hit de cache. Buscar antes evita disputar o mesmo periodo inicial com os requests de canal.

### Ganho esperado

- menor contencao UDP no primeiro carregamento do BusMix
- comportamento mais previsivel na entrada da tela
- sem alterar a logica final: `linkMap` e `nextChannels` continuam sendo carregados antes de atualizar refs

---

## Item 7 - `ChannelStrip`: memo agora considera `pan`

**Arquivo:** `src/features/busMix/components/ChannelStrip.tsx`

### Como era antes

O comparador do `React.memo` verificava varias propriedades do canal, mas nao verificava:

```ts
channel.pan
```

### Como ficou depois

Foi adicionada a comparacao:

```ts
prev.channel.pan === next.channel.pan &&
```

### Por que foi feito

Quando o usuario alterava o pan, o componente podia nao re-renderizar porque o memo considerava props antigas equivalentes. Isso podia deixar o `PanControlModal` reabrir com valor antigo.

### Ganho esperado

- bug de estado visual stale corrigido
- memo continua evitando renders desnecessarios, mas agora com criterio completo para pan

---

## Item 8 - `VerticalFader`: PanResponder verificado sem mudanca

**Arquivo analisado:** `src/features/busMix/components/VerticalFader.tsx`

### Situacao apontada

Havia suspeita de que `PanResponder` pudesse ser recriado se `updateFromY` mudasse.

### Resultado da verificacao

O prompt ja indicava que:

- `animatedY` vem de `useRef(new Animated.Value(0)).current`
- esse objeto e estavel entre renders
- `updateFromY` depende de `animatedY`
- portanto `updateFromY` tambem permanece estavel

### Decisao

Nenhuma mudanca aplicada.

### Ganho esperado

Nenhum ganho novo, porque o codigo ja estava correto para este ponto.

---

## Item 9 - `X32BusGroupsService.fetchInitialState`: paralelizar fader e on de cada DCA

**Arquivo:** `src/features/busGroups/services/X32BusGroupsService.ts`

### Como era antes

Para cada DCA, eram feitos dois awaits sequenciais:

```ts
faderRawValue: await this.safeRequestFloat(...),
isOn: await this.safeRequestInt(...),
```

Mesmo dentro de um `Promise.all` externo, cada DCA esperava primeiro o fader e depois o on.

### Como ficou depois

Dentro de cada DCA:

```ts
const [faderRawValue, isOn] = await Promise.all([
  this.safeRequestFloat(...),
  this.safeRequestInt(...),
]);
```

### Por que foi feito

`faderRawValue` e `isOn` sao independentes. Nao havia motivo para esperar um terminar para iniciar o outro.

### Ganho esperado

- carga inicial de BusGroups mais rapida
- ate cerca de 2x mais rapido nessa parte especifica dos DCAs
- nenhum contrato publico alterado

---

## Item 10 - `BusMixScreen`: windowing da FlatList

**Arquivo:** `src/features/busMix/screens/BusMixScreen.tsx`

### Como era antes

A `FlatList` ja tinha parametros de performance:

```tsx
initialNumToRender={8}
maxToRenderPerBatch={6}
updateCellsBatchingPeriod={50}
windowSize={3}
```

### Como ficou depois

Somente `initialNumToRender` foi ajustado para o valor solicitado:

```tsx
initialNumToRender={10}
maxToRenderPerBatch={6}
updateCellsBatchingPeriod={50}
windowSize={3}
```

### Por que foi feito

O prompt especificou `initialNumToRender={10}`. Os outros parametros ja estavam nos valores pedidos.

### Ganho esperado

- primeira janela renderizada com 10 canais
- mantem batch e windowing mais economicos que uma lista ampla demais
- evita mexer em props nao autorizadas como `renderItem`, `keyExtractor`, `getItemLayout`, `data` e `horizontal`

---

## Item 11 - `useBusMix`: `channelSourcesKey` verificado sem mudanca

**Arquivo analisado:** `src/features/busMix/hooks/useBusMix.ts`

### Situacao apontada

`channelSourcesKey` e derivado de:

```ts
channels.map((channel) => channel.id).join(',')
```

com dependencia `[channels]`.

### Resultado da verificacao

O prompt ja indicava que o codigo atual esta correto:

- `channels` pode mudar de referencia em updates de fader
- mas o valor calculado so muda quando IDs mudam
- o efeito dependente de `channelSourcesKey` so reexecuta quando a string muda

### Decisao

Nenhuma mudanca aplicada.

---

## Item 12 - `BusMixScreen`: `isRefreshing` nao usado

**Arquivo analisado:** `src/features/busMix/screens/BusMixScreen.tsx`

### Situacao apontada

Verificar se `isRefreshing` era desestruturado de `useBusMix()` e nao usado.

### Resultado da verificacao

`BusMixScreen` nao desestrutura `isRefreshing`.

`useBusMix()` ainda retorna `isRefreshing`, mantendo a assinatura publica existente, mas a tela nao puxa esse valor.

### Decisao

Nenhuma mudanca aplicada.

---

## Item 13 - `OscClient.request`: default timeout menor

**Arquivo:** `src/shared/osc/OscClient.ts`

### Como era antes

```ts
async request<T>(address: string, args: OscArg[] = [], timeoutMs = 1500): Promise<T>
```

### Como ficou depois

```ts
async request<T>(address: string, args: OscArg[] = [], timeoutMs = 800): Promise<T>
```

### Por que foi feito

Em rede local, respostas UDP devem chegar muito rapido. Quando um pacote se perde, esperar 1500ms atrasa o fallback ou retry do chamador.

### Ganho esperado

- erro de timeout aparece mais cedo
- fluxos que dependem do default ficam menos presos em perda real de pacote
- callers que passam timeout explicito nao mudam comportamento

---

## Item 14 - `NetworkScanner.validateConsole`: timeout manual mantido

**Arquivo analisado:** `src/shared/network/NetworkScanner.ts`

### Situacao apontada

`validateConsole()` usa timeout padrao de 1200ms.

### Decisao

Mantido sem mudanca.

### Por que manter

Esse fluxo e usado quando o usuario digita IP manualmente. Nesse contexto, esperar ate 1.2s e aceitavel para confirmar se a mesa existe.

---

## Item 15 - `SharedOscClient`: cleanup garantido no `finally`

**Arquivo:** `src/shared/osc/SharedOscClient.ts`

### Como era antes

Quando o timer de release disparava:

```ts
current.client.disconnect();
current.isConnected = false;
clientsByEndpoint.delete(key);
```

Se `disconnect()` lancasse excecao, a entrada poderia permanecer no mapa global.

### Como ficou depois

```ts
try {
  current.client.disconnect();
} catch {
  // Ignore disconnect errors during cleanup
} finally {
  current.isConnected = false;
  clientsByEndpoint.delete(key);
}
```

### Por que foi feito

Cleanup precisa ser robusto mesmo quando a desconexao falha. O mapa global nao deve ficar com entry stale por causa de excecao no socket.

### Ganho esperado

- menor risco de lease preso
- menor risco de reconexao usando estado antigo
- cleanup previsivel em Android/background

---

## Arquivos Alterados Nesta Rodada

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/busMix/services/BusMixChannelStore.ts` | ajuste de snapshot e comentario de intencao para listeners |
| `src/services/x32/X32HeartbeatService.ts` | heartbeat de 9000ms para 5000ms |
| `src/shared/network/NetworkScanner.ts` | scan adaptativo com minimo e fallback |
| `src/features/busMix/hooks/useMeterSubscription.ts` | polling de meters de 66ms para 80ms |
| `src/features/busMix/components/ChannelVuMeter.tsx` | fall duration de 75ms para 60ms |
| `src/features/busMix/hooks/useBusMix.ts` | link map antes de `loadChannels` |
| `src/features/busMix/components/ChannelStrip.tsx` | memo passa a comparar `pan` |
| `src/features/busGroups/services/X32BusGroupsService.ts` | fader/on de DCA paralelos |
| `src/features/busMix/screens/BusMixScreen.tsx` | `initialNumToRender` ajustado para 10 |
| `src/shared/osc/OscClient.ts` | timeout default de request de 1500ms para 800ms |
| `src/shared/osc/SharedOscClient.ts` | cleanup garantido com `finally` |

---

## Ganhos Esperados por Categoria

### Rede OSC / UDP

- Menos risco de perder `/xremote` por jitter em Wi-Fi.
- Timeout default menor em requests OSC.
- Menos contencao no primeiro load do BusMix.
- Menos trafego de meter com polling de 80ms.

### Renderizacao e UI

- `ChannelStrip` deixa de ignorar mudanca de pan no memo.
- `FlatList` fica alinhada aos parametros pedidos para lista horizontal.
- VU meter tem queda mais curta e mais compativel com o novo polling.

### Carregamento

- BusGroups carrega DCAs com menos espera sequencial.
- Discovery pode terminar antes dos 900ms quando a rede responde cedo.

### Robustez

- `SharedOscClient` limpa o mapa mesmo se `disconnect()` falhar.
- Store documenta que listeners recebem referencia direta e nao devem mutar.

---

## Pontos que Continuam Fora do Escopo

Estes pontos foram percebidos ou continuam existentes, mas nao foram alterados por regra de escopo:

- erro de TypeScript em `src/app/App.tsx` envolvendo `KeepAwake`
- possivel refinamento do cleanup de timers internos do scan adaptativo
- validacao manual em mesa fisica
- mudancas estruturais maiores como batch loading via `/node`
- mudancas de build Android/iOS

---

## Proximo Passo Recomendado

1. Rodar o app em dispositivo Android real.
2. Validar com mesa X32/M32 real:
   - discovery rapido
   - conexao e manutencao de eventos OSC por mais de 10 segundos
   - entrada no BusMix
   - meters ativos por alguns minutos
   - alteracao de pan e reabertura do modal
   - BusGroups carregando MCAs/DCAs
3. Corrigir em rodada separada o erro de `npm run tsc` em `src/app/App.tsx`, porque ele ja aparece fora do escopo desta auditoria.

---

_Documento criado para registrar o de / para da rodada de performance aplicada apos o ultimo prompt de auditoria._
