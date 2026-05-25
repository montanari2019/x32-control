# Local State - busMix

Last updated: 2026-05-24

## Scope

Feature: `busMix`

Location:

```txt
src/features/busMix/
```

Purpose:

- Provide detailed per-source monitor send control for a selected BUS.
- Control CH/AUX/FX send level, mute/on, pan, presets, and meters.

## Current Files

```txt
components/BusHeader.tsx
components/BusMixPresetRestoreOverlay.tsx
components/BusMixPresetsModal.tsx
components/ChannelBadge.tsx
components/ChannelFader.tsx
components/ChannelNamePlate.tsx
components/ChannelStrip.tsx
components/ChannelVuMeter.tsx
components/DbScale.tsx
components/MeterSegments.tsx
components/MuteButton.tsx
components/PanControlModal.tsx
components/PersonalMixHeader.tsx
components/SignalMeter.tsx
components/VerticalFader.tsx
hooks/useBusMix.ts
hooks/useMeterSubscription.ts
routes/busMix.routes.ts
screens/BusMixScreen.tsx
services/BusMixChannelStore.ts
services/BusMixPresetService.ts
services/BusMixService.ts
services/ChannelStructureCache.ts
types/BusMixPreset.ts
types/Channel.ts
utils/meterDecoder.ts
utils/peakHold.ts
```

## Current Behavior

- Receives selected `consoleIp`, `busNumber`, `busName`, and optional `linkedBusNumber`.
- Loads 48 source strips:
  - CH 01..32;
  - AUX 01..08;
  - FX 01..08.
- Loads name, color, level, mute/on, and pan.
- Uses `/node` bulk path when possible.
- Falls back to per-path requests.
- Caches channel structure by console.
- Uses shared channel store for BusGroups integration.
- Uses optimistic UI for fader changes.
- Sends throttled fader changes during drag.
- Sends final level immediately on release.
- Reconciles remote fader updates while protecting recent local edits.
- Periodically syncs remote faders in background.
- Respects channel link map for mute/on.
- Opens pan modal from channel badge.
- Pan modal displays one signed numeric value from `-100` to `+100`.
- Opens presets modal from header action.
- Shows restore overlay during preset restore.
- Registers meter listeners only for visible items.
- Horizontal list disables scroll while fader interaction is active.
- Fader interaction starts only from the thumb; the central fader track is visual-only.

## Integration Points

- `BusMixService` owns OSC access for CH/AUX/FX.
- `BusMixChannelStore` shares channel snapshots.
- `BusMixPresetService` persists presets.
- `ChannelStructureCache` speeds repeated loading.
- `useMeterSubscription` streams meters over shared OSC client.
- `meterDecoder` converts meter blobs to dBFS.
- `McaChannelFaderService` in BusGroups reuses BusMixService behavior.

## Current Decisions

- 48 sources are modeled as one `Channel` list with `kind` and `sourceNumber`.
- Source IDs are absolute:
  - CH: `1..32`;
  - AUX: `33..40`;
  - FX: `41..48`.
- Presets save current local fader raw value and mute.
- Presets are limited to 10 per console/BUS.
- Restore uses the normal live send path rather than a separate bulk transport.
- Meter streams renew every 8000 ms.
- Meter scale is clamped from `-60 dBFS` to `+10 dBFS`.

## Known Concerns

- Real meter mapping for AUX/FX requires physical console validation.
- Restore of many channels should be validated for timing and UX on real hardware.
- Presets are local only; no cloud/export/import behavior exists.
- Background sync silently ignores errors; this is intentional but should be revisited if users report stale values.
- Native manual validation is still needed for the latest fader-thumb-only and pan-modal touch behavior.

## Existing Tests

```txt
__tests__/features/busMix/hooks/useMeterSubscription.test.ts
__tests__/features/busMix/services/BusMixChannelStore.test.ts
__tests__/features/busMix/services/BusMixPresetService.test.ts
__tests__/features/busMix/utils/meterDecoder.test.ts
__tests__/shared/x32/pan.test.ts
```

## Future Spec Placement

Feature specs should be created under:

```txt
src/features/busMix/.specs/feature/[feature-name]/
```

This directory is intentionally empty for now except for scaffolding.

## Suggested Future Specs

- `manual-preset-export-import`.
- `aux-fx-meter-validation`.
- `preset-restore-uat`.
- `channel-link-mute-behavior`.
- `busmix-performance-virtualization`.

## Active Planned Specs

- `pan-modal-correct-scale`: implementation completed on 2026-05-24; manual Demo validation remains open for native slider/thumb confirmation.
- `realtime-console-reactivity`: implemented on 2026-05-24 for linked CH level/on reflection, pan receive, and lightweight receive health. Real-console UAT remains open. Goal is to make BusMix visually react to X32/M32 console changes and linked-channel behavior with low latency, without regressing the existing app-to-console send path, meters, presets, pan independence, or BusGroups shared state.
- `aux-fx-meter-stability`: implemented on 2026-05-24 for automated/runtime stream isolation; real-console UAT remains open. Goal is to keep CH 01..32 meters unchanged while fixing AUX 01..08 and FX Return 01..08 meter flicker. Runtime now isolates `/meters/1` to CH 01..32 and `/meters/13` to AUX/FX IDs 33..48.
- `remote-fader-subscription-sync`: implemented on 2026-05-24 for the code path; real-console UAT remains open. Visible BusMix faders now request scoped X32 `/subscribe` updates for same-BUS source send-level paths through `OscClient.subscribeScalarValue`, while preserving current app-to-console sends and meter subscriptions. Key distinction remains: `/ch/17/mix/fader` is the main channel fader and is not treated as the BusMix send-level path `/ch/17/mix/{bus}/level`.

## Implemented Specs

- `fader-thumb-only-interaction`: implemented on 2026-05-24 and corrected after user validation. The first coordinate-based hit-test broke normal thumb dragging, so `VerticalFader` now attaches `PanResponder` handlers directly to the animated thumb. The central visual track has no gesture handlers, while dragging the thumb keeps the original volume change pipeline. Automated gates passed after the correction: `yarn tsc` and `yarn jest __tests__/features/busMix --runInBand`. Manual Demo validation remains recommended for physical touch ergonomics.
- `pan-modal-correct-scale`: implemented on 2026-05-24. `PanControlModal` now clamps local pan values, renders only one signed numeric value (`-100`, `0`, `+100`), and no longer shows the extra directional/raw dual readout. `src/shared/x32/pan.ts` now exposes `clampPanPercent` and `formatSignedPanValue`, with focused tests in `__tests__/shared/x32/pan.test.ts`. Automated gates passed: focused pan tests, BusMix tests, and `yarn tsc`.
- `aux-fx-meter-stability`: implemented on 2026-05-24. Added pure meter stream routing helpers and updated `useMeterSubscription` so `/meters/1` only dispatches to CH 01..32 and `/meters/13` only dispatches to AUX/FX IDs 33..48. Added regression tests proving AUX/FX listeners do not consume `/meters/1` gate/dynamics data, plus boundary tests for CH and AUX/FX offsets. `/meters/3` remains a documented fallback only until real-console evidence proves it is needed.
- `realtime-console-reactivity`: implemented on 2026-05-24. Added pure linked-channel sync helpers and integrated them into `useBusMix` so local fader drag/commit and remote level/on events visually update linked CH peers while keeping wire sends directed to the touched channel only. Added `BusMixService.onPan()` and pan receive handling without linked mirroring. Added lightweight realtime subscription health refs exposed through `getRealtimeSubscriptionHealth()`. AUX/FX link maps remain CH-only until protocol behavior is verified; focused reconciliation fallback remains unimplemented unless real-console validation proves it is needed.
- `remote-fader-subscription-sync`: implemented on 2026-05-24. Added X32 scalar subscription helpers, managed `OscClient.subscribeScalarValue`, BusMix source send-level subscriptions, visible-fader subscription hook, BusMixScreen visibility wiring, and fader subscription health diagnostics. The implementation does not modify the current app-to-console fader send path and does not touch meter runtime files. T001 path proof and T010 UAT remain pending because they require operating the real X32 app/console.

## Latest Verification Notes

- `yarn jest __tests__/shared/x32/pan.test.ts --runInBand`: passed, 6 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed, 4 suites / 18 tests. Re-run after fader thumb-handler correction.
- `yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts __tests__/features/busMix/utils/meterStreamRouting.test.ts --runInBand`: passed, 2 suites / 16 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed after AUX/FX meter isolation, 5 suites / 24 tests.
- `yarn jest __tests__/features/busMix/utils/linkedChannelSync.test.ts --runInBand`: passed, 8 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed after realtime console reactivity implementation, 6 suites / 32 tests.
- `yarn jest __tests__/features/busGroups --runInBand`: passed, 2 suites / 10 tests.
- `yarn jest __tests__/shared/osc/OscClient.test.ts __tests__/shared/osc/X32Protocol.test.ts __tests__/features/busMix/services/BusMixService.test.ts __tests__/features/busMix/hooks/useBusMixRemoteFaderSubscription.test.ts --runInBand`: passed, 4 suites / 11 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed after remote fader subscription sync implementation, 8 suites / 37 tests.
- `yarn jest __tests__/features/busGroups --runInBand`: passed after remote fader subscription sync implementation, 2 suites / 10 tests.
- `yarn tsc`: passed.
- `yarn jest --runInBand`: failed outside BusMix because 3 `NetworkScanner` tests timed out at 5000 ms; all BusMix, BusGroups, shared OSC, shared utils, and X32 suites in that full run passed.
- `yarn lint`: blocked because `eslint` is not installed/resolvable in `node_modules/.bin` in the current workspace.
- Simulator/device Demo validation was not executed in this terminal pass.

## Planning Notes

- 2026-05-24: `realtime-console-reactivity` planned as a Complex feature because it touches OSC receive behavior, linked-channel state, optimistic local updates, real-console validation, and performance-sensitive UDP traffic. External research indicates `/xremote` is required but not sufficient by itself; linked visual consistency should combine console event listening with immediate local linked-peer reflection for level/on and pan exclusion.
- 2026-05-24: `aux-fx-meter-stability` planned as a targeted meter-data correction. External X32 OSC docs show `/meters/1` returns 32 input meters plus gate/dynamics data, while `/meters/13` returns 32 inputs + 8 aux returns + 8 stereo FX return values. The current code likely lets AUX/FX listeners consume `/meters/1`, causing wrong gate/dynamics values to alternate with correct AUX/FX values.
- 2026-05-24: `remote-fader-subscription-sync` planned after user reported CH 17 fader edits from the X32 app do not mirror in Tacimix BusMix in real time. Research indicates current `OscClient.subscribe` is only a local callback registry, while X32 `/subscribe` can request repeated reports for specific values for about 10 seconds. First implementation step must prove whether the reproduction changes the BusMix send-level path (`/ch/17/mix/{bus}/level`) or the main channel fader path (`/ch/17/mix/fader`).
- 2026-05-24: `remote-fader-subscription-sync` implemented without the optional polling fallback. The code now subscribes only visible BusMix faders to exact same-BUS send-level paths and renews those subscriptions. Real-console UAT must still validate CH 17 latency and confirm the user's X32 app action path.
