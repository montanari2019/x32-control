# X32 Control - Auditoria de Performance & Status de Implementacao

> **Contexto:** Aplicativo React Native (v0.78.1) para controle em tempo real de mesas Behringer X32/M32 via OSC/UDP. Latencia, travamentos e jank visual sao criticos nesse tipo de app. Esta doc consolida a auditoria original e registra, ponto a ponto, **o que foi implementado**, **o que foi parcialmente tratado** e **o que ainda nao foi implementado**.

> **Base desta consolidacao:**

- auditoria tecnica original de performance
- implementacao realizada na rodada registrada em `logs/2026-05-08_19-09-39-performance-hardening-safe-improvements.txt`
- validacao local com `tsc`, `jest` e `eslint` nos arquivos alterados

---

## Indice

1. [Rede & Protocolo OSC](#1-rede--protocolo-osc)
2. [Carregamento Inicial (BusMix)](#2-carregamento-inicial-busmix)
3. [Fila de Envio UDP](#3-fila-de-envio-udp)
4. [Medidores VU (Meters)](#4-medidores-vu-meters)
5. [Renderizacao & React](#5-renderizacao--react)
6. [Fader (PanResponder)](#6-fader-panresponder)
7. [BusGroups & DCA](#7-busgroups--dca)
8. [Descoberta de Console](#8-descoberta-de-console)
9. [Armazenamento & Presets](#9-armazenamento--presets)
10. [Sincronizacao de Fundo (Background Sync)](#10-sincronizacao-de-fundo-background-sync)
11. [Memoria & Vazamentos](#11-memoria--vazamentos)
12. [Configuracoes Recomendadas de Build](#12-configuracoes-recomendadas-de-build)
13. [Resumo Priorizado](#13-resumo-priorizado)

---

## 1. Rede & Protocolo OSC

### 1.1 `sendQueue` serializa todos os envios UDP desnecessariamente

**Arquivo:** `src/shared/network/UdpTransport.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- A fila serial `sendQueue` foi removida.
- `send()` agora:
  - valida se o transporte esta encerrando
  - garante `bind()` quando necessario
  - chama `sendNow()` diretamente

**Resultado esperado:**

- envios OSC nao ficam mais bloqueados um atras do outro
- queda importante de latencia acumulada em `loadChannels` e outras cargas massivas

**Observacao:**

- nao foi adicionado semaforo ou limite intermediario de concorrencia nesta rodada
- a melhoria aplicada foi a remocao da serializacao global

---

### 1.2 `handlePacket` usa iteracao linear no `Set` de pending requests

**Arquivo:** `src/shared/osc/OscClient.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- criado `pendingByAddress = new Map<string, Set<PendingRequest<unknown>>>()`
- requests agora sao registrados tanto em `pending` quanto em `pendingByAddress`
- `handlePacket()` deixou de fazer `find()` linear em todo o conjunto
- a resolucao do request agora busca diretamente pelo `address`

**Resultado esperado:**

- menor custo por pacote recebido
- melhor comportamento durante rajadas de resposta na carga inicial

---

### 1.3 Timeout do `request()` de 1500ms e alto para rede local

**Arquivos:**

- `src/shared/osc/OscClient.ts`
- `src/features/busMix/services/BusMixService.ts`

**Status:** `IMPLEMENTADO PARCIALMENTE`

**O que foi feito:**

- nao foi alterado o default global de `OscClient.request()`
- foi implementado um caminho seguro no `BusMixService`:
  - `REQUEST_TIMEOUT_MS = 600`
  - `REQUEST_RETRIES = 1`
  - helper `requestMessage(path, timeoutMs, retries)`
- `safeRequestString`, `safeRequestColor`, `safeRequestLevel`, `safeRequestOn` e `safeRequestPan` passaram a usar esse helper

**O que isso cobre:**

- o principal hot path do app em `BusMix` agora usa timeout menor + retry

**O que ainda nao foi feito:**

- padronizar esse mesmo comportamento em todos os outros servicos que usam `OscClient.request()` diretamente

**Motivo de nao alterar tudo de uma vez:**

- reduzir risco de regressao em fluxos menos exercitados sem validacao manual em mesa real

---

### 1.4 `validateConsole` faz 2 requests sequenciais desnecessarios

**Arquivo:** `src/shared/network/NetworkScanner.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- `validateConsole()` passou a validar usando apenas `/info`
- timeout padrao de validacao manual reduzido para `1200ms`
- o request extra para `/status` foi removido

**Resultado esperado:**

- validacao manual de IP mais rapida
- menos dependencia de dois requests sequenciais para confirmar a console

---

### 1.5 `XREMOTE_RENEW_INTERVAL_MS` de 8000ms e muito proximo do timeout do X32

**Arquivo:** `src/shared/osc/OscClient.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- intervalo reduzido de `8000ms` para `5000ms`

**Melhoria adicional aplicada junto:**

- o keepalive passou a ser controlado por contagem de referencias
- isso evita que uma tela desligue o keepalive enquanto outra ainda depende dele

---

## 2. Carregamento Inicial (BusMix)

### 2.1 `loadChannels` faz ate 240 requests OSC individuais

**Arquivo:** `src/features/busMix/services/BusMixService.ts`

**Status:** `NAO IMPLEMENTADO INTEGRALMENTE`

**O que foi feito nesta rodada:**

- remocao da serializacao de envio em `UdpTransport`
- timeout menor e retry no caminho de leitura do `BusMix`

**O que isso melhora na pratica:**

- os 240 requests continuam existindo
- porem agora deixam de sofrer o gargalo da fila serial
- e cada leitura sensivel falha mais rapido com uma retentativa controlada

**O que ainda nao foi feito:**

- batch loading via `/node`
- batch loading via `/xprop`
- reducao estrutural do volume de requests por canal

**Motivo:**

- implementar `/node` sem validar em mesa real seria uma mudanca de protocolo mais arriscada
- esta melhoria foi explicitamente adiada para uma etapa com teste em console fisica

---

### 2.2 `fetchChannelLinkMap` adiciona 16 requests extras na inicializacao

**Arquivo:** `src/features/busMix/services/BusMixService.ts`

**Status:** `IMPLEMENTADO PARCIALMENTE`

**O que foi feito:**

- `fetchChannelLinkMap()` ganhou cache global por `consoleIp`
- as leituras agora usam retry curto via `requestMessage()`

**O que ainda nao foi feito:**

- mover o fetch para depois do `loadChannels`
- carregar isso em segundo plano

**Resultado atual:**

- primeira carga ainda consulta os links
- cargas seguintes na mesma sessao deixam de repetir esse custo para a mesma console

---

### 2.3 `BusMixChannelStore.cloneChannels` clona o array a cada update

**Arquivo:** `src/features/busMix/services/BusMixChannelStore.ts`

**Status:** `IMPLEMENTADO PARCIALMENTE`

**O que foi feito:**

- `setChannelsByKey()` deixou de clonar novamente a lista para cada listener
- listeners agora recebem `nextChannels` diretamente

**O que permaneceu:**

- ainda existe clone ao salvar a versao armazenada no store
- ainda existe clone em `getSnapshot()`

**Motivo do status parcial:**

- a remocao foi feita onde o ganho era mais claro e com menor risco
- nao foi feita uma migracao completa para `Object.freeze()` ou imutabilidade total forcada

---

## 3. Fila de Envio UDP

### 3.1 `SEND_TIMEOUT_MS` de 1000ms na camada UDP e excessivo

**Arquivo:** `src/shared/network/UdpTransport.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- `SEND_TIMEOUT_MS` foi reduzido de `1000` para `200`

**Resultado esperado:**

- falha mais rapida em situacoes anormais de socket
- menor risco de segurar o pipeline de envio por 1 segundo

---

### 3.2 `FADER_SEND_INTERVAL_MS` de 30ms pode ser reduzido

**Arquivo:** `src/features/busMix/hooks/useBusMix.ts`

**Status:** `NAO ALTERADO DE PROPOSITO`

**Decisao tomada:**

- o valor `30ms` foi mantido

**Motivo:**

- apos remover a serializacao global de UDP, esse valor voltou a ser razoavel
- mexer nesse throttle sem teste em mesa real poderia alterar a sensacao do controle ao vivo

**Conclusao:**

- item analisado
- valor mantido intencionalmente

---

## 4. Medidores VU (Meters)

### 4.1 `POLL_INTERVAL_MS` de 50ms em `useMeterSubscription` e muito frequente

**Arquivo:** `src/features/busMix/hooks/useMeterSubscription.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- `POLL_INTERVAL_MS` foi alterado de `50` para `100`

**Resultado esperado:**

- reducao de 50% do trafego UDP de medidores
- custo menor em dispositivos Android mais modestos

---

### 4.2 `ChannelVuMeter` usa `Animated.timing` com `useNativeDriver: false`

**Arquivo:** `src/features/busMix/components/ChannelVuMeter.tsx`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- a animacao principal do medidor deixou de usar `height`
- o componente passou a animar `scaleY` + `translateY`
- `useNativeDriver: true` foi aplicado ao movimento do medidor

**Escopo preservado:**

- `peak marker` e `clip indicator` foram mantidos
- a API do componente nao mudou

**Resultado esperado:**

- menor carga no JS thread
- reducao de jank quando muitos meters estao ativos ao mesmo tempo

---

### 4.3 `VerticalFader` tem um timer de 33ms por canal

**Arquivo:** `src/features/busMix/components/VerticalFader.tsx`

**Status:** `NAO IMPLEMENTADO`

**O que ainda existe:**

- cada `VerticalFader` continua com seu proprio `setInterval`

**Motivo de nao implementar agora:**

- trocar para um ticker global exige uma mudanca arquitetural mais ampla
- o objetivo desta rodada foi melhorar o hot path sem reestruturar demais o fluxo de meter

**Observacao:**

- apesar disso, o custo total dos meters caiu por conta de:
  - polling menor em `useMeterSubscription`
  - animacao principal do `ChannelVuMeter` migrada para native driver

---

## 5. Renderizacao & React

### 5.1 `React.memo` presente, mas com comparadores incompletos

**Arquivo:** `src/features/busMix/components/ChannelStrip.tsx`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- o comparador do `React.memo` ganhou:
  - `registerMeterListener`
  - `onToggleMute`
  - `onFaderChange`
  - `onFaderChangeEnd`
  - `onPressBadge`

**Resultado esperado:**

- menor risco de props stale em re-renders
- comportamento memoizado mais correto

---

### 5.2 `channelsData = useMemo(() => channels, [channels])` e inutil

**Arquivo:** `src/features/busMix/screens/BusMixScreen.tsx`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- o `useMemo` inutil foi removido
- `FlatList` passou a usar `channels` diretamente

---

### 5.3 `FlatList` sem `windowSize` otimizado para lista horizontal longa

**Arquivo:** `src/features/busMix/screens/BusMixScreen.tsx`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- `initialNumToRender`: `12 -> 8`
- `maxToRenderPerBatch`: `8 -> 6`
- `updateCellsBatchingPeriod`: `32 -> 50`
- `windowSize`: `5 -> 3`

**Resultado esperado:**

- menor custo do primeiro render
- menos itens mantidos em memoria na janela

---

### 5.4 `handleLayout` em `ChannelStrip` chama `setState` em todo resize

**Arquivo:** `src/features/busMix/components/ChannelStrip.tsx`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- `handleLayout()` passou a comparar a altura atual antes de atualizar estado
- foi introduzido `faderHeightRef`

**Resultado esperado:**

- menos re-renders desnecessarios no layout inicial

---

## 6. Fader (PanResponder)

### 6.1 `Animated.spring` no update remoto de fader cria defasagem visual

**Arquivo:** `src/features/busMix/components/VerticalFader.tsx`

**Status:** `IMPLEMENTADO NO VALIDADO` - `PRECISA VALIDAR SE O USUÁRIO É ADERENTE AO COMPORTAMENTO QUE FOI MUDADO`

**O que foi feito:**

- `spring` foi substituido por estrategia mais direta:
  - `setValue` imediato quando a diferenca e muito pequena
  - `Animated.timing` curto (`40-80ms`) quando a diferenca e maior

**Resultado esperado:**

- menor sensacao de atraso em update remoto
- movimento mais previsivel para contexto de controle em tempo real

---

### 6.2 `PanResponder` recriado quando `updateFromY` muda

**Arquivo:** `src/features/busMix/components/VerticalFader.tsx`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- `onChange` e `onChangeEnd` migrados para refs
- `available` tambem passou a ser lido por ref
- `updateFromY()` deixou de depender diretamente das props mutaveis do render atual

**Resultado esperado:**

- gesto mais estavel
- menor chance de recriacao problematica do responder durante interacao

---

## 7. BusGroups & DCA

### 7.1 `X32HeartbeatService` indica possivel duplicacao de keepalive

**Arquivo:** `src/features/busGroups/services/X32BusGroupsService.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- o heartbeat dedicado deixou de ser usado como fonte real de `xremote`
- `startHeartbeat()` agora delega para `client.startXRemoteKeepAlive()`
- `stopHeartbeat()` agora delega para `client.stopXRemoteKeepAlive()`

**Resultado esperado:**

- keepalive unificado no mesmo mecanismo ref-counted do restante do app
- menor risco de duplicacao ou desligamento cruzado

**Observacao:**

- o arquivo `src/services/x32/X32HeartbeatService.ts` continua existindo, mas ficou sem uso pratico nesta trilha

---

### 7.2 `loadAvailableChannels` em `useBusGroups` pode disparar `loadChannels` duplo

**Arquivo:** `src/features/busGroups/hooks/useBusGroups.ts`

**Status:** `JA COBERTO PARCIALMENTE PELA BASE ATUAL`

**O que foi observado:**

- `BusMixService` ja usa `SharedOscClient`
- `BusMixChannelStore` ja possui `inFlightLoads`
- `loadAvailableChannels()` continua chamando `busMixService.connect(consoleIp)` antes de `loadChannels(busId)`

**Decisao:**

- nao foi feita mudanca estrutural adicional aqui

**Motivo:**

- o fluxo atual ja esta bem melhor protegido do que a auditoria inicial sugeria
- nesta rodada a prioridade ficou nos gargalos mais claros e validados

---

## 8. Descoberta de Console

### 8.1 Scan de broadcast espera exatamente 900ms fixos

**Arquivo:** `src/shared/network/NetworkScanner.ts`

**Status:** `NAO IMPLEMENTADO`

**Motivo:**

- melhoria valida, mas nao era o principal gargalo da rodada
- o foco foi priorizar o hot path de controle ao vivo apos a conexao

**Estado atual:**

- o scan continua com espera fixa de `900ms`

---

### 8.2 IP invalido validado somente no `OscClient`, nao na UI

**Arquivo:** `src/shared/osc/OscClient.ts`

**Status:** `NAO IMPLEMENTADO`

**Motivo:**

- nao existe mais fluxo visivel de entrada manual de IP na UI principal atual
- portanto nao houve componente de input candidato para essa validacao em tempo real nesta rodada

**Observacao:**

- a validacao de IP continua protegendo a camada de conexao

---

## 9. Armazenamento & Presets

### 9.1 `restorePreset` itera com `await` sequencial com delay de 24ms

**Arquivo:** `src/features/busMix/hooks/useBusMix.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- todos os faders do preset sao aplicados primeiro
- os mutes sao enviados em paralelo com `Promise.all`
- o delay sequencial de `24ms` por canal foi removido

**Resultado esperado:**

- restauracao muito mais rapida
- overlay de restore continua protegendo a interacao enquanto a restauracao termina

---

### 9.2 `save()` tem delay artificial de 300ms

**Arquivo:** `src/features/busMix/hooks/useBusMix.ts`

**Status:** `IMPLEMENTADO PARCIALMENTE`

**O que foi feito:**

- o delay artificial de `300ms` foi removido
- `save()` agora apenas limpa o estado pendente sem espera fake

**O que ainda nao foi feito:**

- persistencia real para esse `save()` simbolico

**Motivo do status parcial:**

- a parte enganosa foi removida
- mas o metodo continua sem responsabilidade funcional forte, como a propria auditoria ja indicava

---

## 10. Sincronizacao de Fundo (Background Sync)

### 10.1 `BACKGROUND_SYNC_INTERVAL_MS` de 30s pode causar pico de requests

**Arquivo:** `src/features/busMix/hooks/useBusMix.ts`

**Status:** `IMPLEMENTADO`

**O que foi feito:**

- mantido o intervalo base de `30000ms`
- adicionado jitter aleatorio de ate `5000ms`

**Resultado esperado:**

- evitar pico sincronizado de requests de background entre dispositivos

**O que nao foi feito:**

- remocao completa do sync em favor de modelo puramente orientado a eventos

**Motivo:**

- o background sync continua sendo uma rede de seguranca util enquanto a validacao real de XREMOTE nao fecha todos os cenarios

---

## 11. Memoria & Vazamentos

### 11.1 `SharedOscClient` nunca limpa entradas stale do mapa global

**Arquivo:** `src/shared/osc/SharedOscClient.ts`

**Status:** `JA ESTAVA COBERTO` - VALIDAR COM O TESTE COM A MESA REAL

**O que foi verificado:**

- `releaseSharedOscClient()` ja remove a entrada com `clientsByEndpoint.delete(key)` quando o release efetivo ocorre

**O que foi melhorado em volta disso:**

- o controle de keepalive no `OscClient` passou a usar contagem de referencias, reduzindo risco de desalinhamento entre leases e renovacao de `xremote`

**Conclusao:**

- o problema descrito pela auditoria nao se confirmou integralmente no estado atual do codigo

---

### 11.2 `BusMixChannelStore` e singleton global e nao limpa ao trocar de console

**Arquivo:** `src/features/busMix/services/BusMixChannelStore.ts`

**Status:** `IMPLEMENTADO PARCIALMENTE`

**O que foi feito:**

- criado `clearConsole(consoleIp)`

**O que ainda nao foi feito:**

- conectar esse metodo a um evento claro de desconexao/troca de console

**Motivo do status parcial:**

- o mecanismo foi preparado
- o ponto correto de invalidacao ainda precisa ser decidido com cuidado para nao remover estado cedo demais

---

## 12. Configuracoes Recomendadas de Build

### 12.1 Android - Hermes e JSC

**Status:** `NAO VALIDADO NESTA RODADA`

**Observacao:**

- a rodada atual focou no codigo TypeScript/React Native do app
- nao houve auditoria direta do `android/app/build.gradle` nesta etapa

---

### 12.2 Android - Compilacao com R8/ProGuard em Release

**Status:** `NAO VALIDADO NESTA RODADA`

**Observacao:**

- recomendacao permanece valida
- nao houve alteracao de build release nesta etapa

---

### 12.3 iOS - Desabilitar logs de debug em producao

**Status:** `NAO VALIDADO NESTA RODADA`

**Observacao:**

- recomendacao permanece valida
- nao houve alteracao no projeto iOS nesta etapa

---

## 13. Resumo Priorizado

| Prioridade | Item                                             | Arquivo                   | Status                    | Observacao                                          |
| ---------- | ------------------------------------------------ | ------------------------- | ------------------------- | --------------------------------------------------- |
| 🔴 Critico | Remover serializacao da `sendQueue`              | `UdpTransport.ts`         | Implementado              | ganho direto no hot path                            |
| 🔴 Critico | `useNativeDriver: true` nos medidores principais | `ChannelVuMeter.tsx`      | Implementado              | reduz jank visual                                   |
| 🔴 Critico | Batch loading com `/node`                        | `BusMixService.ts`        | Nao implementado          | adiado por risco de protocolo sem validacao em mesa |
| 🟠 Alto    | Map indexado para pending requests               | `OscClient.ts`            | Implementado              | remove busca O(n) por pacote                        |
| 🟠 Alto    | Timer global centralizado de meters              | `VerticalFader.tsx`       | Nao implementado          | exige mudanca arquitetural maior                    |
| 🟠 Alto    | PanResponder estavel com refs                    | `VerticalFader.tsx`       | Implementado              | reduz risco de gesto stale                          |
| 🟠 Alto    | `restorePreset` paralelo                         | `useBusMix.ts`            | Implementado              | remove atraso sequencial por canal                  |
| 🟡 Medio   | Timeout de 1s -> 600ms + retry                   | `BusMixService.ts`        | Implementado parcialmente | aplicado no hot path do BusMix                      |
| 🟡 Medio   | XREMOTE interval 8s -> 5s                        | `OscClient.ts`            | Implementado              | com controle por referencia                         |
| 🟡 Medio   | Poll de meters 50ms -> 100ms                     | `useMeterSubscription.ts` | Implementado              | reduz trafego UDP                                   |
| 🟡 Medio   | Cache do link map                                | `BusMixService.ts`        | Implementado parcialmente | evita refetch repetido na mesma sessao              |
| 🟡 Medio   | Remover 2o request no validateConsole            | `NetworkScanner.ts`       | Implementado              | `/info` passou a bastar                             |
| 🟢 Baixo   | Remover `useMemo` inutil                         | `BusMixScreen.tsx`        | Implementado              | limpeza de codigo                                   |
| 🟢 Baixo   | Evitar re-render por layout                      | `ChannelStrip.tsx`        | Implementado              | menos churn inicial                                 |
| 🟢 Baixo   | Scan adaptativo                                  | `NetworkScanner.ts`       | Nao implementado          | adiado                                              |
| 🟢 Baixo   | Jitter no background sync                        | `useBusMix.ts`            | Implementado              | evita pico sincronizado                             |
| 🟢 Baixo   | Limpeza de estado global                         | `BusMixChannelStore.ts`   | Implementado parcialmente | metodo criado, integracao pendente                  |

---

## Validacao realizada na rodada

- `npm run tsc`: passou
- `npm test -- --runInBand`: passou
- `npx eslint ... --quiet` nos arquivos alterados: passou

**Escopo da validacao:**

- cobertura local de tipagem, testes e lint
- sem validacao manual em mesa fisica durante esta rodada

---

## Proximo passo recomendado

1. Validar em dispositivo e em mesa real o fluxo:
   - `ConsoleDiscovery`
   - `BusSelection`
   - `BusGroups`
   - `BusMix`
   - arraste local de fader
   - update remoto de fader
   - meters ativos
   - restore de preset com muitos canais
2. Se tudo estiver estavel em ambiente real, a proxima rodada de maior impacto deve avaliar:
   - batch loading via `/node`
   - ticker global de meter
   - integracao de `clearConsole(consoleIp)` no ponto certo de desconexao

---

_Documento consolidado apos a rodada de hardening segura de performance. Base do app: 1.0.0 / React Native 0.78.1 / React 19.0.0._
