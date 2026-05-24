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
- `realtime-console-reactivity`: planned on 2026-05-24. Goal is to make BusMix visually react to X32/M32 console changes and linked-channel behavior with low latency, without regressing the existing app-to-console send path, meters, presets, pan independence, or BusGroups shared state. Created after external research on X32 `/xremote`, `/subscribe`, UDP packet loss, linked channel configuration, and meter subscription separation.
- `aux-fx-meter-stability`: planned on 2026-05-24. Goal is to keep CH 01..32 meters unchanged while fixing AUX 01..08 and FX Return 01..08 meter flicker. Current root-cause hypothesis is meter stream cross-contamination: `/meters/1` should update only CH 01..32, while AUX/FX should consume `/meters/13` only unless real-console evidence proves `/meters/3` is needed.

## Implemented Specs

- `fader-thumb-only-interaction`: implemented on 2026-05-24 and corrected after user validation. The first coordinate-based hit-test broke normal thumb dragging, so `VerticalFader` now attaches `PanResponder` handlers directly to the animated thumb. The central visual track has no gesture handlers, while dragging the thumb keeps the original volume change pipeline. Automated gates passed after the correction: `yarn tsc` and `yarn jest __tests__/features/busMix --runInBand`. Manual Demo validation remains recommended for physical touch ergonomics.
- `pan-modal-correct-scale`: implemented on 2026-05-24. `PanControlModal` now clamps local pan values, renders only one signed numeric value (`-100`, `0`, `+100`), and no longer shows the extra directional/raw dual readout. `src/shared/x32/pan.ts` now exposes `clampPanPercent` and `formatSignedPanValue`, with focused tests in `__tests__/shared/x32/pan.test.ts`. Automated gates passed: focused pan tests, BusMix tests, and `yarn tsc`.

## Latest Verification Notes

- `yarn jest __tests__/shared/x32/pan.test.ts --runInBand`: passed, 6 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed, 4 suites / 18 tests. Re-run after fader thumb-handler correction.
- `yarn tsc`: passed.
- `yarn lint`: blocked because `eslint` is not installed/resolvable in `node_modules/.bin` in the current workspace.
- Simulator/device Demo validation was not executed in this terminal pass.

## Planning Notes

- 2026-05-24: `realtime-console-reactivity` planned as a Complex feature because it touches OSC receive behavior, linked-channel state, optimistic local updates, real-console validation, and performance-sensitive UDP traffic. External research indicates `/xremote` is required but not sufficient by itself; linked visual consistency should combine console event listening with immediate local linked-peer reflection for level/on and pan exclusion.
- 2026-05-24: `aux-fx-meter-stability` planned as a targeted meter-data correction. External X32 OSC docs show `/meters/1` returns 32 input meters plus gate/dynamics data, while `/meters/13` returns 32 inputs + 8 aux returns + 8 stereo FX return values. The current code likely lets AUX/FX listeners consume `/meters/1`, causing wrong gate/dynamics values to alternate with correct AUX/FX values.
