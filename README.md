# X32 Bus AUX Control

Aplicativo mobile em React Native com TypeScript para controlar envios BUS/AUX de mesas Behringer X32 e Midas M32 via OSC sobre UDP.

## Stack

- React Native 0.74
- TypeScript estrito
- React Navigation
- `react-native-udp` para UDP nativo em Android/iOS
- OSC isolado em `src/shared/osc`
- Arquitetura por feature em `src/features`

## Instalação

```sh
yarn install
yarn lint
yarn tsc
yarn test
```

Android:

```sh
yarn start
yarn android
```

iOS:

```sh
yarn pod
yarn start
yarn ios
```

## Permissões de rede

Android precisa de acesso à rede e Wi-Fi/multicast no manifesto nativo:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
```

iOS deve permitir tráfego local no `Info.plist`:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>O app precisa encontrar e controlar consoles X32/M32 na rede local.</string>
<key>NSBonjourServices</key>
<array>
  <string>_osc._udp</string>
</array>
```

## Como conectar

1. Conecte a X32/M32 por Ethernet ao mesmo roteador ou rede do celular.
2. Confirme o IP da mesa em `Setup > Network`.
3. Abra o app e toque em **Buscar mesas na rede**.
4. Se o broadcast UDP não encontrar a mesa, informe o IP manualmente.
5. Selecione a mesa, escolha o BUS e ajuste os envios dos canais.

A porta padrão usada é `10023`, conforme protocolo X32/M32.

## OSC implementado

- Descoberta: `/info`
- Validação: `/status`
- Keep-alive: `/xremote`
- Nome do canal: `/ch/{channel}/config/name`
- Cor do canal: `/ch/{channel}/config/color`
- Nome do BUS: `/bus/{bus}/config/name`
- Envio de canal para BUS: `/ch/{channel}/mix/{bus}/level`
- ON/MUTE do envio: `/ch/{channel}/mix/{bus}/on`
- Master do BUS: `/bus/{bus}/mix/fader` e `/bus/{bus}/mix/on`

Valores de fader são enviados como `float` entre `0.0` e `1.0`.

## Estrutura

```txt
src/
  app/
  shared/
    osc/
    network/
    theme/
    components/
    utils/
    errors/
  features/
    consoleDiscovery/
    busSelection/
    busMix/
```

Cada feature contém `screens`, `routes`, `components`, `hooks`, `services` e `types`.

## Limitações conhecidas

- UDP broadcast pode ser bloqueado por alguns roteadores, redes corporativas ou isolamento de clientes Wi-Fi. Nesses casos, use IP manual.
- React Native não expõe UDP no core; o transporte está isolado em `UdpTransport` para facilitar troca de biblioteca nativa se necessário.
- AUX IN e FX Returns variam por firmware e roteamento. A primeira versão carrega CH 01-32 com a mesma arquitetura preparada para expansão.
- Algumas respostas OSC da X32/M32 podem variar entre firmware/modelo; respostas inválidas são descartadas e tratadas como erro de protocolo quando afetam requests críticos.
