# Architecture

Last updated: 2026-05-24

## Architectural Summary

Tacimix is a React Native mobile app organized by feature folders and shared infrastructure. It talks to X32/M32 consoles over OSC/UDP, with a local Demo mixer provider for offline usage. The app is intentionally state-light: most screen state is held in feature hooks, shared cross-screen mixer data is held in small service stores, and device persistence is isolated behind storage services.

## Runtime Layering

```txt
App bootstrap
  -> Navigation
    -> Feature screens
      -> Feature hooks
        -> Feature services
          -> Shared OSC/network/storage/mixer services
            -> Native UDP / AsyncStorage / iOS native modules
```

## App Bootstrap

`src/app/App.tsx` composes:

- `SafeAreaProvider`;
- `SafeAreaView` with all edges enabled;
- `NavigationContainer` using `darkTheme`;
- `ModalProvider`;
- `RootNavigator`;
- `AppSplashScreen`;
- `react-native-keep-awake`.

In DEBUG on iOS, `AppDelegate.mm` also disables idle timer natively.

## Navigation Architecture

`RootNavigator.tsx` defines all route params centrally.

Route contract:

```txt
ConsoleDiscovery: undefined
BusSelection: { consoleIp, consoleName }
BusGroups: { consoleIp, busNumber, busName, linkedBusNumber? }
BusMix: { consoleIp, busNumber, busName, linkedBusNumber? }
About: undefined
```

Screen headers are hidden at native stack level. Feature screens render custom headers via shared components.

## Feature Architecture

Current features:

- `about`: static product/about screen.
- `consoleDiscovery`: discovers and lists consoles.
- `busSelection`: loads and displays BUS destinations.
- `busGroups`: macro control for selected BUS.
- `busMix`: detailed monitor send mixer.

Common feature pattern:

```txt
src/features/[feature]/
  components/
  hooks/
  routes/
  screens/
  services/
  types/
  utils/
```

Not every feature uses every subfolder.

## Shared Infrastructure

`src/shared/osc`:

- OSC message encoding/decoding.
- Request/response client.
- Subscription dispatch.
- X32 path construction.
- Shared OSC client leases.

`src/shared/network`:

- UDP bind/send/receive abstraction.
- iOS Local Network permission handling.
- iOS native broadcast/interface discovery.
- Broadcast/unicast console scanning.
- UDP diagnostic classification.

`src/shared/storage`:

- Namespaced AsyncStorage wrapper.
- Scoped key creation.
- JSON object helpers.

`src/shared/mixer`:

- `MixerControlProvider` abstraction.
- Demo/mock provider.

`src/shared/components`:

- App UI building blocks.
- Modal provider and overlays.

## Data Flow - Console Discovery

```txt
ConsoleDiscoveryScreen
  -> useConsoleDiscovery
    -> ConsoleDiscoveryService
      -> NetworkScanner
        -> UdpTransport
          -> react-native-udp
          -> iOS native broadcast info when available
```

Discovery behavior:

- Demo device is present initially.
- Real scan binds UDP socket with broadcast enabled.
- Sends address-only OSC `/info`.
- Sends to native broadcast addresses plus `255.255.255.255`.
- If no devices respond, scans unicast addresses from local interfaces.
- Parses `/info` replies into `ConsoleDevice`.

## Data Flow - BUS Selection

```txt
BusSelectionScreen
  -> useBusSelection
    -> BusService
      -> OscClient
      -> X32Protocol
```

BUS loading:

- Connects to selected console.
- Starts `/xremote` keep-alive.
- Reads names/colors for BUS `1..16`.
- Reads stereo link map from `/config/buslink/*`.
- Collapses linked odd/even pairs into one selectable item.

## Data Flow - BusGroups

```txt
BusGroupsScreen
  -> useBusGroups
    -> X32BusGroupsService
    -> BusGroupsSecureStoreService
    -> McaChannelFaderService
    -> BusMixService
    -> BusMixChannelStore
```

BusGroups responsibilities:

- Load BUS master fader/on.
- Load DCA `1..8` fader/on baseline.
- Load CH DCA assignments from `/ch/XX/grp/dca`.
- Restore local MCA assignments/names from storage.
- Load available BusMix sources for channel selection.
- Subscribe to remote master and DCA updates.
- Subscribe to BusMix channel changes to recompute MCA state.
- Persist local MCA state with debounce.

MCA behavior:

- Empty MCAs remain empty when no local state exists.
- Assigned sources can include CH/AUX/FX.
- Fader value is computed from assigned source average.
- Fader movement applies proportional changes through `McaChannelFaderService`.
- Mute applies to assigned source sends.

## Data Flow - BusMix

```txt
BusMixScreen
  -> useBusMix
    -> BusMixService
    -> BusMixChannelStore
    -> BusMixPresetService
    -> ChannelStructureCache
    -> useMeterSubscription
```

BusMix loading:

- Connects through shared OSC client unless Demo.
- Fetches channel link map.
- Loads channels from cache when possible.
- Uses `/node` bulk loading when supported.
- Falls back to per-path requests when `/node` fails.
- Builds 48 `Channel` objects.

BusMix control:

- Level writes use float OSC.
- UI updates immediately.
- Drag writes are throttled.
- Release writes immediately.
- Remote echo is reconciled with local-protection window.
- Background fader sync runs periodically with jitter.
- Mute respects linked channel pairs for CH links.

## Data Flow - Presets

```txt
BusMixPresetsModal
  -> useBusMix
    -> BusMixPresetService
      -> secureStore scoped by console + bus
```

Preset behavior:

- Max 10 presets per console/BUS.
- Captures channels from `channelsRef.current`.
- Stores source id, label, kind, source number, raw level, dB, and mute.
- Restore applies levels and mute state back through normal control paths.
- Overlay blocks interaction during restore.

## Data Flow - Meters

```txt
BusMixScreen
  -> useMeterSubscription
    -> SharedOscClient
    -> /meters subscription
    -> meterDecoder
    -> ChannelVuMeter
```

Meter behavior:

- Requests `/meters/1` when visible CH listeners exist.
- Requests `/meters/13` when visible AUX/FX listeners exist.
- Renews stream every 8000 ms.
- Uses listener registration per channel id.
- Demo provider emits synthetic meter values.

## Connection Lifecycle

Two connection styles exist:

- Direct `OscClient` ownership for simpler flows like BUS selection.
- Shared `OscClient` lease for BusGroups/BusMix/meters to avoid socket churn.

Shared client release:

- ref-counted by endpoint;
- release delay is 5000 ms;
- reconnects are avoided during screen transitions.

## Error Handling

Core error type:

- `AppError` in `src/shared/errors/AppError.ts`.

Patterns:

- Feature hooks convert errors through `getErrorMessage`.
- Network-specific errors are mapped in `UdpDiagnostics`.
- Toasts are used for transient feature errors.
- `ErrorState` is used for reloadable screen errors.
- Background sync errors are often best-effort and intentionally silent.

## Persistence Architecture

Storage abstraction:

- `SecureStoreService` wraps AsyncStorage.

Current persisted concerns:

- BusMix presets per console/BUS.
- BusGroups MCA state per console.
- Channel structure cache per console.

Important naming concern:

- Despite the name, `SecureStoreService` is not currently backed by Keychain/Keystore.

## Native iOS Architecture

`AppDelegate.mm`:

- Old architecture bootstrap.
- Manual `RCTBridge` and `RCTRootView`.
- Sets root background color.

`TacimixNetworkInfo.m`:

- Requests Local Network access using `NSNetServiceBrowser`.
- Reads active IPv4 interfaces via `getifaddrs`.
- Returns address/netmask/broadcast to JS.

`LocalNetworkPermission.m`:

- Uses Network.framework browser preflight.
- Detects denied/waiting/granted states.
- Logs diagnostic messages.

## Architectural Boundaries

Feature code should own:

- UI composition;
- feature hooks;
- feature services;
- feature local types.

Shared code should own:

- cross-feature OSC/network/storage primitives;
- reusable theme/components;
- X32 protocol path helpers;
- generic utilities.

Avoid:

- feature-specific behavior in `src/shared` unless it is truly reused;
- raw OSC path strings in screens;
- AsyncStorage direct calls outside storage services;
- direct UDP use outside `UdpTransport` or scanner-level code.

