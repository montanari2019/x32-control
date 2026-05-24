# Concerns

Last updated: 2026-05-24

## iOS Physical Discovery Reliability

Area: `src/shared/network`, iOS native modules, physical network environment.

Evidence:

- Logs show simulator could reach X32 through Mac network while iPhone physical device behavior depended on Wi-Fi/subnet.
- `NetworkScanner` has broadcast plus unicast fallback because broadcast responses may not return reliably on iOS.
- App does not currently have multicast entitlement recorded in code/docs.

Impact:

- A user may fail to discover a real console even when the console is reachable from another device.
- Support/debug burden is high because network environment matters.

Suggested action:

- Validate on physical iPhone connected to same subnet as console.
- Decide if manual IP UI should return.
- Consider Apple multicast entitlement only if product depends on broadcast/multicast.

Status: open.

## Manual IP Service Exists But UI Does Not Expose It

Area: `src/features/consoleDiscovery`.

Evidence:

- `ConsoleDiscoveryService.validateManualIp(ip)` exists.
- `ConsoleDiscoveryScreen` only shows "Buscar mesas na rede" and console cards.
- Logs from 2026-05-15 mention manual IP was added to unblock iOS, but current UI does not expose it.

Impact:

- If auto discovery fails, user cannot connect by known console IP from the UI.

Suggested action:

- Product decision: restore manual IP field, saved console entry, or an advanced network troubleshooting panel.

Status: open.

## UIBackgroundModes Audio App Review Risk

Area: `ios/Tacimix/Info.plist`.

Evidence:

- `UIBackgroundModes` contains `audio`.
- Log `2026-05-20_20-27-40-ios-infoplist-appstore-fix.txt` explicitly notes it should remain only if justified for App Review.

Impact:

- App Store review risk if background audio mode is not functionally justified.

Suggested action:

- Confirm requirement.
- Remove if not needed.
- Document justification if kept.

Status: open.

## SecureStoreService Name Does Not Match Storage Guarantees

Area: `src/shared/storage/SecureStoreService.ts`.

Evidence:

- Implementation uses AsyncStorage.
- Name implies secure storage.

Impact:

- Future maintainers may assume data is encrypted or backed by Keychain/Keystore.
- Not currently critical for presets/MCA config, but naming is misleading.

Suggested action:

- Rename to `StorageService`/`ScopedStorageService` or implement true secure storage if sensitive data is introduced.

Status: open.

## Real Meter Mapping Requires Hardware Validation

Area: `src/features/busMix/hooks/useMeterSubscription.ts`, `src/features/busMix/utils/meterDecoder.ts`.

Evidence:

- Meters decode `/meters/1` and `/meters/13`.
- Logs repeatedly mark real meter validation as needed.
- Firmware/model differences can affect blob format/indexing.

Impact:

- Meters may show silence or wrong source levels for AUX/FX on some consoles/firmware.

Suggested action:

- Add diagnostic mode/logging for blob length and sample values.
- Validate with CH/AUX/FX signal on physical X32/M32.

Status: open.

## About Version Is Hardcoded

Area: `src/features/about/screens/AboutScreen.tsx`.

Evidence:

- `APP_COMMIT_VERSION = 44` is hardcoded.
- Display version is derived from this constant.

Impact:

- Version can drift from release/build metadata.

Suggested action:

- Replace with generated build-time value or app metadata.

Status: open.

## Jest Does Not Discover TSX Tests

Area: `jest.config.js`.

Evidence:

- `testMatch: ['**/__tests__/**/*.test.ts']`.

Impact:

- Component tests written as `.test.tsx` would be ignored.

Suggested action:

- Change to include `.test.tsx` if UI tests are added.

Status: open.

## Theme Duplication

Area: `src/shared/theme` and `src/theme/tokens.*`.

Evidence:

- Both theme directories exist.
- Current code imports heavily from `src/shared/theme`.

Impact:

- Token drift risk.
- New contributors may pick inconsistent theme source.

Suggested action:

- Decide canonical theme location and document migration path.

Status: open.

