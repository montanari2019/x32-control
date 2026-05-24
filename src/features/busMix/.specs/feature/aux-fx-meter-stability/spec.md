# Spec - BusMix AUX/FX Meter Stability

Last updated: 2026-05-24

## Context

BusMix currently shows the meters for standard X32 input channels CH 01..32 correctly. This behavior is the desired baseline and must not regress.

The problem is specific to AUX 01..08 and FX Return 01..08 in BusMix:

- their meters can flicker or jump erratically;
- visually they do not behave like the stable CH 01..32 meters;
- the user expects AUX and FX Return meters to follow the same visual behavior and stability pattern as the standard 32 channel meters.

This must be solved without changing the look, feel, scale, or behavior of the CH 01..32 meters, which are currently considered correct.

## Source Of Truth

Implementation must follow:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/tlc-spec-driven/references/implement.md`
- `docs/skills/custom-hooks/SKILL.md`
- `docs/skills/components-and-shared-ui/SKILL.md`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`

## External Research Summary

Research performed on 2026-05-24:

- The unofficial X32/M32 OSC protocol documents `/meters/1` as the METERS/channel page: 32 input channels, 32 gate gain reductions, and 32 dynamics gain reductions, returning 96 float values.
  Source: https://x32ram.com/wp-content/uploads/download-files/X32-OSC.pdf
- The same protocol documents `/meters/13` as the METERS page containing 32 input channels, 8 aux returns, and 4x2 stereo FX returns, returning 48 float values.
  Source: https://x32ram.com/wp-content/uploads/download-files/X32-OSC.pdf
- The protocol also documents `/meters/3` as the METERS/aux/fx page: 6 aux sends, 8 aux returns, and 4x2 stereo FX returns, returning 22 float values.
  Source: https://tostibroeders.nl/wp-content/uploads/2020/02/X32-OSC.pdf
- The meter request flow is special OSC blob data, not ordinary OSC scalar values. Public examples describe the blob as a byte count / native-float payload and warn that `/meters` data differs from typical X32/M32 replies for performance reasons.
  Source: https://stackoverflow.com/questions/79307380/decoding-x32-behringer-mixer-response
- Public troubleshooting around X32 meter access confirms that `/xremote` events are not meter data; meter streams require `/meters` or subscription/renew behavior and must be handled separately from control updates.
  Source: https://stackoverflow.com/questions/79628962/how-to-access-meters-on-behringer-x32

## Current Code Observations

- `src/features/busMix/hooks/useMeterSubscription.ts` listens to:
  - `/meters/1` for CH 01..32;
  - `/meters/13` for AUX/FX Return channel IDs 33..48.
- The `/meters/13` handler already filters channel IDs:

```ts
if (channelId < 33 || channelId > 48) return;
```

- The `/meters/1` handler currently iterates every registered listener without restricting to CH 01..32.
- Because AUX/FX listeners are stored in the same `listenersRef`, AUX/FX listeners can receive `/meters/1` updates.
- For channel ID 33, `decodeMeter1BlobForChannel(blob, 33)` reads index 32 of `/meters/1`.
- In `/meters/1`, index 32 is not AUX 01; it belongs to the gate/dynamics region of the CH meter page. This can cause wrong values to alternate with the correct `/meters/13` values, producing flicker.
- `src/features/busMix/utils/meterDecoder.ts` currently has identical index math for `decodeMeter1BlobForChannel` and `decodeMeter13BlobForChannel`, but their blob semantics are different.
- Existing tests already verify CH 01..32 decoding and current `/meters/13` indexing for AUX/FX, but they do not test cross-stream dispatch isolation.

## Requirements

REQ-001: CH 01..32 meter behavior must remain visually unchanged.

REQ-002: AUX 01..08 meter behavior must become stable and visually consistent with CH 01..32.

REQ-003: FX Return 01..08 meter behavior must become stable and visually consistent with CH 01..32.

REQ-004: `/meters/1` responses must only update CH 01..32 listeners.

REQ-005: AUX/FX listeners must not consume `/meters/1` values.

REQ-006: AUX/FX meter values must come only from the correct X32 meter source selected for AUX/FX, initially `/meters/13` unless implementation research proves `/meters/3` is better for BusMix.

REQ-007: The implementation must preserve the existing meter visual component, scale, colors, and segment behavior unless a fix is strictly necessary.

REQ-008: The implementation must preserve the existing meter request/renew strategy and not flood the X32 with unnecessary meter traffic.

REQ-009: The implementation must not change faders, pan, mute/on, presets, BusGroups, OSC send behavior, or realtime reactivity work.

REQ-010: The fix must be covered by automated tests that prove CH and AUX/FX streams are isolated.

REQ-011: The decoder must explicitly document and test the index map used for AUX/FX so future changes do not reintroduce flicker.

REQ-012: Real-console UAT must validate AUX and FX Return meters when hardware is available.

## Acceptance Criteria

- CH 01..32 meters still behave exactly as before.
- A `/meters/1` blob does not notify or update AUX/FX listener callbacks.
- A `/meters/13` blob does not notify or update CH 01..32 listener callbacks.
- AUX 01 maps to the expected AUX position in the selected AUX/FX meter blob.
- AUX 08 maps to the expected AUX position.
- FX Return 01 maps to the expected FX Return position.
- FX Return 08 maps to the expected FX Return position.
- AUX/FX meters no longer alternate between correct values and unrelated gate/dynamics values.
- Existing `ChannelVuMeter` rendering stays unchanged unless tests prove the UI layer is responsible.
- `yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts --runInBand` passes.
- New focused tests for meter dispatch isolation pass.
- `yarn jest __tests__/features/busMix --runInBand` passes.
- `yarn tsc` passes.

## Out Of Scope

- Changing CH 01..32 meter behavior.
- Redesigning meter visuals.
- Changing meter colors, scale, or segment count.
- Changing fader/mute/pan/preset behavior.
- Merging meter streams into realtime console reactivity.
- Adding aggressive polling.
- Supporting every X32 meter page beyond what BusMix needs.
- Declaring real-console validation complete without physical hardware.

## Root Cause Hypothesis

The most likely root cause is stream cross-contamination:

```txt
/meters/1 -> intended for CH 01..32 only
current code -> dispatches /meters/1 to every registered listener
AUX 01 listener channelId=33 -> reads /meters/1 index 32
index 32 in /meters/1 -> gate/dynamics area, not AUX 01
/meters/13 -> later sends correct AUX/FX value
UI alternates wrong/correct values -> visible flicker
```

The first implementation task should confirm this with tests before changing runtime behavior.

