# Stack

Last updated: 2026-05-24

## Runtime

- Node.js: `>=18` from `package.json`.
- Local Node hint: `.nvmrc`.
- Package managers present:
  - `yarn.lock`;
  - `package-lock.json`.
- Primary scripts are npm/yarn scripts in `package.json`.

## Application Framework

- React: `19.0.0`.
- React Native: `0.78.1`.
- TypeScript: `5.5.4`.
- React Native CLI: `15.0.0`.

## Navigation

- `@react-navigation/native`: `6.1.18`.
- `@react-navigation/native-stack`: `6.11.0`.
- `react-native-screens`: `4.9.1`.

Root navigation:

- `src/app/navigation/RootNavigator.tsx`.

Routes:

- `ConsoleDiscovery`.
- `BusSelection`.
- `BusGroups`.
- `BusMix`.
- `About`.

## Native And Device Libraries

- `react-native-udp`: `4.1.7`.
- `@react-native-async-storage/async-storage`: `2.2.0`.
- `react-native-safe-area-context`: `5.7.0`.
- `react-native-gesture-handler`: `2.31.2`.
- `react-native-keep-awake`: `4.0.0`.
- `@react-native-community/slider`: `4.5.7`.
- `react-native-svg`: `15.15.4`.
- `lottie-react-native`: `7.3.6`.
- `buffer`: `6.0.3`.

## Testing Stack

- Jest: `29.7.0`.
- `ts-jest`: `29.2.4`.
- `@testing-library/react-native`: `12.5.2`.
- `react-test-renderer`: `19.0.0`.
- Jest preset: `react-native`.
- Tests are discovered by `**/__tests__/**/*.test.ts`.

## Linting And Formatting

- ESLint config: `.eslintrc.js`.
- React Native ESLint config: `@react-native/eslint-config`.
- Prettier: `2.8.8`.
- `eslint-config-prettier`: `8.10.0`.
- `eslint-plugin-prettier`: `4.2.1`.

## TypeScript Configuration

`tsconfig.json`:

- extends `@react-native/typescript-config/tsconfig.json`;
- strict mode enabled;
- path aliases:
  - `@app/* -> src/app/*`;
  - `@assets -> src/assets/index`;
  - `@shared/* -> src/shared/*`;
  - `@features/* -> src/features/*`.

Babel module resolver mirrors these aliases.

## iOS Stack

- CocoaPods managed through `ios/Podfile`.
- App target: `Tacimix`.
- Test target: `TacimixTests`.
- New Architecture disabled in Podfile: `:new_arch_enabled => false`.
- AppDelegate uses old-architecture manual `RCTBridge`/`RCTRootView`.
- Hermes enabled through React Native defaults/build config.
- iOS native modules:
  - `TacimixNetworkInfo.m`;
  - `LocalNetworkPermission.m`.

Important iOS files:

- `ios/Tacimix/Info.plist`.
- `ios/Tacimix/Tacimix.entitlements`.
- `ios/Tacimix/PrivacyInfo.xcprivacy`.
- `ios/Tacimix.xcodeproj/project.pbxproj`.
- `ios/Tacimix.xcworkspace`.

## Android Stack

Android Gradle:

- Android Gradle Plugin: `8.8.0`.
- Kotlin: `2.0.21`.
- Build tools: `35.0.0`.
- minSdk: `24`.
- compileSdk: `35`.
- targetSdk: `35`.
- NDK: `27.1.12297006`.
- New Architecture: `false`.
- Hermes: `true`.

Android flavors:

- `develop`;
- `homolog`;
- `production`.

Android build scripts:

- `android/assembleHomologRelease.sh`;
- `android/bundleRelease.sh`.

## App-Level Scripts

```txt
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

## Assets And UI Stack

- SVG icons are in `src/assets/icons`.
- Lottie animation is in `src/assets/lotties`.
- Shared theme tokens exist under:
  - `src/shared/theme`;
  - `src/theme/tokens.*`.
- Current app uses `src/shared/theme/*` heavily.

