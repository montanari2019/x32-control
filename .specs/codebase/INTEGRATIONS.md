# Integrations

Last updated: 2026-05-24

## X32/M32 OSC

Protocol:

- OSC over UDP.
- Default port: `10023`.
- Paths centralized in `src/shared/osc/X32Protocol.ts`.

Discovery:

- `/info`.
- Address-only OSC payload for discovery.
- Broadcast and unicast discovery implemented in `NetworkScanner`.

Keep-alive:

- `/xremote`.
- `OscClient` sends every 5000 ms while keep-alive ref count is active.

BUS paths:

- `/bus/XX/config/name`.
- `/bus/XX/config/color`.
- `/config/buslink/N-N`.
- `/bus/XX/mix/fader`.
- `/bus/XX/mix/on`.

CH paths:

- `/ch/XX/config/name`.
- `/ch/XX/config/color`.
- `/config/chlink/N-N`.
- `/ch/XX/mix/YY/level`.
- `/ch/XX/mix/YY/on`.
- `/ch/XX/mix/YY/pan`.
- `/ch/XX/grp/dca`.

AUX paths:

- `/auxin/XX/config/name`.
- `/auxin/XX/config/color`.
- `/auxin/XX/mix/YY/level`.
- `/auxin/XX/mix/YY/on`.
- `/auxin/XX/mix/YY/pan`.

FX Return paths:

- `/fxrtn/XX/config/name`.
- `/fxrtn/XX/config/color`.
- `/fxrtn/XX/mix/YY/level`.
- `/fxrtn/XX/mix/YY/on`.
- `/fxrtn/XX/mix/YY/pan`.

DCA paths:

- `/dca/N/fader`.
- `/dca/N/on`.
- `/dca/N/config/name`.
- `/dca/N/config/color`.

Meters:

- `/meters`.
- `/meters/1`.
- `/meters/13`.
- `/renew`.

## UDP Transport

Library:

- `react-native-udp`.

Wrapper:

- `src/shared/network/UdpTransport.ts`.

Responsibilities:

- Bind UDP sockets.
- Configure broadcast.
- Send packets with timeout.
- Receive messages.
- Convert native errors to `AppError`.
- Diagnose Local Network permission-style failures.

Important timing:

- Send timeout currently 5000 ms.
- iOS broadcast configuration delay currently 500 ms.

## iOS Native Modules

### TacimixNetworkInfo

File:

- `ios/Tacimix/TacimixNetworkInfo.m`.

Exports:

- `requestLocalNetworkAccess`.
- `getBroadcastAddresses`.
- `getNetworkInterfaces`.

Use:

- Reads IPv4 active interfaces.
- Provides broadcast/netmask/address for scanner fallback.
- Triggers Local Network prompt through Bonjour browsing.

### LocalNetworkPermission

File:

- `ios/Tacimix/LocalNetworkPermission.m`.

Exports:

- `requestPermission`.

Use:

- Uses Network.framework browser preflight.
- Detects granted/denied/waiting states.
- Helps prompt or diagnose Local Network permission.

## iOS Platform Configuration

Important plist keys:

- `CFBundleDisplayName = Tacimix`.
- `NSLocalNetworkUsageDescription`.
- `NSBonjourServices = _osc._udp`.
- `NSAllowsLocalNetworking = true`.
- `ITSAppUsesNonExemptEncryption = false`.
- `UIBackgroundModes = audio`.
- Supported orientations:
  - portrait;
  - landscape left;
  - landscape right.

Important concern:

- `UIBackgroundModes=audio` must be justified or removed before App Review.

## Android Platform Configuration

Gradle:

- AGP `8.8.0`.
- Kotlin `2.0.21`.
- SDK 35.
- New Architecture disabled.
- Hermes enabled.

Flavors:

- develop.
- homolog.
- production.

Signing:

- debug keystore for debug/develop.
- homolog/release read from `keystore.properties` or environment variables.

Scripts:

- `android/assembleHomologRelease.sh`.
- `android/bundleRelease.sh`.

## Local Storage

Library:

- `@react-native-async-storage/async-storage`.

Wrapper:

- `src/shared/storage/SecureStoreService.ts`.

Uses:

- BusMix presets.
- BusGroups MCA local state.
- Channel structure cache.

Risk:

- Wrapper name suggests secure storage, but current implementation uses AsyncStorage.

## Demo Mixer Provider

Files:

- `src/shared/mixer/MixerControlProvider.ts`.
- `src/shared/mixer/mock/demoMixerProvider.ts`.
- `src/shared/mixer/mock/mockMixerProvider.ts`.

Use:

- Provides Demo console.
- Simulates buses, channels, MCAs, faders, mutes, pan, and meters.
- Enables offline app validation.

## Asset Generation

Script:

- `scripts/generate-icons.js`.

Uses:

- `sharp`.
- App icon generation.

## CocoaPods/Bundler

Files:

- `Gemfile`.
- `Gemfile.lock`.
- `pod-install.sh`.
- `ios/Podfile`.

Use:

- `yarn pod`.
- `postinstall`.

## External Hardware Dependency

Known tested console from logs:

- X32 at `192.168.88.250:10023`.
- Firmware reported in logs: `4.02`.

This is historical context from logs and should be revalidated for current hardware sessions.

