# Local State - busMix

Last updated: 2026-05-31

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
- Presets modal uses a large centered `Dialog` occupying 95% width and 95% height to provide more room for preset list/actions.
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
- `remote-fader-sync-rollback-performance-restore`: implemented on 2026-05-25. Removed `remote-fader-subscription-sync` and `remote-fader-fluidity-performance` runtime effects because user validation showed the app and meters were more fluid before those receive-path changes. Preserved Local Network permission preflight, AUX/FX meter stability, local app-to-console fader sends, and unrelated UX fixes. Real-device UAT after rollback remains pending.
- `remote-fader-subscription-sync`: reverted/undone on 2026-05-25. Managed visible-fader `/subscribe` receive loops and their BusMix service/hook wiring were removed.
- `remote-fader-fluidity-performance`: reverted/undone on 2026-05-25. Coalescing, frame flush, fader subscription hysteresis, subscription time-factor tuning, and associated diagnostics were removed.
- `fader-knob-skeuomorphic-refresh`: implemented on 2026-05-25. BusMix `VerticalFader` now renders an off-white, rounded, physical skeuomorphic fader cap with recessed grooves, center calibration line, bevel/volume, and projected shadow. This was visual-only; thumb-only gesture behavior, fader math, meters, OSC, and remote-sync rollback work were preserved.
- `pan-modal-slider-consistency-performance`: implemented on 2026-05-25. Replaced the BusMix pan modal native slider with a deterministic local pan control because `@react-native-community/slider` is not a fully controlled component and continuous `onValueChange` sends made the control feel stiff. The modal now maps `-100/0/+100` directly to left/center/right, updates locally while dragging, and commits to `setPan` only on release or Center.
- `fader-meter-single-rail`: implemented on 2026-05-31. `VerticalFader` now accepts a composable passive rail, and `ChannelStrip` passes `ChannelVuMeter` or a placeholder into that rail so the live meter occupies the old central fader track position. The side meter column and separate center track are gone for BusMix strips. Follow-up density adjustment reduced BusMix channel strips from `86` to `71` px with matching FlatList item layout, targeting about 5.5 visible channels on wider portrait phones. Thumb-only gesture ownership, fader math, linked pressed feedback, meter subscription lifecycle, OSC behavior, AUX/FX meter isolation, and remote-fader rollback state were preserved. Manual portrait/landscape and gesture runtime validation remains pending.

## Implemented Specs

- `fader-thumb-only-interaction`: implemented on 2026-05-24 and corrected after user validation. The first coordinate-based hit-test broke normal thumb dragging, so `VerticalFader` now attaches `PanResponder` handlers directly to the animated thumb. The central visual track has no gesture handlers, while dragging the thumb keeps the original volume change pipeline. Automated gates passed after the correction: `yarn tsc` and `yarn jest __tests__/features/busMix --runInBand`. Manual Demo validation remains recommended for physical touch ergonomics.
- `pan-modal-correct-scale`: implemented on 2026-05-24. `PanControlModal` now clamps local pan values, renders only one signed numeric value (`-100`, `0`, `+100`), and no longer shows the extra directional/raw dual readout. `src/shared/x32/pan.ts` now exposes `clampPanPercent` and `formatSignedPanValue`, with focused tests in `__tests__/shared/x32/pan.test.ts`. Automated gates passed: focused pan tests, BusMix tests, and `yarn tsc`.
- `aux-fx-meter-stability`: implemented on 2026-05-24. Added pure meter stream routing helpers and updated `useMeterSubscription` so `/meters/1` only dispatches to CH 01..32 and `/meters/13` only dispatches to AUX/FX IDs 33..48. Added regression tests proving AUX/FX listeners do not consume `/meters/1` gate/dynamics data, plus boundary tests for CH and AUX/FX offsets. `/meters/3` remains a documented fallback only until real-console evidence proves it is needed.
- `realtime-console-reactivity`: implemented on 2026-05-24. Added pure linked-channel sync helpers and integrated them into `useBusMix` so local fader drag/commit and remote level/on events visually update linked CH peers while keeping wire sends directed to the touched channel only. Added `BusMixService.onPan()` and pan receive handling without linked mirroring. Added lightweight realtime subscription health refs exposed through `getRealtimeSubscriptionHealth()`. AUX/FX link maps remain CH-only until protocol behavior is verified; focused reconciliation fallback remains unimplemented unless real-console validation proves it is needed.
- `remote-fader-subscription-sync`: implemented on 2026-05-24 and reverted on 2026-05-25 due to real-device performance regression. Historical docs remain for traceability, but runtime behavior is no longer active.
- `remote-fader-fluidity-performance`: implemented on 2026-05-25 and reverted on 2026-05-25 due to continued app/meter fluidity regression. Historical docs remain for traceability, but runtime behavior is no longer active.
- `fader-knob-skeuomorphic-refresh`: implemented on 2026-05-25. Updated `VerticalFader` with a stable `36x52` centered cap using layered native views for matte off-white plastic, side occlusion, top/bottom light, four recessed grooves, and a continuous center calibration line. Added pressed shadow/elevation feedback without changing layout dimensions or gesture ownership.
- `pan-modal-slider-consistency-performance`: implemented on 2026-05-25. Added `panSlider` mapping utilities/tests and replaced `PanControlModal`'s native slider with a custom local pan control. The change fixes label/thumb inconsistency for hard-left pan and removes per-move OSC sends from modal dragging.
- `fader-meter-single-rail`: implemented on 2026-05-31. Added an optional custom rail slot to `VerticalFader`, moved `ChannelVuMeter` into that rail from `ChannelStrip`, and replaced no-meter sources with an inset placeholder rail. The fader cap remains the only drag target; the rail is passive. No hooks, services, meter decoder/routing utilities, shared OSC files, or BusMix list width constants were changed.
- `fader-meter-single-rail` density follow-up: implemented on 2026-05-31. Reduced `ChannelStrip` and `BusMixScreen.CHANNEL_STRIP_WIDTH` to `71`, giving an item length of `72` including the existing gap. Added one-line shrink protection to the BusMix dB value.

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
- `yarn jest __tests__/features/busMix/utils/remoteFaderCoalescing.test.ts __tests__/features/busMix/utils/faderSubscriptionScope.test.ts __tests__/features/busMix/utils/linkedChannelSync.test.ts --runInBand`: passed after remote fader fluidity implementation, 3 suites / 15 tests.
- `yarn jest __tests__/features/busMix/services/BusMixService.test.ts __tests__/shared/osc/X32Protocol.test.ts __tests__/features/busMix/hooks/useBusMixRemoteFaderSubscription.test.ts --runInBand`: passed after remote fader fluidity implementation, 3 suites / 8 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed after remote fader fluidity implementation, 10 suites / 44 tests.
- `yarn jest __tests__/features/busGroups --runInBand`: passed after remote fader fluidity implementation, 2 suites / 10 tests.
- `yarn jest __tests__/shared/osc --runInBand`: passed after remote fader fluidity implementation, 4 suites / 11 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed after remote fader sync rollback, 6 suites / 32 tests.
- `yarn jest __tests__/features/busGroups --runInBand`: passed after remote fader sync rollback, 2 suites / 10 tests.
- `yarn jest __tests__/shared/osc --runInBand`: passed after remote fader sync rollback, 4 suites / 8 tests.
- `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`: passed after remote fader sync rollback, 2 suites / 8 tests.
- `plutil -lint ios/Tacimix/Info.plist`: passed after remote fader sync rollback.
- `yarn tsc`: passed.
- `yarn tsc`: passed after fader knob skeuomorphic refresh.
- `yarn jest __tests__/features/busMix --runInBand`: passed after fader knob skeuomorphic refresh, 6 suites / 32 tests.
- `yarn jest __tests__/shared/x32/pan.test.ts __tests__/features/busMix/utils/panSlider.test.ts --runInBand`: passed after pan modal slider consistency fix, 2 suites / 11 tests.
- `yarn jest __tests__/features/busMix --runInBand`: passed after pan modal slider consistency fix, 7 suites / 37 tests.
- `yarn tsc`: passed after pan modal slider consistency fix.
- `yarn tsc`: passed after `fader-meter-single-rail`.
- `yarn jest __tests__/features/busMix --runInBand`: passed after `fader-meter-single-rail`, 7 suites / 37 tests.
- `yarn jest __tests__/features/busGroups --runInBand`: passed after `fader-meter-single-rail`, 2 suites / 10 tests.
- `git diff --check`: passed after `fader-meter-single-rail`.
- `yarn tsc`: passed after `fader-meter-single-rail` density follow-up.
- `yarn jest __tests__/features/busMix --runInBand`: passed after density follow-up, 7 suites / 37 tests.
- `yarn jest __tests__/features/busGroups --runInBand`: passed after density follow-up, 2 suites / 10 tests.
- `yarn jest --runInBand`: failed outside BusMix because 3 `NetworkScanner` tests timed out at 5000 ms; all BusMix, BusGroups, shared OSC, shared utils, and X32 suites in that full run passed.
- `yarn lint`: blocked because `eslint` is not installed/resolvable in `node_modules/.bin` in the current workspace.
- Simulator/device Demo validation was not executed in this terminal pass.

## Planning Notes

- 2026-05-24: `realtime-console-reactivity` planned as a Complex feature because it touches OSC receive behavior, linked-channel state, optimistic local updates, real-console validation, and performance-sensitive UDP traffic. External research indicates `/xremote` is required but not sufficient by itself; linked visual consistency should combine console event listening with immediate local linked-peer reflection for level/on and pan exclusion.
- 2026-05-24: `aux-fx-meter-stability` planned as a targeted meter-data correction. External X32 OSC docs show `/meters/1` returns 32 input meters plus gate/dynamics data, while `/meters/13` returns 32 inputs + 8 aux returns + 8 stereo FX return values. The current code likely lets AUX/FX listeners consume `/meters/1`, causing wrong gate/dynamics values to alternate with correct AUX/FX values.
- 2026-05-24: `remote-fader-subscription-sync` planned after user reported CH 17 fader edits from the X32 app do not mirror in Tacimix BusMix in real time. Research indicates current `OscClient.subscribe` is only a local callback registry, while X32 `/subscribe` can request repeated reports for specific values for about 10 seconds. First implementation step must prove whether the reproduction changes the BusMix send-level path (`/ch/17/mix/{bus}/level`) or the main channel fader path (`/ch/17/mix/fader`).
- 2026-05-24: `remote-fader-subscription-sync` implemented without the optional polling fallback. The code now subscribes only visible BusMix faders to exact same-BUS send-level paths and renews those subscriptions. Real-console UAT must still validate CH 17 latency and confirm the user's X32 app action path.
- 2026-05-25: `remote-fader-fluidity-performance` planned as a Complex receive-performance optimization. Current hypothesis is that `/subscribe` is correct but too eager: packet bursts flow directly into `reconcileRemoteFader` and `busMixChannelStore.updateChannels`, so Wi-Fi jitter or JS thread pressure can make the UI replay old values before settling. Planned solution is explicit receive backpressure: latest-value coalescing, duplicate/stale filtering, `requestAnimationFrame` flush, batched store updates, and conservative subscription timing.
- 2026-05-25: `remote-fader-fluidity-performance` implemented with a conservative receive backpressure strategy. Notable SPEC_DEVIATION: the BusMix fader `timeFactor = 20` was applied before a recorded numeric hardware baseline because the user supplied qualitative real-console evidence and the change reduces traffic rather than increasing it. T-001 and T-010 remain open for real-console measurement/UAT.
- 2026-05-25: `remote-fader-sync-rollback-performance-restore` planned after user reported an older version/build was smoother overall and had more fluid meters. Decision: remove the runtime effects of `remote-fader-subscription-sync` and `remote-fader-fluidity-performance`, restore the lightweight receive model, and preserve Local Network permission preflight plus AUX/FX meter stability. The two remote fader receive features are marked as rollback targets, not current desired behavior.
- 2026-05-25: `fader-knob-skeuomorphic-refresh` task/spec created for a visual-only BusMix fader cap redesign. Primary target is `VerticalFader.tsx`; implementation must keep the PanResponder on the cap only and avoid meter/OSC/runtime receive changes.
- 2026-05-25: `remote-fader-sync-rollback-performance-restore` implemented. BusMix now receives fader updates through lightweight exact-address `service.onLevel` listeners again; managed visible-fader X32 `/subscribe` and follow-up coalescing/hysteresis were removed. Local Network permission preflight was verified and preserved. AUX/FX meter runtime files were not touched.
- 2026-05-25: `fader-knob-skeuomorphic-refresh` implemented as a visual-only `VerticalFader` update. The fader cap now uses static layered React Native views for off-white skeuomorphic volume, four grooves, center calibration line, and pressed shadow feedback. Automated gates passed; manual simulator/device visual and touch validation remains pending.
- 2026-05-25: Follow-up for `fader-knob-skeuomorphic-refresh`: fader cap pressed state now uses opacity `0.6` while pressed/dragged and returns to normal on release. The same visual feedback is propagated to the linked channel peer using the existing BusMix channel link map; fader math and OSC behavior were not changed.
- 2026-05-25: `pan-modal-slider-consistency-performance` planned and implemented after user reported hard-left console pan showing `-100` while the modal thumb looked centered, plus stiff/unstable drag behavior. External docs confirmed `@react-native-community/slider` is not a controlled component and calls `onValueChange` continuously while dragging. Implementation uses a deterministic local control and commits only on release/Center; manual real-console validation remains pending.
- 2026-05-25: Follow-up fix for `pan-modal-slider-consistency-performance` after user reported the custom pan slider jumped through multiple positions while dragging. Root cause was move-time `nativeEvent.locationX` over nested slider layers. The modal now uses initial value + `gestureState.dx` against measured width and marks decorative layers `pointerEvents="none"`. Automated gates passed again.
- 2026-05-31: `fader-meter-single-rail` planned from local docs and code analysis. Current code renders `ChannelVuMeter` beside `VerticalFader`, while `VerticalFader` renders its own central track. Planned path is to make the `VerticalFader` rail composable, render `ChannelVuMeter` or a placeholder in the old track position, keep the thumb `PanResponder` on the cap only, and verify portrait/landscape alignment plus fader/meter non-regression.
- 2026-05-31: `fader-meter-single-rail` implemented as a BusMix visual/composition refactor. `VerticalFader` owns the fader math and thumb gesture as before, but its central rail can now be supplied by the caller. `ChannelStrip` supplies the live `ChannelVuMeter` or placeholder as that rail, removing the separate side meter and old center track for BusMix. Automated gates passed; manual Demo/device visual and gesture validation remains pending.
- 2026-05-31: Follow-up density adjustment for `fader-meter-single-rail`: BusMix channel strips were reduced from `86` to `71` px and the FlatList item length now matches the new width plus gap. This targets about 5.5 visible channels on wider portrait phones without changing fader/meter runtime behavior. The dB label now stays on one line with font shrink protection.
- 2026-05-31: BusMix presets modal enlarged to occupy 95% width and 95% height. Removed the old 520 px width cap and 320 px list height cap so the preset list can use the available modal space. Automated BusMix tests and TypeScript passed; manual device visual validation remains pending.
