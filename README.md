# Tacimix

Aplicativo mobile em React Native para controlar mixes de monitor em consoles
Behringer X32 e Midas M32 via OSC sobre UDP. O app foi desenhado para uso ao
vivo, com fluxo direto para selecionar uma mesa, escolher um BUS, organizar
grupos locais de controle e ajustar os envios de canais, AUX IN e FX Returns
para aquele monitor.

O nome interno do projeto ainda aparece em alguns pontos como `x32-control`,
mas o app iOS/Android atual é identificado como **Tacimix**.

## O Que O App Faz Hoje

Tacimix controla consoles X32/M32 na rede local usando a porta OSC padrão
`10023`. O fluxo principal é:

1. **Descoberta de console**
   - exibe um console Demo para testar o app sem mesa física;
   - busca consoles reais na rede usando `/info`;
   - usa broadcast dirigido por interface de rede no iOS quando disponível;
   - mantém fallback em `255.255.255.255`;
   - faz fallback unicast pela sub-rede local quando o broadcast não retorna;
   - valida respostas OSC e monta dispositivos `X32/M32` encontrados.

2. **Seleção de BUS**
   - carrega os 16 BUS da X32/M32;
   - busca nome e cor configurados na mesa;
   - detecta pares estéreo linkados em `1-2`, `3-4`, ..., `15-16`;
   - normaliza nomes de BUS estéreo para a UI;
   - oculta o lado direito de um par estéreo quando o BUS ímpar está linkado;
   - mantém fallback de nomes quando a mesa não responde algum campo.

3. **BusGroups**
   - abre um hub do BUS selecionado antes da mixagem fina;
   - controla o master fader do BUS;
   - controla mute/on do master do BUS;
   - exibe 8 MCAs locais mapeados sobre DCAs `1..8`;
   - permite renomear MCAs localmente;
   - permite escolher canais que pertencem a cada MCA;
   - calcula o valor de um MCA a partir da média dos canais atribuídos;
   - aplica movimentos do MCA de forma proporcional nos canais atribuídos;
   - sincroniza mute do MCA com o estado dos canais atribuídos;
   - persiste nomes e composição dos MCAs por console;
   - mantém os MCAs vazios quando não há estado local salvo.

4. **BusMix**
   - controla sends para o BUS selecionado;
   - lista 48 fontes:
     - `CH 01..32`;
     - `AUX 01..08`;
     - `FX 01..08`;
   - carrega nome, cor, nível, mute/on e pan de cada fonte;
   - usa paths específicos para `ch`, `auxin` e `fxrtn`;
   - envia faders como float OSC entre `0.0` e `1.0`;
   - faz UI otimista durante o arraste;
   - aplica throttle curto durante drag;
   - envia valor final imediatamente no release;
   - protege contra eco remoto atrasado por uma janela local curta;
   - faz sync de faders remotos em background;
   - respeita pares de canais linkados ao alternar mute/on;
   - abre modal de pan por canal.

5. **Presets locais de BusMix**
   - cria presets por console e por BUS;
   - salva o estado das 48 fontes do BusMix;
   - salva nível, dB calculado e mute;
   - permite sobrescrever preset existente;
   - permite apagar preset;
   - restaura preset aplicando os valores de volta na mesa;
   - exibe overlay de restauração para bloquear interação durante a aplicação;
   - limita a 10 presets por console/BUS.

6. **Meters**
   - assina streams de meter da X32/M32 com `/meters`;
   - renova streams antes do timeout aproximado da mesa;
   - decodifica blobs de `/meters/1` para canais `CH 01..32`;
   - decodifica blobs de `/meters/13` para `AUX 01..08` e `FX 01..08`;
   - converte valores lineares para dBFS;
   - limita a escala visual entre `-60 dBFS` e `+10 dBFS`;
   - usa ataque/release para suavizar resposta visual;
   - renderiza VU segmentado com zonas verde, amarela e vermelha;
   - mantém clip/hot/nominal/low/silent como zonas lógicas.

7. **Experiência mobile**
   - tema escuro próprio;
   - splash animada com Lottie;
   - safe area global para iPhone com notch;
   - suporte a portrait e landscape no iOS;
   - header compartilhado nas telas principais;
   - modais, dialogs e toasts via provider global;
   - toasts não bloqueiam a tela toda;
   - app mantém a tela acordada durante uso.

## Stack

- React `19.0.0`
- React Native `0.78.1`
- TypeScript `5.5.4`
- React Navigation `6`
- `react-native-udp` para transporte UDP nativo
- `@react-native-async-storage/async-storage` para persistência local
- `react-native-safe-area-context` para safe area
- `react-native-gesture-handler` para gestos
- `react-native-svg` para ícones vetoriais
- `lottie-react-native` para splash/animações
- Jest `29`
- TypeScript strict por `tsc --noEmit`

## Estrutura Principal

```txt
src/
  app/
    App.tsx
    components/
    navigation/
  assets/
    icons/
    lotties/
  features/
    about/
    consoleDiscovery/
    busSelection/
    busGroups/
    busMix/
  services/
    x32/
  shared/
    components/
    errors/
    mixer/
    network/
    osc/
    storage/
    theme/
    utils/
    x32/
  theme/
    tokens.*
```

### `src/app`

Contém o bootstrap React Native:

- `App.tsx`: monta `SafeAreaProvider`, `NavigationContainer`,
  `ModalProvider`, `RootNavigator`, splash e KeepAwake.
- `RootNavigator.tsx`: define as rotas principais:
  - `ConsoleDiscovery`;
  - `BusSelection`;
  - `BusGroups`;
  - `BusMix`;
  - `About`.

### `src/features/consoleDiscovery`

Responsável por localizar mesas X32/M32.

Principais peças:

- `ConsoleDiscoveryScreen.tsx`: tela inicial com botão de busca e lista de
  consoles.
- `useConsoleDiscovery.ts`: estado da busca, erros e lista de dispositivos.
- `ConsoleDiscoveryService.ts`: integra com `NetworkScanner`.
- `ConsoleCard.tsx`: card visual de cada console encontrado.

Observação importante: o serviço já possui `validateManualIp(ip)`, mas a UI
atual prioriza descoberta automática e não expõe campo manual de IP na tela.

### `src/features/busSelection`

Carrega os BUS disponíveis no console.

Principais peças:

- `BusSelectionScreen.tsx`: lista BUS/pares estéreo.
- `useBusSelection.ts`: conecta na mesa, carrega BUS e controla refresh.
- `BusService.ts`: lê nomes, cores e links estéreo dos BUS.
- `BusCard.tsx`: card de seleção visual.

### `src/features/busGroups`

Tela intermediária para controle macro do BUS selecionado.

Principais peças:

- `BusGroupsScreen.tsx`: layout principal da tela de grupos.
- `useBusGroups.ts`: orquestra estado real, estado local, persistência,
  faders, mute e sync.
- `X32BusGroupsService.ts`: integra com BUS master e DCA reais.
- `McaChannelFaderService.ts`: calcula e aplica movimentos proporcionais em
  canais atribuídos.
- `BusGroupsSecureStoreService.ts`: persiste configuração local por console.
- `McaChannelSelectionModal.tsx`: modal de seleção de canais por MCA.
- `MasterStrip.tsx`, `McaStrip.tsx`, `VerticalGroupFader.tsx`: UI de faders.

### `src/features/busMix`

Tela de mixagem fina do BUS selecionado.

Principais peças:

- `BusMixScreen.tsx`: lista horizontal/compacta de strips.
- `useBusMix.ts`: carrega canais, aplica fader/mute/pan, presets e sync.
- `BusMixService.ts`: camada OSC para `ch`, `auxin`, `fxrtn`, `/node` e cache.
- `BusMixChannelStore.ts`: snapshot compartilhado entre BusGroups e BusMix.
- `ChannelStructureCache.ts`: cache de estrutura por console.
- `BusMixPresetService.ts`: presets locais por console/BUS.
- `useMeterSubscription.ts`: assinatura compartilhada dos meters.
- `meterDecoder.ts`: decodificação dos blobs de meter.
- `ChannelStrip.tsx`, `VerticalFader.tsx`, `ChannelVuMeter.tsx`: UI de canal.
- `BusMixPresetsModal.tsx`: criação, overwrite, delete e restore de presets.
- `PanControlModal.tsx`: controle de pan.

### `src/shared/osc`

Camada OSC genérica e protocolo X32.

- `OscEncoder.ts`: codifica mensagens OSC.
- `OscDecoder.ts`: decodifica pacotes OSC.
- `OscClient.ts`: request/response, send, subscribe e keep-alive.
- `SharedOscClient.ts`: lease de cliente compartilhado para reduzir sockets.
- `X32Protocol.ts`: paths OSC centralizados.

### `src/shared/network`

Transporte UDP e descoberta.

- `UdpTransport.ts`: bind, send, receive, broadcast e timeouts.
- `NetworkScanner.ts`: descoberta por broadcast e fallback unicast.
- `NativeNetworkInterfaces.ts`: wrapper JS para interfaces nativas.
- `LocalNetworkAccess.ts` e `LocalNetworkPermission.ts`: suporte a permissão
  de rede local.
- `UdpDiagnostics.ts`: diagnóstico de eventos UDP sem poluir LogBox em debug.

### `src/shared/mixer/mock`

Provider Demo para usar o app sem mesa física.

- aparece sempre como console Demo na tela inicial;
- simula BUS, canais, AUX, FX, MCAs e meters;
- permite testar navegação, faders, mute, pan, presets e UI.

## Protocolo OSC Implementado

Porta padrão:

```txt
10023
```

### Descoberta, Validação E Keep-Alive

```txt
/info
/status
/xremote
```

### BUS

```txt
/bus/XX/config/name
/bus/XX/config/color
/config/buslink/1-2
/config/buslink/3-4
...
/config/buslink/15-16
/bus/XX/mix/fader
/bus/XX/mix/on
```

### Canais `CH 01..32`

```txt
/ch/XX/config/name
/ch/XX/config/color
/config/chlink/1-2
/config/chlink/3-4
...
/config/chlink/31-32
/ch/XX/mix/YY/level
/ch/XX/mix/YY/on
/ch/XX/mix/YY/pan
/ch/XX/mix/fader
/ch/XX/mix/on
/ch/XX/mix/pan
/ch/XX/grp/dca
```

### AUX IN `AUX 01..08`

```txt
/auxin/XX/config/name
/auxin/XX/config/color
/auxin/XX/mix/YY/level
/auxin/XX/mix/YY/on
/auxin/XX/mix/YY/pan
```

### FX Return `FX 01..08`

```txt
/fxrtn/XX/config/name
/fxrtn/XX/config/color
/fxrtn/XX/mix/YY/level
/fxrtn/XX/mix/YY/on
/fxrtn/XX/mix/YY/pan
```

### DCA/MCA

```txt
/dca/N/fader
/dca/N/on
/dca/N/config/name
/dca/N/config/color
```

O app chama esses grupos locais de **MCA** na UI, mas a integração real usa
DCAs da mesa quando há console físico.

### Meters

```txt
/meters
/meters/0
/meters/1
/meters/13
/renew
```

O app solicita streams usando `/meters` com o id do meter como argumento.

## Persistência Local

Persistência é feita com `AsyncStorage` por meio de `SecureStoreService`.
Apesar do nome, hoje ele é um wrapper estruturado sobre AsyncStorage, não uma
integração criptografada nativa.

Namespaces importantes:

- `x32-control:console:<console-id>:bus-mix:bus:<bus-id>:presets`
- escopos por console para estado local de BusGroups/MCAs;
- cache de estrutura de canais por console.

Regras atuais:

- presets são locais ao dispositivo;
- presets são isolados por console e BUS;
- composição dos MCAs é local ao dispositivo;
- composição dos MCAs é isolada por console;
- cache de estrutura acelera abertura de BusMix após primeiro carregamento.

## Comportamento De Faders

Valores de fader seguem o raw normalizado da X32:

```txt
0.0 <= raw <= 1.0
```

Conversão visual aproximada:

```txt
raw 0.25 -> -60 dB
raw 0.50 -> -30 dB
raw 0.75 ->   0 dB
raw 1.00 -> +10 dB
```

O BusMix mantém:

- `faderRaw`: valor visual atual;
- `localFaderRaw`: último valor local aplicado;
- `remoteFaderRaw`: último valor recebido da mesa;
- `lastLocalChangeAt`: janela de proteção contra eco remoto;
- `isDirty`: marcação visual de mudança local.

Durante o drag:

- a UI responde imediatamente;
- envios são agrupados em intervalos curtos;
- o release força envio imediato;
- resposta remota atrasada não sobrescreve a interação local recente.

## Ambiente De Desenvolvimento

Use Node 18 ou superior. A versão indicada no projeto fica em:

```txt
.nvmrc
```

Instalação:

```sh
yarn install
```

Rodar Metro:

```sh
yarn start
```

TypeScript:

```sh
yarn tsc
```

Lint:

```sh
yarn lint
```

Testes:

```sh
yarn test
```

Testes em CI:

```sh
yarn test:ci
```

## Scripts Disponíveis

```sh
yarn android
yarn android:clean
yarn assemble:android
yarn bundle:android
yarn icons
yarn ios
yarn ios:simulator
yarn ios:device
yarn ios:devicerenan
yarn start
yarn pod
yarn test
yarn test:ci
yarn test:coverage
yarn test:watch
yarn lint
yarn lint:ci
yarn tsc
yarn tsc:ci
yarn lint:tsc:ci
```

Notas:

- `yarn ios` e `yarn ios:simulator` usam o simulador `iPhone 17`.
- `yarn ios:device` aponta para `iPhone de Ikaro`.
- `yarn ios:devicerenan` aponta para `iPhone de Renan`.
- `postinstall` roda Husky e `pod-install.sh`.
- `pod-install.sh` encapsula CocoaPods via Bundler.

## Rodando No iOS

Instale pods:

```sh
yarn pod
```

Suba Metro:

```sh
yarn start
```

Rode no simulador:

```sh
yarn ios:simulator
```

Rode no iPhone físico configurado:

```sh
yarn ios:device
```

Configurações iOS relevantes:

- bundle id atual: `com.tacimix.app`;
- display name: `Tacimix`;
- `NSLocalNetworkUsageDescription` para permissão de rede local;
- `NSBonjourServices` com `_osc._udp`;
- `NSAllowsLocalNetworking=true`;
- `ITSAppUsesNonExemptEncryption=false`;
- `UIBackgroundModes=audio`;
- orientações habilitadas:
  - portrait;
  - landscape left;
  - landscape right.

Ponto de atenção para App Review:

- `UIBackgroundModes=audio` deve permanecer apenas se o uso em background for
  justificável na submissão.

Ponto de atenção para descoberta iOS:

- broadcast/multicast em iOS 14+ pode depender do ambiente de rede, do perfil
  de assinatura e do entitlement `com.apple.developer.networking.multicast`;
- o app tenta reduzir essa dependência com broadcast dirigido e fallback
  unicast;
- o iPhone físico precisa estar na mesma rede/sub-rede da mesa.

## Rodando No Android

Suba Metro:

```sh
yarn start
```

Rode em debug:

```sh
yarn android
```

Gerar APK/AAB conforme scripts do projeto:

```sh
yarn assemble:android
yarn bundle:android
```

Permissões Android esperadas:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
```

## Usando Com Uma Mesa Real

Checklist de rede:

1. Ligue a X32/M32 na rede local.
2. Confirme o IP em `Setup > Network`.
3. Conecte o celular na mesma rede Wi-Fi ou VLAN da mesa.
4. Evite rede convidado, isolamento de clientes e VPN.
5. No iPhone, confirme que a permissão **Rede Local** está ativa para Tacimix.
6. Abra o app.
7. Toque em **Buscar mesas na rede**.
8. Escolha a mesa encontrada.
9. Escolha o BUS.
10. Ajuste grupos e mix.

O simulador iOS usa a pilha de rede do Mac. Se o simulador enxerga a mesa mas
o iPhone físico não, o problema provavelmente está no Wi-Fi/VLAN/permissão do
iPhone, não necessariamente no código do app.

## Testes Automatizados

A suíte atual cobre:

- protocolo OSC;
- encoder e decoder OSC;
- cliente OSC;
- paths e validações de `X32Protocol`;
- scanner de rede e fallback de descoberta;
- diagnósticos UDP;
- conversões de fader/dB;
- clamp e level/dB;
- decoder de meters;
- hook de meter;
- store compartilhada do BusMix;
- presets do BusMix;
- cálculo e aplicação de MCA;
- hook de BusGroups.

Arquivos de teste:

```txt
__tests__/features/busGroups/hooks/useBusGroups.test.ts
__tests__/features/busGroups/services/McaChannelFaderService.test.ts
__tests__/features/busMix/hooks/useMeterSubscription.test.ts
__tests__/features/busMix/services/BusMixChannelStore.test.ts
__tests__/features/busMix/services/BusMixPresetService.test.ts
__tests__/features/busMix/utils/meterDecoder.test.ts
__tests__/shared/network/NetworkScanner.test.ts
__tests__/shared/network/UdpDiagnostics.test.ts
__tests__/shared/osc/OscClient.test.ts
__tests__/shared/osc/OscDecoder.test.ts
__tests__/shared/osc/OscEncoder.test.ts
__tests__/shared/osc/X32Protocol.test.ts
__tests__/shared/utils/clamp.test.ts
__tests__/shared/utils/faderDb.test.ts
__tests__/shared/utils/levelToDb.test.ts
```

Observação: alguns testes de `NetworkScanner` podem ultrapassar o timeout
padrão de 5000 ms por causa do fluxo broadcast + unicast. Quando necessário,
rode:

```sh
yarn jest __tests__/shared/network/NetworkScanner.test.ts --runInBand --testTimeout=10000
```

## Logs De Desenvolvimento

A pasta `logs/` mantém registros curtos de decisões técnicas, correções e
validações. Ela é usada como memória operacional do projeto.

Padrão atual:

```txt
logs/YYYY-MM-DD_HH-mm-ss-descricao-curta.txt
```

Cada log deve registrar:

- contexto;
- causa;
- ação;
- resultado;
- arquivos tocados;
- validação;
- pontos de atenção.

## Documentação Interna

```txt
docs/global/
docs/skills/
```

- `docs/global/`: auditorias e documentos maiores do projeto.
- `docs/skills/`: guias reutilizáveis do projeto, em processo de alinhamento
  ao padrão de Agent Skills.

## Limitações Conhecidas

- A UI atual não expõe campo manual de IP, embora o serviço tenha suporte a
  `validateManualIp(ip)`.
- Descoberta automática em iOS pode falhar se o iPhone não estiver exatamente
  na mesma rede/sub-rede da mesa.
- Broadcast/multicast em iOS pode exigir entitlement específico para máxima
  confiabilidade.
- `UIBackgroundModes=audio` precisa de justificativa real para App Review.
- Presets e MCAs são locais ao dispositivo, não sincronizados em nuvem.
- O armazenamento atual usa AsyncStorage, não Keychain/Keystore criptografado.
- Meters dependem do formato de blob retornado pelo firmware da mesa.
- Validar sempre em mesa real antes de usar mudanças de OSC em produção.

## Próximas Validações Recomendadas

Em mesa real:

- confirmar descoberta automática no iPhone físico;
- confirmar fallback unicast no iPhone físico;
- confirmar se a ausência de campo manual de IP é aceitável;
- testar BUS mono e BUS estéreo;
- testar master fader e mute do BUS;
- testar os 8 MCAs;
- testar seleção de canais por MCA;
- testar fader proporcional de MCA;
- testar mute de MCA;
- testar fader/mute/pan de `CH`, `AUX` e `FX`;
- testar presets com as 48 fontes;
- testar restore de preset em mesa real;
- testar meters em `CH`, `AUX` e `FX`;
- testar landscape em iPhones com notch.

Antes de release:

- rodar `yarn tsc`;
- rodar `yarn test`;
- rodar `yarn lint`;
- validar `plutil -lint ios/Tacimix/Info.plist`;
- revisar justificativa de background audio;
- revisar build number e marketing version;
- gerar build iOS/Android em configuração de distribuição.
