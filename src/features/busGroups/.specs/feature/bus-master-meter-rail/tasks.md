# Tasks - BusGroups Bus Master Meter Rail

Last updated: 2026-05-31

## Task List

- [x] T-001: Confirm protocol and UI baseline before edits
  Reqs: REQ-001 through REQ-015
  What: Re-check the existing BusGroups master fader geometry and current meter protocol implementation before changing runtime code. Confirm the selected source is `/meters/2`, index `busId - 1`, and that `/meters/5` remains only a fallback diagnostic if UAT disproves `/meters/2`.
  Where:
  - `src/features/busGroups/components/VerticalGroupFader.tsx`
  - `src/features/busGroups/components/GroupStrip.tsx`
  - `src/features/busGroups/components/MasterStrip.tsx`
  - `src/features/busGroups/hooks/useBusGroups.ts`
  - `src/features/busGroups/services/X32BusGroupsService.ts`
  - `src/features/busMix/hooks/useMeterSubscription.ts`
  - `src/features/busMix/utils/meterDecoder.ts`
  - `src/shared/osc/X32Protocol.ts`
  Depends on: none
  Reuses:
  - Existing BusMix meter request pattern: `client.send('/meters', [meterPath])`.
  - Existing BusMix meter decoder count-header and linear-to-dB behavior.
  - Existing `VerticalGroupFader` `masterTrack` geometry.
  Done when:
  - Current master track width, height source, margins, background color, dB scale position, and thumb offsets are confirmed.
  - Current BusMix meter streams `/meters/1` and `/meters/13` are confirmed as protected non-regression areas.
  - Worktree status is recorded and unrelated changes are left untouched.
  Tests:
  ```sh
  git status --short
  rg -n "masterTrack|mcaTrack|TRACK_EDGE_PADDING|TRACK_TOUCH_WIDTH|VerticalGroupFader|MasterStrip" src/features/busGroups
  rg -n "getMeters1Path|getMeters13Path|getMetersSubscribePath|decodeMeter1BlobForChannel|decodeMeter13BlobForChannel" src/features/busMix src/shared
  ```
  Gate:
  - No runtime code changes begin until this baseline is clear.
  Result:
  - Confirmed current master rail geometry is owned by `VerticalGroupFader`, with `styles.masterTrack.width = 5`, existing top/bottom margins, dB scale positioning, and thumb offsets.
  - Confirmed BusMix meter non-regression surface remains `/meters/1` for CH and `/meters/13` for AUX/FX.
  Verification:
  - `git status --short`: reviewed before edits.
  - `rg -n "masterTrack|mcaTrack|TRACK_EDGE_PADDING|TRACK_TOUCH_WIDTH|VerticalGroupFader|MasterStrip" src/features/busGroups`: reviewed.
  - `rg -n "getMeters1Path|getMeters13Path|getMetersSubscribePath|decodeMeter1BlobForChannel|decodeMeter13BlobForChannel" src/features/busMix src/shared`: reviewed.

- [x] T-002: Add `/meters/2` protocol and decoder coverage
  Reqs: REQ-002, REQ-003, REQ-009, REQ-011, REQ-015
  What: Add the path helper and decode logic needed to read BUS master meter values from `/meters/2`. Keep the existing `/meters/1` and `/meters/13` functions behavior-identical.
  Where:
  - `src/shared/osc/X32Protocol.ts`
  - `src/features/busMix/utils/meterDecoder.ts`
  - `__tests__/shared/osc/X32Protocol.test.ts`
  - `__tests__/features/busMix/utils/meterDecoder.test.ts`
  Depends on: T-001
  Reuses:
  - `METER_MIN_DBFS`, `METER_MAX_DBFS`, `decodeFloatDbValue` behavior.
  - Current float blob shape: `[int32 LE count][float32 LE x count]`.
  Implementation detail:
  - Add `X32Protocol.getMeters2Path()` returning `/meters/2`.
  - Prefer a small shared internal helper for "decode float at index" so `/meters/1`, `/meters/13`, and `/meters/2` cannot drift.
  - Add `decodeMeter2BlobForBusMaster(blob, busId)` or an equivalently explicit export.
  - Validate `busId` is `1..16`; anything else returns silent values.
  - Decode index `busId - 1`.
  Done when:
  - BUS `1`, `8`, `9`, and `16` decode from indexes `0`, `7`, `8`, and `15`.
  - Short, malformed, non-aligned, and out-of-range blobs return silence.
  - Existing BusMix decoder tests still pass.
  Tests:
  ```sh
  yarn jest __tests__/shared/osc/X32Protocol.test.ts --runInBand
  yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts --runInBand
  ```
  Gate:
  - New decoder tests and existing BusMix decoder tests pass.
  Result:
  - Added `X32Protocol.getMeters2Path()`.
  - Added shared indexed float blob decoding and `decodeMeter2BlobForBusMaster(blob, busId)`.
  - Preserved existing `/meters/1` and `/meters/13` public behavior.
  Verification:
  - `yarn jest __tests__/shared/osc/X32Protocol.test.ts --runInBand`: passed.
  - `yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts --runInBand`: passed.

- [x] T-003: Add mock/demo Bus Master meter support
  Reqs: REQ-001, REQ-010, REQ-011, REQ-013
  What: Extend mock/demo providers with a Bus Master meter subscription so Demo Console can show the new visual meter without real hardware.
  Where:
  - `src/shared/mixer/MixerControlProvider.ts`
  - `src/shared/mixer/mock/mockMixerProvider.ts`
  - `src/shared/mixer/mock/demoMixerProvider.ts`
  - Existing or new focused mock provider tests if available
  Depends on: T-002
  Reuses:
  - Existing `subscribeMeter` listener-map pattern.
  - Existing demo/mock meter loop intervals and smoothing helpers.
  - Existing bus master fader/on state in mock providers.
  Implementation detail:
  - Add `subscribeBusMasterMeter(busId, listener)` to `MixerControlProvider`.
  - Emit an initial value immediately.
  - Reuse the existing meter loop if possible; do not create an always-on timer when no meter listeners exist.
  - Shape the demo value around selected BUS master fader/on state plus deterministic activity, returning the same meter value type used by BusMix or a narrow `dbfs` value if the service contract chooses that.
  Done when:
  - Demo Console BusGroups can mount a Bus Master meter listener.
  - Unsubscribing removes the listener and stops the loop when no meter listeners remain.
  - Existing BusMix mock meter behavior still works.
  Tests:
  ```sh
  yarn jest __tests__/features/busGroups --runInBand
  yarn jest __tests__/features/busMix --runInBand
  ```
  Gate:
  - Provider interface changes do not break BusMix, BusGroups, or shared tests.
  Result:
  - Added `subscribeBusMasterMeter(busId, listener)` to `MixerControlProvider`.
  - Added mock and demo Bus Master meter listener maps.
  - Reused existing meter loops and stopped them only when channel and Bus Master meter listeners are both idle.
  Verification:
  - `yarn tsc`: passed.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed.
  - `yarn jest __tests__/features/busMix --runInBand`: passed.

- [x] T-004: Add real Bus Master meter subscription to `X32BusGroupsService`
  Reqs: REQ-002, REQ-003, REQ-007, REQ-011, REQ-012, REQ-013
  What: Implement one real-console subscription method that listens to `/meters/2`, requests `/meters` with `/meters/2`, renews before timeout, decodes the selected BUS master, and cleans up reliably.
  Where:
  - `src/features/busGroups/services/X32BusGroupsService.ts`
  - New or existing service tests under `__tests__/features/busGroups/services/`
  Depends on: T-002, T-003
  Reuses:
  - Existing service `client` and `SharedOscClient` lease created by `connect`.
  - Existing mock provider branching in `X32BusGroupsService`.
  - Existing BusMix meter renewal cadence constants as a reference.
  Implementation detail:
  - Add `subscribeToBusMasterMeter(busId, listener): () => void`.
  - For mock provider, delegate to `mockProvider.subscribeBusMasterMeter`.
  - For real console, subscribe to `X32Protocol.getMeters2Path()`.
  - Request with `client.send(X32Protocol.getMetersSubscribePath(), [X32Protocol.getMeters2Path()])`.
  - Renew every `8000ms`.
  - Extract the blob from the first OSC arg only when it is a `Uint8Array`.
  - Decode via `decodeMeter2BlobForBusMaster`.
  - Return an idempotent cleanup that clears interval and unsubscribes.
  Done when:
  - Service sends exactly the documented meter request for `/meters/2`.
  - Service listens to `/meters/2` responses.
  - Cleanup clears the timer and listener.
  - Meter decode errors do not set screen-level errors.
  Tests:
  ```sh
  yarn jest __tests__/features/busGroups/services --runInBand
  ```
  Gate:
  - Focused service tests pass, including cleanup behavior.
  Result:
  - Added `subscribeToBusMasterMeter(busId, listener)` to `X32BusGroupsService`.
  - Real console path requests `/meters` with `['/meters/2']`, listens on `/meters/2`, renews every `8000ms`, decodes selected BUS, and cleans up timer/listener.
  - Malformed non-blob meter messages are ignored.
  Verification:
  - `yarn jest __tests__/features/busGroups/services/X32BusGroupsService.test.ts --runInBand`: passed.

- [x] T-005: Wire `masterMeterDbfs` through `useBusGroups`
  Reqs: REQ-001, REQ-007, REQ-010, REQ-011, REQ-012, REQ-013
  What: Add transient meter state to the BusGroups hook and subscribe to the service once the BUS state is connected and ready.
  Where:
  - `src/features/busGroups/hooks/useBusGroups.ts`
  - `__tests__/features/busGroups/hooks/useBusGroups.test.ts`
  Depends on: T-004
  Reuses:
  - Current `useOscSubscription` separation for master fader/on.
  - Current hook loading/error state.
  - `METER_MIN_DBFS` silent floor.
  Implementation detail:
  - Initialize `masterMeterDbfs` to `METER_MIN_DBFS`.
  - Start the meter subscription only when `state.isConnected && !state.isLoading`.
  - Reset to `METER_MIN_DBFS` on console/BUS changes and cleanup.
  - Suppress redundant state updates when the decoded value would not change the visible fill enough.
  - Do not persist meter state.
  - Do not write meter state into `busMixChannelStore`.
  Done when:
  - `useBusGroups` returns `masterMeterDbfs`.
  - Hook tests can simulate a service meter callback and observe only master meter state changing.
  - MCA assignments, computed MCA faders, master fader, and master mute behavior remain unchanged in tests.
  Tests:
  ```sh
  yarn jest __tests__/features/busGroups/hooks/useBusGroups.test.ts --runInBand
  ```
  Gate:
  - Existing BusGroups hook tests remain green with new meter assertions.
  Result:
  - Added transient `masterMeterDbfs` state initialized to `METER_MIN_DBFS`.
  - Subscribes only after BusGroups is connected and not loading.
  - Meter state is not persisted and does not write to `BusMixChannelStore`.
  Verification:
  - `yarn jest __tests__/features/busGroups/hooks/useBusGroups.test.ts --runInBand`: passed.

- [x] T-006: Render the meter inside the existing Bus Master rail
  Reqs: REQ-001, REQ-004, REQ-005, REQ-006, REQ-008, REQ-014
  What: Update the BusGroups fader UI so only the Bus Master rail gets a passive meter fill inside its existing central track.
  Where:
  - `src/features/busGroups/components/VerticalGroupFader.tsx`
  - `src/features/busGroups/components/GroupStrip.tsx`
  - `src/features/busGroups/components/MasterStrip.tsx`
  Depends on: T-005
  Reuses:
  - `styles.track`, `styles.masterTrack`, `colors.master.track`.
  - Existing `FaderDbScale`.
  - Existing thumb positioning and `PanResponder`.
  - Existing meter thresholds/colors from BusMix where practical.
  Implementation detail:
  - Add optional `meterDbfs?: number` prop to `VerticalGroupFader`.
  - Render meter fill only when `isMaster` is true and `meterDbfs` is present.
  - Keep `styles.masterTrack.width = 5`.
  - Keep track top/bottom margins based on `TRACK_EDGE_PADDING` and `THUMB_BOTTOM_GUARD`.
  - Use `pointerEvents="none"` for meter fill.
  - Keep the fader thumb `zIndex` above the track.
  - Do not alter `TRACK_TOUCH_WIDTH`, `THUMB_HEIGHT`, `TRACK_EDGE_PADDING`, `THUMB_BOTTOM_GUARD`, `positionToFader`, or `faderToPosition`.
  - If implementing a helper component, keep it local to BusGroups or shared only if it meaningfully avoids duplication.
  Done when:
  - Bus Master rail shows the track background plus meter fill.
  - MCA rails remain visually unchanged.
  - Thumb alignment and fader interaction are unchanged.
  - No text overlaps are introduced in portrait or compact landscape.
  Tests:
  ```sh
  yarn tsc
  yarn jest __tests__/features/busGroups --runInBand
  ```
  Gate:
  - TypeScript and BusGroups tests pass.
  Result:
  - Added optional `meterDbfs` to `VerticalGroupFader`.
  - Rendered passive green/yellow/red continuous meter fill inside the existing master track.
  - Kept `styles.masterTrack.width = 5`, fader touch width, thumb size, track margins, fader math, and dB scale behavior unchanged.
  Verification:
  - `yarn tsc`: passed.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed.

- [x] T-007: Pass the meter value from screen to MasterStrip only
  Reqs: REQ-001, REQ-007, REQ-008, REQ-013, REQ-014
  What: Thread `masterMeterDbfs` from `BusGroupsScreen` to `MasterStrip`, then through `GroupStrip` to `VerticalGroupFader`, without touching MCA strip props beyond optional type compatibility.
  Where:
  - `src/features/busGroups/screens/BusGroupsScreen.tsx`
  - `src/features/busGroups/components/MasterStrip.tsx`
  - `src/features/busGroups/components/GroupStrip.tsx`
  Depends on: T-006
  Reuses:
  - Existing `MasterStrip` wrapper around `GroupStrip`.
  - Existing `McaStrip` path as a non-meter path.
  Implementation detail:
  - Keep `McaStripItem` memo comparison stable; it should not compare the master meter value.
  - Avoid passing meter props to MCA rows.
  - Confirm `ScrollView` and `isFaderInteractionActive` logic are unchanged.
  Done when:
  - Only `MasterStrip` receives the meter value.
  - MCA strip render path does not subscribe to BUS meter state.
  - BusGroups screen still navigates to BusMix with the same route params.
  Tests:
  ```sh
  yarn jest __tests__/features/busGroups --runInBand
  yarn tsc
  ```
  Gate:
  - BusGroups tests and TypeScript pass.
  Result:
  - Threaded `masterMeterDbfs` from `BusGroupsScreen` to `MasterStrip`, `GroupStrip`, and `VerticalGroupFader`.
  - MCA render path remains without meter subscription/value.
  Verification:
  - `yarn tsc`: passed.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed.

- [x] T-008: Run non-regression gates for shared meter and BusMix behavior
  Reqs: REQ-007, REQ-008, REQ-009, REQ-012, REQ-013
  What: Verify the new Bus Master meter did not disturb BusMix meters, shared OSC paths, or BusGroups control behavior.
  Where:
  - Test suite and changed files
  Depends on: T-002 through T-007
  Reuses:
  - Existing focused test commands from `.specs/codebase/TESTING.md`.
  Done when:
  - All required gates pass locally or any pre-existing failures are documented with exact test names.
  Tests:
  ```sh
  yarn tsc
  yarn jest __tests__/features/busGroups --runInBand
  yarn jest __tests__/features/busMix --runInBand
  yarn jest __tests__/shared/osc/X32Protocol.test.ts --runInBand
  git diff --check
  ```
  Gate:
  - No new automated regression is accepted.
  Result:
  - Automated non-regression gates passed.
  Verification:
  - `yarn tsc`: passed.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed.
  - `yarn jest __tests__/features/busMix --runInBand`: passed.
  - `yarn jest __tests__/shared/osc/X32Protocol.test.ts --runInBand`: passed.

- [ ] T-009: Real-console UAT for BUS master meter mapping
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-007, REQ-009, REQ-014, REQ-015
  What: Validate the feature on a physical X32/M32 because meter streams are UDP telemetry and the mapping comes from de facto protocol docs.
  Where:
  - Physical X32/M32 network
  - BusGroups screen
  - BusMix screen after returning from BusGroups
  Depends on: T-008
  Reuses:
  - Existing real-console validation approach from BusMix meter work.
  Manual checks:
  - BUS 1: send signal to BUS 1 and confirm Bus Master meter moves; remove signal and confirm decay/silence.
  - BUS 8: confirm index 7 maps to BUS 8.
  - BUS 9: confirm bank boundary index 8 maps to BUS 9 and not BUS 8 or BUS 10.
  - BUS 16: confirm last BUS maps correctly.
  - Stereo-linked pair: open the selected BUS and confirm the meter represents the selected BUS; document if linked pair should become a future enhancement.
  - Fader drag: confirm same feel, same range, same release behavior, and horizontal scroll lock.
  - Mute/on: confirm no change in master mute behavior.
  - MCA strips: confirm no visible or control regression.
  - BusMix after BusGroups: confirm CH/AUX/FX meters still move.
  Gate:
  - Real-console result is recorded in logs/state. If hardware is unavailable, mark UAT pending and do not claim the feature fully hardware-validated.
  Status:
  - Pending. No physical X32/M32 hardware is available in this execution context.
  Verification:
  - Automated gates passed, but hardware UAT remains required for BUS 1, 8, 9, and 16.

- [x] T-010: Update docs, state, and implementation log
  Reqs: REQ-013, REQ-015
  What: Record what was implemented, tests run, any UAT result, and any deferred concern after implementation.
  Where:
  - `src/features/busGroups/.specs/STATE.md`
  - `.specs/project/STATE.md`
  - `src/features/busGroups/.specs/feature/bus-master-meter-rail/tasks.md`
  - `logs/YYYY-MM-DD_HH-MM-SS-busgroups-bus-master-meter-rail-implementation.txt`
  Depends on: T-008, T-009 if hardware is available
  Reuses:
  - Existing `/logs` session format.
  Done when:
  - Local and global states mention the Bus Master meter work and current validation status.
  - Completed tasks have `Result` and `Verification` notes.
  - Any pending real-console UAT remains explicit.
  Tests:
  ```sh
  git diff --check
  ```
  Gate:
  - Documentation matches the actual implementation and validation state.
  Result:
  - Updated local and global state with implementation status and pending hardware UAT.
  - Added implementation log for the Bus Master meter rail feature.
  Verification:
  - `git diff --check`: passed.
