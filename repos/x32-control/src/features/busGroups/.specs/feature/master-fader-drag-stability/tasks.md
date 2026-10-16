# Tasks - BusGroups Master Fader Drag Stability

Date: 2026-10-15
Status: planned; nothing implemented
Device available: Redmi Note 9S (adb id 7b877dc7), real X32 on same network.

## Task List

- [ ] T-001: Prove the cause of the Android jitter on device
  Reqs: REQ-001, REQ-007
  What: Reproduce on the Redmi + real X32 and measure which hypothesis (H1-H5)
  holds. Use temporary, removable instrumentation: count renders of
  `BusGroupsScreen`/`MasterStrip` per second, timestamp each `onFaderChange`,
  each OSC send, each remote `handleRemoteMasterFader` and each meter update
  during a 5 s drag. Run twice: meter active and meter forced off.
  Where: `VerticalGroupFader.tsx`, `useBusGroups.ts`, `useOscSubscription.ts`,
  `adb logcat` / Metro logs.
  Depends on: none
  Reuses: `UdpDiagnostics` style logging, existing demo console for comparison.
  Done when: a short table exists (rates per source, remote values received
  during drag, jitter on/off with meter) and each hypothesis is marked
  confirmed or rejected in `context.md`.
  Tests: manual on device.
  Gate: no behavior change before this is done; remove temporary logs after.

- [ ] T-002: Prove the iOS over-sensitivity cause
  Reqs: REQ-005, REQ-007
  What: On an iPhone (or simulator with touch simulation), check whether a
  horizontal swipe starting over the master strip moves the fader, and whether
  `onMoveShouldSet` is granted by non-vertical movement. Log `locationX/Y`,
  `dx/dy` at grant. Compare portrait 1:1 sensitivity travel in px per dB step.
  Where: `VerticalGroupFader.tsx`, `BusGroupsScreen.tsx`.
  Depends on: none
  Reuses: `LANDSCAPE_FADER_DRAG_SENSITIVITY` approach.
  Done when: H4/H5 are marked confirmed or rejected with numbers.
  Tests: manual iOS.
  Gate: instrumentation removed afterwards.

- [ ] T-003 [P]: Add regression tests for the master fader state path
  Reqs: REQ-002, REQ-003, REQ-006
  What: Tests that (a) remote master fader values during an active local drag do
  not overwrite local state, (b) after release the local value is kept for the
  protection window, (c) OSC sends during a burst of N fader changes are bounded
  and the final value is always sent.
  Where: `__tests__/features/busGroups/hooks/useBusGroups.test.ts`
  (+ a new component test for `VerticalGroupFader` if practical).
  Depends on: T-001
  Reuses: MCA local protection tests and fake timers.
  Done when: tests fail on current behavior for the confirmed hypotheses.
  Tests: `yarn jest __tests__/features/busGroups --runInBand`
  Gate: tests must reproduce the bug before the fix lands.

- [ ] T-004: Local protection window and drag lock for the master fader
  Reqs: REQ-002, REQ-006
  What: Mirror the MCA `MCA_LOCAL_PROTECTION_WINDOW_MS` idea for the master:
  track last local master change time and ignore remote master fader values
  inside the window or while the fader interaction is active.
  Where: `useBusGroups.ts`, `useOscSubscription.ts` (or the remote handler).
  Depends on: T-001, T-003
  Reuses: MCA protection pattern at `useBusGroups.ts` (~line 372).
  Done when: T-003 case (a)/(b) pass; no stale value jump on release.
  Tests: BusGroups jest + manual on device.
  Gate: apply only if T-001 confirmed H2.

- [ ] T-005: Throttle/coalesce OSC sends of the master fader
  Reqs: REQ-003, REQ-006
  What: Send at most one master fader OSC message per fixed interval (target
  about 30-50 ms, tune on device) while dragging, always flush the final value
  on release/terminate. Keep UI state updating every move.
  Where: `useBusGroups.ts` (`setMasterFader`) or `X32BusGroupsService.ts`.
  Depends on: T-001, T-003
  Reuses: coalescing used by BusMix remote fader work (see logs 2026-05-25).
  Done when: T-003 case (c) passes and the console ends on the release value.
  Tests: BusGroups jest + OSC capture on real X32.
  Gate: apply only if T-001 confirmed H3.

- [ ] T-006: Isolate master fader and meter from full-screen re-renders
  Reqs: REQ-004, REQ-001
  What: Stop `masterMeterDbfs` and per-move fader state from re-rendering
  `BusGroupsScreen` and MCA strips. Options to evaluate in T-001 result: move
  the meter subscription into the master strip (own state/store), memoize
  `MasterStrip`/`GroupStrip`, drive the meter fill with a transform/scaleY
  instead of percentage `height`/`bottom`, and avoid `setState` in the screen
  for `isFaderInteractionActive` (ref plus `setNativeProps` or a stable
  callback).
  Where: `useBusGroups.ts`, `BusGroupsScreen.tsx`, `MasterStrip.tsx`,
  `GroupStrip.tsx`, `VerticalGroupFader.tsx`.
  Depends on: T-001
  Reuses: `React.memo` pattern from `McaStripItem`, focus-aware meter lifecycle.
  Done when: render counts per second during drag drop to what T-001 defines as
  the target and the jitter is gone on device; meter still resubscribes on
  focus and does not freeze.
  Tests: BusGroups + BusMix jest, manual on device with meter active.
  Gate: do not change meter protocol; keep track width, thumb alignment and
  mute behavior.

- [ ] T-007: Fix the fader hit test and gesture capture
  Reqs: REQ-005, REQ-001, REQ-006
  What: Remove the `locationX/Y`-based gate or convert coordinates to the
  container space (use `pageX/pageY` with measured offset or capture on the
  container itself). Make capture directional (claim only when `|dy| > |dx|`
  after a small slop) so horizontal swipes scroll the strip; consider
  `onPanResponderTerminationRequest` only while not yet moved.
  Where: `VerticalGroupFader.tsx`, `BusGroupsScreen.tsx`.
  Depends on: T-002
  Reuses: BusMix `VerticalFader` responder as baseline.
  Done when: horizontal swipe over the master scrolls; vertical drag moves it;
  Android drag unaffected.
  Tests: BusGroups jest + manual iOS and Android.
  Gate: apply only if T-002 confirmed H4/H5; MCA faders share the component, so
  re-test all 9 faders.

- [ ] T-008: Tune portrait drag sensitivity for fine adjustment
  Reqs: REQ-005
  What: Decide, with numbers from T-002, whether the portrait sensitivity or the
  hit area needs a smaller factor (as landscape uses 0.45) or a taller travel,
  without changing the fader taper.
  Where: `BusGroupsScreen.tsx`, `src/shared/utils/faderInteraction.ts`.
  Depends on: T-002
  Reuses: `LANDSCAPE_FADER_DRAG_SENSITIVITY`.
  Done when: user confirms on iPhone that precision is acceptable.
  Tests: manual iOS.
  Gate: user approval of the chosen value.

- [ ] T-009: Automated non-regression gates
  Reqs: REQ-006
  What: Run the project gates after the fixes.
  Where: `repos/x32-control`
  Depends on: T-004, T-005, T-006, T-007, T-008 (those that were applied)
  Done when: all pass or pre-existing failures are documented.
  Tests: `yarn tsc`, `yarn jest __tests__/features/busGroups --runInBand`,
  `yarn jest __tests__/features/busMix --runInBand`,
  `yarn jest __tests__/shared/osc --runInBand`, `git diff --check`.
  Gate: green before UAT.

- [ ] T-010: Manual UAT on Android and iOS
  Reqs: REQ-001, REQ-002, REQ-005
  What: Redmi Note 9S plus real X32: slow/fast drag of master, release value,
  meter alive, remote change from another client, MCA still fine. iPhone:
  swipe-scroll over master, precise drag, landscape.
  Depends on: T-009
  Done when: observed behavior noted with timestamps.
  Gate: user sign-off.

- [ ] T-011: Update state and logs
  Reqs: REQ-007
  What: Update `src/features/busGroups/.specs/STATE.md` and add the project log.
  Depends on: T-010
  Done when: STATE lists the confirmed cause and the applied fixes.
