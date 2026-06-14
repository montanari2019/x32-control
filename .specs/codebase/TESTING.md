# Testing

Last updated: 2026-06-14

## Test Framework

- Jest preset: `react-native`.
- TypeScript transform: `ts-jest`.
- Test pattern: `**/__tests__/**/*.test.ts`.
- Path aliases mapped for `@app`, `@features`, and `@shared`.

## Test Commands

Run all tests:

```sh
yarn test
```

Run CI tests:

```sh
yarn test:ci
```

Run with coverage:

```sh
yarn test:coverage
```

Run watch mode:

```sh
yarn test:watch
```

Run focused network scanner test with higher timeout:

```sh
yarn jest __tests__/shared/network/NetworkScanner.test.ts --runInBand --testTimeout=10000
```

Typecheck:

```sh
yarn tsc
```

Lint:

```sh
yarn lint
```

Combined CI quality:

```sh
yarn lint:tsc:ci
```

## Current Test Files

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
__tests__/shared/console/ConsoleAdapterFactory.test.ts
__tests__/shared/console/X32SourceDefinitions.test.ts
__tests__/shared/console/adapterBoundaryGuard.test.ts
__tests__/shared/utils/clamp.test.ts
__tests__/shared/utils/faderDb.test.ts
__tests__/shared/utils/levelToDb.test.ts
```

## Coverage By Area

OSC:

- Encoding.
- Decoding.
- Client request/subscription behavior.
- X32 protocol path/range behavior.

Console adapter:

- Factory selection for Demo, dev mock, X32/M32, and unimplemented WING.
- X32 source definition path parity for CH/AUX/FX BusMix sends.
- Feature boundary guard against direct protocol/adapter-internal imports.

Network:

- Network scanner broadcast/unicast behavior.
- UDP diagnostics classification.

BusMix:

- Channel store behavior.
- Preset persistence and limits.
- Meter subscription.
- Meter blob decoder.

BusGroups:

- `useBusGroups` behavior.
- MCA fader calculation/application service.

Utilities:

- clamp.
- fader raw/dB conversion.
- level/dB conversion.

## Known Test Gaps

- No `*.test.tsx` files are currently discovered by Jest config.
- Most UI components do not appear to have component render tests.
- Native iOS modules are not directly unit-tested in this repo.
- Android build scripts are not unit-tested.
- Real X32/M32 hardware behavior requires manual/UAT validation.
- App Store plist validation is handled manually with `plutil`, not as test automation.

## Recommended Gates By Task Type

Network/OSC changes:

- `yarn jest __tests__/shared/console --runInBand` when adapter boundaries are
  involved.
- `yarn jest __tests__/shared/osc --runInBand` when applicable.
- `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`.
- `yarn tsc`.

BusMix changes:

- `yarn jest __tests__/features/busMix --runInBand`.
- `yarn tsc`.
- Manual Demo flow.

BusGroups changes:

- `yarn jest __tests__/features/busGroups --runInBand`.
- `yarn tsc`.
- Manual Demo flow.

UI-only changes:

- `yarn tsc`.
- `yarn lint` when available.
- Manual simulator/device check.

iOS native/plist changes:

- `plutil -lint ios/Tacimix/Info.plist`.
- `xcodebuild build -workspace ios/Tacimix.xcworkspace -scheme Tacimix -configuration Debug`.
- Physical device validation when network behavior is involved.

Android build changes:

- `cd android && ./gradlew tasks` for sanity.
- Relevant assemble/bundle command.

## Manual UAT Needs

Real console:

- Discover console.
- Select BUS.
- Control master fader/mute.
- Assign MCA channels.
- Move MCA.
- Toggle MCA mute.
- Control CH/AUX/FX faders.
- Toggle CH/AUX/FX mute/on.
- Adjust pan.
- Save/restore presets.
- Confirm meters.

Device:

- iPhone physical device on same Wi-Fi/subnet.
- iOS Local Network permission enabled.
- Android physical or emulator for gesture/layout validation.
