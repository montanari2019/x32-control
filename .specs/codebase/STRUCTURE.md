# Structure

Last updated: 2026-06-14

## Root Files

```txt
README.md
package.json
yarn.lock
package-lock.json
tsconfig.json
babel.config.js
metro.config.js
jest.config.js
app.json
index.js
Gemfile
Gemfile.lock
pod-install.sh
.nvmrc
.eslintrc.js
.prettierrc
.watchmanconfig
```

## Root Directories

```txt
android/
ios/
src/
__tests__/
assets/
docs/
logs/
scripts/
vendor/
node_modules/
.specs/
```

## Source Tree

```txt
src/
  app/
  assets/
  features/
  services/
  shared/
  theme/
  types/
```

## App Layer

```txt
src/app/
  App.tsx
  components/AppSplashScreen.tsx
  navigation/RootNavigator.tsx
```

Responsibilities:

- bootstrap providers;
- navigation graph;
- splash;
- keep-awake behavior.

## Assets Layer

```txt
src/assets/
  icons/
  lotties/
  index.ts
```

Icons:

- `ArrowLeft`;
- `Close`;
- `Info`;
- `Logo`;
- `Play`;
- `RecoveryData`;
- `SaveData`;
- `Trash`.

Lottie:

- `soundBarsAnimation.json`.

## Features

```txt
src/features/about/
src/features/consoleDiscovery/
src/features/busSelection/
src/features/busGroups/
src/features/busMix/
```

### about

```txt
screens/AboutScreen.tsx
```

### consoleDiscovery

```txt
components/ConsoleCard.tsx
hooks/useConsoleDiscovery.ts
routes/consoleDiscovery.routes.ts
screens/ConsoleDiscoveryScreen.tsx
services/ConsoleDiscoveryService.ts
types/ConsoleDevice.ts
```

### busSelection

```txt
components/BusCard.tsx
hooks/useBusSelection.ts
routes/busSelection.routes.ts
screens/BusSelectionScreen.tsx
services/BusService.ts
types/Bus.ts
```

### busGroups

```txt
components/
hooks/
screens/
services/
types/
utils/
```

Main files:

- `screens/BusGroupsScreen.tsx`;
- `hooks/useBusGroups.ts`;
- `services/BusGroupsService.ts`;
- `services/X32BusGroupsService.ts` compatibility alias;
- `services/McaChannelFaderService.ts`;
- `services/BusGroupsSecureStoreService.ts`;
- `components/McaChannelSelectionModal.tsx`;
- `components/MasterStrip.tsx`;
- `components/McaStrip.tsx`.

### busMix

```txt
components/
hooks/
routes/
screens/
services/
types/
utils/
```

Main files:

- `screens/BusMixScreen.tsx`;
- `hooks/useBusMix.ts`;
- `hooks/useMeterSubscription.ts`;
- `services/BusMixService.ts`;
- `services/BusMixChannelStore.ts`;
- `services/BusMixPresetService.ts`;
- `services/ChannelStructureCache.ts`;
- `components/ChannelStrip.tsx`;
- `components/BusMixPresetsModal.tsx`;
- `components/PanControlModal.tsx`;
- `utils/meterDecoder.ts`.

## Shared Layer

```txt
src/shared/
  components/
  console/
  errors/
  mixer/
  network/
  osc/
  storage/
  theme/
  utils/
  x32/
```

### shared/console

Console adapter boundary:

- `IConsoleAdapter`;
- `ConsoleAdapterFactory`;
- `ConsoleEndpoint`;
- `ConsoleAdapterKind`;
- normalized type aliases;
- `adapters/x32/X32Adapter` public entrypoint;
- `adapters/x32/X32Adapter/` focused X32 implementation modules:
  lifecycle, BUS, BusMix, BusGroups, meters, `/node`, cache, constants, and
  OSC value helpers;
- `adapters/x32/X32SourceDefinitions`;
- `adapters/demo/DemoConsoleAdapter`;
- `adapters/wing/README.md`.

### shared/components

Reusable UI:

- `AppHeader`;
- `Button`;
- `Screen`;
- `LoadingState`;
- `ErrorState`;
- `FaderDbScale`;
- `Modal`;
- `Dialog`;
- `AlertDialog`;
- `Toast`.

### shared/network

Network primitives:

- `UdpTransport`;
- `NetworkScanner`;
- `NativeNetworkInterfaces`;
- `LocalNetworkAccess`;
- `LocalNetworkPermission`;
- `UdpDiagnostics`.

### shared/osc

OSC primitives:

- `OscClient`;
- `OscEncoder`;
- `OscDecoder`;
- `OscMessage`;
- `SharedOscClient`;
- `X32Protocol`.

### shared/mixer

Mixer abstraction and Demo:

- `MixerControlProvider`;
- `mock/demoMixerProvider`;
- `mock/mockMixerProvider`.

### shared/storage

Storage abstraction:

- `SecureStoreService`;
- `index.ts`.

### shared/x32

X32 helpers:

- `busStereoLink`;
- `channelColor`;
- `meters`;
- `pan`.

## Tests Structure

```txt
__tests__/
  features/
    busGroups/
    busMix/
  shared/
    network/
    osc/
    utils/
```

## Native Structure

Android:

```txt
android/
  app/build.gradle
  app/proguard-rules.pro
  build.gradle
  gradle.properties
  settings.gradle
  assembleHomologRelease.sh
  bundleRelease.sh
```

iOS:

```txt
ios/
  Podfile
  Podfile.lock
  Tacimix/
    AppDelegate.mm
    Info.plist
    TacimixNetworkInfo.m
    LocalNetworkPermission.m
    Tacimix.entitlements
    PrivacyInfo.xcprivacy
  Tacimix.xcodeproj/
  Tacimix.xcworkspace/
```

## Planning Structure

Global:

```txt
.specs/project/
.specs/codebase/
.specs/quick/
```

Feature-local:

```txt
src/features/[feature]/.specs/
  STATE.md
  feature/
```
