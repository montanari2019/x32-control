# Spec - BusGroups Master Fader Drag Stability

Date: 2026-10-15
Status: planned (analysis only, no code changed)
Scope: `src/features/busGroups` (Bus Master fader), shared fader helpers only if proven necessary

## Problem

Reported on the BusGroups ("Personal Mix Grupos") screen, Bus Master fader:

- iOS: the master fader is too sensitive to touch and to scroll. It is easy to
  move it by accident and hard to place a precise value.
- Android (Redmi Note 9S, physical, connected to a real X32): while dragging the
  master fader it "stutters", as if the app keeps trying to guess where the
  value should land. The whole fader shakes: the central thumb and the dB ruler
  (track/scale) visibly jitter while the user adjusts the volume.

## Observed Facts (from code, 2026-10-15)

- `VerticalGroupFader` (BusGroups) is a custom `PanResponder`. Its
  `onStartShouldSetPanResponder` / `onMoveShouldSetPanResponder` gate on
  `isInsideInteractiveArea(nativeEvent.locationX/locationY)`. `locationX/Y` are
  relative to the touched child view (thumb layers, track, dB scale), not to the
  fader container, so the hit test compares coordinates from different spaces.
  BusMix `VerticalFader` uses `() => true` and does not have this gate.
- `setMasterFader` (`useBusGroups.ts`) runs `setState` for the whole hook and
  sends one OSC UDP message per move event, with no throttle or coalescing.
  MCA faders have a 250 ms local protection window against remote overwrite;
  the master fader has none.
- `useOscSubscription` subscribes the master fader path and writes remote values
  straight into `masterFaderRaw`, with no protection while the user is dragging.
- Master meter (`/meters/2`) updates `masterMeterDbfs` in the same `useBusGroups`
  state (threshold 0.35 dB), so each meter frame re-renders `BusGroupsScreen`
  and `MasterStrip` while the finger is on the fader. The meter fill is drawn
  with percentage `height`/`bottom` inside the track (layout work on the JS/UI
  thread), while the thumb moves with `translateY`.
- `BusGroupsScreen` toggles `ScrollView.scrollEnabled` through
  `setIsFaderInteractionActive` on grant/release, which re-renders the screen
  at gesture start/end.
- Master `dragSensitivity` is `undefined` (=1) in portrait; only landscape uses
  0.45.

## Hypotheses (NOT proven; T-001 must prove or reject)

- H1: Meter-driven re-renders (about 20 Hz) plus per-move `setState` saturate
  the JS thread on Android, so thumb, meter fill and scale update out of phase
  and look like shaking.
- H2: A remote echo or late fader value (`handleRemoteMasterFader`) arrives
  during/after the drag with an older value and fights the local value
  (no protection window for the master).
- H3: Un-throttled OSC sends (one per move event) flood the UDP socket and the
  console, which then answers/echoes at a different rate than the touch rate.
- H4: `locationX/Y` hit test mixes coordinate spaces; on Android the pre-grant
  `onMoveShouldSet` check is flaky and the responder may be granted late or
  re-requested, causing a late start and jumps.
- H5 (iOS): the vertical-only fader captures any movement in the touch area
  (`onMoveShouldSet` is not directional), so a horizontal scroll swipe that
  starts over the master strip moves the fader; portrait 1:1 sensitivity makes
  fine adjustment hard.

## Requirements

REQ-001: Smooth Android drag
- Dragging the Bus Master fader on a physical Android device against a real
  console must move thumb, scale and meter without visible jitter.

REQ-002: No fight with remote values
- While the user is dragging the master fader, remote/echoed fader values must
  not move the thumb. After release, the final local value must win for a short
  protection window and then the console value is accepted.

REQ-003: Bounded OSC send rate
- The master fader must send a bounded rate of OSC messages while dragging and
  always send the final value on release.

REQ-004: Isolated re-render cost
- Meter updates and fader moves must not re-render unrelated strips or the whole
  screen on every frame.

REQ-005: iOS touch/scroll safety
- On iOS, horizontal scroll over the master strip must scroll the strip, and an
  accidental touch must not change the value. Fine adjustment must be possible.

REQ-006: Non-regression
- MCA faders, BusMix faders, meter behavior, mute, mca proportional logic, demo
  console and landscape layout stay unchanged unless a task says otherwise.

REQ-007: Evidence first
- No behavior change is merged before the cause is proven with captured evidence
  (profiler or timing logs, logcat) on the physical Android device.

## Acceptance Criteria

- On the Redmi Note 9S against the real X32, a slow and a fast drag of the
  master fader show no jitter of thumb, ruler or meter.
- Release value equals last touch value; console ends on that value.
- Meter keeps updating during idle; it does not freeze after drag.
- iOS: a horizontal swipe starting on the master strip scrolls; vertical drag on
  the thumb/track moves the fader with controllable precision.
- `yarn tsc`, BusGroups tests, BusMix tests and shared OSC tests pass.

## Out Of Scope

- Redesigning the fader visuals or thumb (already covered by
  `fader-thumb-busmix-style`).
- Changing the meter protocol or `/meters/2` mapping.
- Rewriting the UDP stack.
- MCA proportional algorithm.
