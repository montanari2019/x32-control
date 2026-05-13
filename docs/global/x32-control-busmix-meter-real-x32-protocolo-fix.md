# X32 Control - Fix do Meter Real X32 no BusMix

> **Data do registro:** 13/05/2026  
> **Area:** BusMix / ChannelVuMeter / OSC UDP / X32 meters  
> **Objetivo:** documentar de forma clara e especifica por que o meter visual ficava zerado no console real X32 e o que foi feito para corrigir.

---

## Resumo Executivo

O problema nao estava no componente visual do meter nem no modo demo/mock. O problema estava na combinacao de dois pontos do protocolo real da X32:

1. O app estava solicitando meter usando `sendRaw('/meters/1')` e `sendRaw('/meters/13')`.
2. A documentacao da X32 indica que o pedido de meter deve ser enviado ao endereco `/meters`, com o id do meter como argumento string, por exemplo:

```text
/meters ,s /meters/1
/meters ,s /meters/13
```

O decoder tambem foi mantido alinhado ao payload que chega do `OscDecoder`:

```text
[int32 LE: count][float32 LE x count]
```

Ou seja, o primeiro float real nao esta no offset `0`; ele esta no offset `4`, depois do count header.

Depois do ajuste, o BusMix passa a pedir os streams de meter pelo comando documentado `/meters`, renovando a assinatura periodicamente. Isso cobre:

- CH01-32 via `/meters/1`
- CH17-22 via os mesmos indices de CH01-32, incluindo sinais AES50/rede
- AUX01-08 via `/meters/13`
- FX Return 01-08 via `/meters/13`

---

## Sintoma Observado

No app:

- Demo/mock: meters animavam corretamente.
- Console real X32: meters ficavam zerados em todos os canais.
- Faders, mute, nomes e demais leituras OSC continuavam funcionando.
- O problema era isolado no `ChannelVuMeter`.

Na mesa real:

- os canais CH17 a CH22 estavam com sinal presente;
- mesmo assim o app mostrava o meter morto.

Isso indicava que a conexao OSC geral estava viva, mas o fluxo de meter real nao estava sendo recebido ou interpretado corretamente.

---

## Componentes Envolvidos

### Visual

Arquivo:

- `src/features/busMix/components/ChannelVuMeter.tsx`

Papel:

- recebe `ChannelMeterValues`;
- converte `preFadeDbfs` em segmentos verdes/amarelos/vermelhos;
- nao acessa OSC diretamente.

Conclusao:

- o componente visual estava correto;
- se ele recebesse valores acima de `-60 dBFS`, ele acenderia.

### Hook de assinatura

Arquivo:

- `src/features/busMix/hooks/useMeterSubscription.ts`

Papel:

- registra listeners por `channelId`;
- solicita streams de meter na X32;
- recebe respostas OSC;
- repassa blobs para o decoder correto.

Conclusao:

- era o ponto principal do bug de protocolo.

### Decoder

Arquivo:

- `src/features/busMix/utils/meterDecoder.ts`

Papel:

- transforma o blob OSC da X32 em `ChannelMeterValues`;
- converte valores lineares em dBFS.

Conclusao:

- precisava estar alinhado ao payload real entregue pelo `OscDecoder`.

---

## Referencias Consultadas

### X32/M32 OSC Remote Protocol

Documento:

- https://x32ram.com/wp-content/uploads/download-files/X32-OSC.pdf

Pontos relevantes:

- o comando de meter e feito via `/meters`;
- o id do meter e passado como string, por exemplo `/meters/1`;
- a resposta vem como OSC blob;
- o blob contem um count header e floats nativos;
- para X32, os floats de meter sao valores lineares.

### Discussao pratica sobre meters na X32

Referencia:

- https://stackoverflow.com/questions/79628962/how-to-access-meters-on-behringer-x32

Pontos relevantes:

- o padrao pratico e enviar `/meters` com argumento string;
- ha renovacao periodica porque o stream expira;
- `/batchsubscribe` e uma alternativa documentada para assinaturas de meter.

---

## Causa Raiz

### 1. Request incorreto para a mesa real

Antes, o hook fazia:

```typescript
client.sendRaw(X32Protocol.getMeters1Path());
client.sendRaw(X32Protocol.getMeters13Path());
```

Na pratica, isso envia apenas o endereco OSC cru:

```text
/meters/1
/meters/13
```

Sem type tag, sem argumento e sem o comando `/meters`.

O formato esperado pela X32 para solicitar os meters e:

```typescript
client.send('/meters', ['/meters/1']);
client.send('/meters', ['/meters/13']);
```

Em OSC, isso vira algo equivalente a:

```text
/meters ,s /meters/1
/meters ,s /meters/13
```

Impacto:

- o app ficava ouvindo respostas em `/meters/1` e `/meters/13`;
- mas a mesa real podia nunca iniciar o stream, porque o pedido nao era feito no formato documentado;
- resultado: o `ChannelVuMeter` continuava em silencio.

### 2. Payload do blob tem count header

O `OscDecoder` remove o header padrao do OSC blob:

```text
[int32 BE: tamanho do blob]
```

Mas o payload especifico da X32 ainda inclui:

```text
[int32 LE: count][float32 LE x count]
```

Portanto, o primeiro float real esta em:

```text
offset = 4 + index * 4
```

Nao em:

```text
offset = index * 4
```

Se o decoder ler offset `0`, ele le o count header como se fosse float. Para `/meters/1`, count costuma ser `96`. Interpretar esse header como `float32` gera um valor minusculo, que cai em silencio visual.

### 3. Conversao de valor linear para dB

Os meters da X32 entregam nivel linear, nao dB direto.

O decoder converte assim:

```typescript
20 * Math.log10(linear);
```

Exemplos:

| Linear  | dBFS aproximado |
| ------- | --------------- |
| `0.001` | `-60 dBFS`      |
| `0.316` | `-10 dBFS`      |
| `0.5`   | `-6 dBFS`       |
| `1.0`   | `0 dBFS`        |
| `2.0`   | `+6 dBFS`       |

Foi mantido clamp entre:

- `METER_MIN_DBFS = -60`
- `METER_MAX_DBFS = 10`

---

## Fluxo Correto Depois do Fix

### CH01-32

1. `ChannelVuMeter` registra listener para `channelId` de 1 a 32.
2. `useMeterSubscription` pede:

```typescript
client.send('/meters', ['/meters/1']);
```

3. A X32 passa a emitir respostas em `/meters/1`.
4. O hook recebe o blob.
5. `decodeMeter1BlobForChannel(blob, channelId)` calcula:

```typescript
index = channelId - 1;
offset = 4 + index * 4;
linear = view.getFloat32(offset, true);
db = 20 * Math.log10(linear);
```

6. O `ChannelVuMeter` acende os segmentos.

### CH17-22

CH17-22 nao tem tratamento especial no protocolo.

Eles sao apenas indices dentro do `/meters/1`:

| Canal | `channelId` | `index` |
| ----- | ----------: | ------: |
| CH17  |          17 |      16 |
| CH18  |          18 |      17 |
| CH19  |          19 |      18 |
| CH20  |          20 |      19 |
| CH21  |          21 |      20 |
| CH22  |          22 |      21 |

Se o sinal vem de AES50/rede, isso nao muda o blob de meter. A X32 ja coloca o nivel do canal no mesmo indice.

### AUX01-08

1. `ChannelVuMeter` registra listener para `channelId` de 33 a 40.
2. `useMeterSubscription` pede:

```typescript
client.send('/meters', ['/meters/13']);
```

3. A X32 responde em `/meters/13`.
4. `decodeMeter13BlobForChannel` usa:

```typescript
index = channelId - 1;
```

Mapeamento:

| Canal | `channelId` | `index` |
| ----- | ----------: | ------: |
| AUX01 |          33 |      32 |
| AUX08 |          40 |      39 |

### FX Return 01-08

Tambem vem de `/meters/13`:

| Canal        | `channelId` | `index` |
| ------------ | ----------: | ------: |
| FX Return 01 |          41 |      40 |
| FX Return 08 |          48 |      47 |

---

## O Que Foi Alterado

### `useMeterSubscription.ts`

Arquivo:

- `src/features/busMix/hooks/useMeterSubscription.ts`

Antes:

```typescript
client.sendRaw(X32Protocol.getMeters1Path());
client.sendRaw(X32Protocol.getMeters13Path());
```

Depois:

```typescript
client.send(X32Protocol.getMetersSubscribePath(), [X32Protocol.getMeters1Path()]);
client.send(X32Protocol.getMetersSubscribePath(), [X32Protocol.getMeters13Path()]);
```

Onde:

```typescript
X32Protocol.getMetersSubscribePath() === '/meters';
X32Protocol.getMeters1Path() === '/meters/1';
X32Protocol.getMeters13Path() === '/meters/13';
```

Tambem foi adicionado:

- renovacao a cada `8000ms`;
- request imediato quando um listener real e registrado;
- separacao entre listeners CH01-32 e AUX/FX;
- throttle de `1000ms` para evitar rajada de pedidos repetidos quando varios `ChannelVuMeter` montam ao mesmo tempo.

### `meterDecoder.ts`

Arquivo:

- `src/features/busMix/utils/meterDecoder.ts`

O decoder manteve o formato:

```text
[int32 LE: count][float32 LE x count]
```

Leitura correta:

```typescript
const dataOffset = 4;
const linear = view.getFloat32(dataOffset + index * 4, true);
```

Tambem foi ajustado `decodeFloatDbValue` para tratar qualquer valor linear `>= 0` como linear:

```typescript
if (value >= 0) {
  return linearToDb(value);
}
```

Isso cobre headroom da X32 acima de `1.0`, em vez de tratar `2.0` como `2 dB` direto. O correto para `2.0` linear e aproximadamente `+6 dB`.

### Testes

Arquivos:

- `__tests__/features/busMix/utils/meterDecoder.test.ts`
- `__tests__/features/busMix/hooks/useMeterSubscription.test.ts`

Coberturas adicionadas/ajustadas:

- blob com count header LE;
- CH17-CH22 por indices 16-21;
- AUX01 por index 32 em `/meters/13`;
- FX Return 01 por index 40 em `/meters/13`;
- regressao para nao ler count header como float;
- headroom linear acima de `1.0`;
- hook solicitando `/meters` com string `'/meters/1'`;
- hook solicitando `/meters` com string `'/meters/13'`.

---

## Por Que as Solucoes Anteriores Nao Resolveram

### Tentativa: mudar endianness dos floats

Problema:

- trocar LE por BE atacava a leitura do float;
- mas o formato real usa float LE;
- alem disso, nao resolvia a forma de pedir o stream.

Conclusao:

- a mesa podia continuar sem enviar stream;
- e, se enviasse, os floats poderiam ser lidos errado.

### Tentativa: ler float direto no offset `index * 4`

Problema:

- ignorava o count header LE de 4 bytes dentro do payload X32;
- CH01 lia o count header como se fosse float.

Conclusao:

- podia resultar em `-60 dBFS` mesmo com sinal real.

### Tentativa: focar apenas em `/meters/13`

Problema:

- o sintoma passou a ser todos os canais zerados;
- isso apontava para pedido de stream e/ou parsing comum, nao apenas AUX/FX.

Conclusao:

- o fix precisava cobrir tanto `/meters/1` quanto `/meters/13`.

---

## Validacao Executada

### Testes

Comando:

```bash
npm test -- --runInBand
```

Resultado:

```text
13 test suites passed
44 tests passed
```

### Prettier nos arquivos alterados

Comando:

```bash
npx prettier --check "src/features/busMix/hooks/useMeterSubscription.ts" "src/features/busMix/utils/meterDecoder.ts" "__tests__/features/busMix/hooks/useMeterSubscription.test.ts" "__tests__/features/busMix/utils/meterDecoder.test.ts"
```

Resultado:

```text
All matched files use Prettier code style.
```

### TypeScript

Comando:

```bash
npm run tsc
```

Resultado:

```text
tsc --noEmit concluiu sem erros.
```

---

## Como Validar na Mesa Real

### Pre-condicoes

- app aberto em um console real X32;
- BusMix carregado;
- canais CH17 a CH22 com sinal real chegando na mesa;
- pelo menos um desses canais visivel na lista horizontal.

### Validacao esperada

1. Abrir BusMix.
2. Ir ate CH17-CH22.
3. Confirmar que os meters ao lado dos faders acendem.
4. Rolar para AUX01-08, se houver sinal nesses retornos.
5. Confirmar que AUX tambem acende.
6. Rolar para FX Return 01-08, se houver sinal nesses retornos.
7. Confirmar que FX Return tambem acende.

### Observacoes importantes

- O app so registra listener de meter para canais visiveis.
- Se um canal esta fora da janela renderizada da `FlatList`, o listener pode nao estar ativo naquele momento.
- Ao rolar ate o canal, o listener e registrado e o hook solicita o stream correspondente.
- `/meters/1` cobre CH01-32.
- `/meters/13` cobre CH01-32, AUX01-08 e FX Return 01-08, mas o app usa essa resposta apenas para AUX/FX.

---

## Arquivos Envolvidos no Fix

Runtime:

- `src/features/busMix/hooks/useMeterSubscription.ts`
- `src/features/busMix/utils/meterDecoder.ts`

Testes:

- `__tests__/features/busMix/hooks/useMeterSubscription.test.ts`
- `__tests__/features/busMix/utils/meterDecoder.test.ts`

Logs:

- `logs/2026-05-12_20-50-02-busmix-real-x32-meter-protocol-fix.txt`

---

## Checklist de Regressao

Antes de alterar novamente essa area, validar:

- CH01 acende com sinal real.
- CH17-CH22 acendem com sinal AES50/rede.
- AUX01 acende quando houver sinal de retorno.
- FX Return 01 acende quando houver sinal de retorno.
- `npm test -- --runInBand` continua passando.
- `npm run tsc` continua passando.

---

## Estado Final Esperado

Com a correcao aplicada:

- o app passa a pedir meters no formato aceito pela X32 real;
- a X32 inicia o stream de blobs;
- o `OscDecoder` entrega o payload do blob;
- o `meterDecoder` pula o count header e le o float correto;
- o valor linear e convertido para dBFS;
- o `ChannelVuMeter` recebe valores acima de `-60 dBFS`;
- os segmentos do meter acendem visualmente no BusMix.
