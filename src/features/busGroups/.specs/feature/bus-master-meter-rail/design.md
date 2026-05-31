# Design - BusGroups Bus Master Meter Rail

Last updated: 2026-05-31

## Overview

The implementation should add a passive live meter overlay to the existing Bus Master fader rail rather than replacing the fader component or changing the BusGroups layout.

Target structure:

```txt
BusGroupsScreen
  -> useBusGroups(consoleIp, busNumber)
       -> masterMeterDbfs
       -> master fader/mute state and callbacks
  -> MasterStrip
       -> GroupStrip isMaster
            -> VerticalGroupFader
                 -> current master track background
                 -> passive bus master meter fill inside that track
                 -> existing dB scale
                 -> existing animated thumb
```

The Bus Master meter should be treated as read-only telemetry. It must not influence fader value, mute state, MCA computed values, persistence, or BusMix channel state.

## Existing Patterns Reused

- Reuse `X32Protocol` for all X32 path helpers.
- Reuse the corrected meter request pattern already documented for BusMix: send `/meters` with the meter id as a string argument and renew periodically.
- Reuse `SharedOscClient` through `X32BusGroupsService` rather than opening a second independent UDP client for the same screen.
- Reuse existing X32 meter blob parsing assumptions from `src/features/busMix/utils/meterDecoder.ts`: 4-byte little-endian float count header followed by little-endian float values.
- Reuse existing meter dB conversion and clamp ranges so BusGroups and BusMix meters feel consistent.
- Reuse `VerticalGroupFader` as the owner of fader travel, thumb animation, hit testing, and dB scale placement.
- Reuse mock/demo provider subscription style so Demo Console remains useful for UI validation.

## Protocol Design

Primary stream:

```txt
request:  /meters ,s /meters/2
listen:   /meters/2
decode:   [int32 LE count][float32 LE x count]
index:    busId - 1
range:    busId 1..16 maps to float indexes 0..15
```

Why `/meters/2`:

- It is the documented Mix Bus meters page stream.
- Its first values are the 16 bus master level meters, which exactly match this feature.
- It does not require surface/bank parameters.

Why not `/meters/5` first:

- `/meters/5` represents console surface VU meters.
- It requires channel/group meter parameters and is tied to surface group/bank semantics.
- It may be useful as a diagnostic fallback, but using it first would couple Tacimix to the console surface view rather than the selected BUS master.

Renewal:

- Use the existing BusMix cadence as the baseline: renew every `8000ms`.
- Keep the subscription active only while BusGroups is mounted, connected, and not loading.
- Cleanup interval and OSC listener when the screen unmounts or the service disconnects.

Failure behavior:

- Malformed blobs, missing blobs, out-of-range bus ids, and missing client state decode to `METER_MIN_DBFS`.
- Meter failures should not set the BusGroups screen error state unless they reveal a broader connection failure already handled elsewhere.

## Components And Modules Touched

Runtime:

- `src/shared/osc/X32Protocol.ts`
  - Add `getMeters2Path(): string`.
- `src/features/busMix/utils/meterDecoder.ts`
  - Add a reusable helper or a specific `decodeMeter2BlobForBusMaster(blob, busId)` function.
  - Keep existing `/meters/1` and `/meters/13` exports behavior-identical.
- `src/features/busGroups/services/X32BusGroupsService.ts`
  - Add `subscribeToBusMasterMeter(busId, listener)`.
  - Real console: subscribe to `/meters/2`, request `/meters` with `/meters/2`, renew, decode, cleanup.
  - Mock console: delegate to provider support.
- `src/features/busGroups/hooks/useBusGroups.ts`
  - Add `masterMeterDbfs` state/ref initialized to silent floor.
  - Subscribe after BusGroups is connected and loading is complete.
  - Return `masterMeterDbfs` to the screen.
- `src/features/busGroups/screens/BusGroupsScreen.tsx`
  - Pass `masterMeterDbfs` to `MasterStrip`.
- `src/features/busGroups/components/MasterStrip.tsx`
  - Accept and forward `meterDbfs`.
- `src/features/busGroups/components/GroupStrip.tsx`
  - Accept optional `meterDbfs`.
  - Forward it only to the fader component; MCA callers can omit it.
- `src/features/busGroups/components/VerticalGroupFader.tsx`
  - Render the meter fill inside the existing master track when `isMaster` and `meterDbfs` is present.
  - Keep the track geometry and fader gestures unchanged.
- `src/shared/mixer/MixerControlProvider.ts`
  - Add `subscribeBusMasterMeter(busId, listener)`.
- `src/shared/mixer/mock/mockMixerProvider.ts`
- `src/shared/mixer/mock/demoMixerProvider.ts`
  - Add mock/demo Bus Master meter simulation.

Tests:

- `__tests__/shared/osc/X32Protocol.test.ts`
- `__tests__/features/busMix/utils/meterDecoder.test.ts`
- `__tests__/features/busGroups/services/X32BusGroupsService.test.ts` if needed, or add focused coverage where service tests already live.
- `__tests__/features/busGroups/hooks/useBusGroups.test.ts`
- Existing BusMix meter tests must remain green.

Avoid touching unless forced by implementation:

- `src/features/busMix/hooks/useMeterSubscription.ts`
- `src/features/busMix/utils/meterStreamRouting.ts`
- `src/features/busMix/components/ChannelStrip.tsx`
- `src/features/busMix/components/VerticalFader.tsx`
- `src/features/busMix/screens/BusMixScreen.tsx`

## Data Flow

```txt
X32/M32 console
  -> /meters/2 OSC blob
  -> X32BusGroupsService.subscribeToBusMasterMeter
  -> decodeMeter2BlobForBusMaster(blob, busId)
  -> useBusGroups masterMeterDbfs
  -> BusGroupsScreen
  -> MasterStrip
  -> GroupStrip
  -> VerticalGroupFader master track fill
```

The meter value should be a single dBFS number. The UI does not need gate/dynamics gain reduction for this feature because the requested visual is the audio level meter in the existing fader rail.

## UI Design

The existing `VerticalGroupFader` master track style is the geometry source:

- `styles.masterTrack.width` remains `5`.
- The track stays between the existing `TRACK_EDGE_PADDING` top and bottom offsets.
- The container height stays driven by the measured fader slot height.
- The dB scale stays positioned relative to the same travel range.
- The fader thumb stays absolutely positioned with the same left/right offsets.

Meter fill behavior:

- Render inside the track with `pointerEvents="none"`.
- Use absolute bottom fill layers so inactive track background remains visible.
- Use BusMix meter color tokens and thresholds where practical:
  - green for nominal range,
  - yellow for hot range,
  - red for clip-danger range.
- Keep the fill clipped to the existing rounded track shape.
- Do not increase track width, fader slot width, strip width, or fader thumb width.

If the 5 px rail makes segmented blocks too noisy, use continuous green/yellow/red fills based on the same thresholds rather than the BusMix segmented component. This preserves the "same meter logic" without changing the Bus Master geometry.

## State And Persistence

- `masterMeterDbfs` is transient UI telemetry.
- Initial value: `METER_MIN_DBFS`.
- No SecureStore persistence.
- No BusMix channel store writes.
- No effect on MCA fader calculations.
- Use a ref to suppress redundant state updates when decoded value changes too little to affect the visual fill.

## Error Handling

- Decoder returns silent floor for:
  - missing blob,
  - count header only,
  - non-float-aligned payload,
  - `busId` outside `1..16`,
  - index outside the float count,
  - non-finite or non-positive linear values.
- Subscription setup failures should be swallowed like current meter setup failures, because the main BusGroups connection flow already owns user-visible errors.
- Cleanup must be idempotent.

## Testing Strategy

Automated gates:

- `yarn tsc`
- `yarn jest __tests__/features/busGroups --runInBand`
- `yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts __tests__/features/busMix/utils/meterStreamRouting.test.ts --runInBand`
- `yarn jest __tests__/features/busMix/hooks/useMeterSubscription.test.ts --runInBand`
- `yarn jest __tests__/shared/osc/X32Protocol.test.ts --runInBand`
- `git diff --check`

Focused automated coverage:

- `/meters/2` path helper.
- BUS `1`, `8`, `9`, `16` indexes decode from float positions `0`, `7`, `8`, `15`.
- malformed `/meters/2` blobs decode to silence.
- linear headroom values use the existing linear-to-dB conversion.
- service requests `/meters` with `['/meters/2']`, subscribes to `/meters/2`, and cleans up timer/listener.
- `useBusGroups` returns and updates `masterMeterDbfs` without mutating MCA state.
- mock/demo provider exposes Bus Master meter subscription.

Manual/UAT:

- Demo Console portrait and landscape visual check.
- Real X32/M32 BUS `1`, `8`, `9`, `16` signal/no-signal check.
- Confirm fader, mute, MCA strip behavior, BusMix navigation, and BusMix meters after visiting BusGroups.

## Risks And Trade-Offs

- The X32 OSC meter mapping is based on the de facto unofficial protocol docs, not a current official Behringer OSC PDF from the vendor site. Mitigation: document the source, keep the implementation isolated, and require real-console UAT.
- `/meters/2` may include dynamics gain reduction after the first 25 level floats. Mitigation: decode only indexes `0..15`.
- Bus master meter on stereo-linked buses may be per-bus rather than combined pair. Mitigation: show the selected BUS only and validate linked pairs manually before adding pair-aware behavior.
- A 5 px meter rail is visually tight. Mitigation: keep continuous fill as an allowed implementation detail while preserving BusMix meter thresholds and colors.
- Adding a provider interface method touches shared mock providers. Mitigation: update both mock providers in the same task and run BusMix and BusGroups tests.
