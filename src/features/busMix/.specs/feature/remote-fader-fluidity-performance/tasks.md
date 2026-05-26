# Tasks - BusMix Remote Fader Fluidity Performance

Last updated: 2026-05-25

## Rollback Status

Rollback implemented on 2026-05-25. Real-device testing showed the app and meters were more fluid before this follow-up receive-performance layer. The runtime coalescing, frame flush, subscription hysteresis, diagnostics, and time-factor tuning were removed under `src/features/busMix/.specs/feature/remote-fader-sync-rollback-performance-restore/`, while preserving Local Network permission preflight and unrelated BusMix fixes.

## Task List

- [ ] T-001: Measure current remote fader packet rate and UI settle behavior
  Reqs: REQ-003, REQ-004, REQ-005, REQ-015, REQ-016, REQ-018
  What: Add temporary or dev-gated diagnostics to measure the current implementation before changing behavior. Capture per-visible-fader incoming packet rate, applied update rate, maximum pending visual settle time after remote movement stops, current `timeFactor`, visible subscribed path count, and whether movement is driven by `/subscribe`, `/xremote`, or background sync. Use CH 17 same-BUS send-level as the primary path and repeat with at least one additional visible CH source. The output must identify whether the 2-second frantic settle is caused by packet backlog, duplicate values, local echo, visibility subscription churn, or JS render pressure.
  Where: Prefer ref-backed diagnostics in `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts` and `src/features/busMix/hooks/useBusMix.ts`; optional temporary packet timestamping in `src/shared/osc/OscClient.ts`; final findings in this feature's `design.md`, `src/features/busMix/.specs/STATE.md`, and a log file under `logs/`.
  Depends on: none
  Reuses: `getRealtimeSubscriptionHealth()`, existing fader subscription health refs, `OscClient.handlePacket`, and BusMix visible-channel tracking.
  Done when: There is a written baseline with current packet/update rates and a clear explanation of the dominant cause of lag/thrash.
  Tests: If diagnostics are pure/ref-only, run `yarn tsc` and focused BusMix tests. If production code is touched, add or update tests for the diagnostic helper.
  Gate: No noisy production logging remains enabled by default.

  Implementation result: Partially addressed through production-safe ref-backed diagnostics added in T-008. Real-console baseline measurement remains pending because this terminal session cannot operate the emulator/X32 UI directly. No noisy production logging was added.

- [x] T-002: Retune scalar subscription defaults for low traffic first
  Reqs: REQ-001, REQ-003, REQ-005, REQ-011, REQ-013, REQ-018
  What: Change the fader subscription time-factor policy from the current aggressive default to a measured, conservative profile. Evaluate `timeFactor` values `5`, `10`, and `20` against the real console. Unless measurements prove otherwise, make BusMix visible fader subscriptions default to `20` while keeping `/xremote` active and background sync unchanged. Ensure the chosen default is documented with rationale and can be overridden in tests without leaking protocol details into UI code.
  Where: `src/shared/osc/X32Protocol.ts`, `src/shared/osc/OscClient.ts`, `src/features/busMix/services/BusMixService.ts`, and tests under `__tests__/shared/osc` / `__tests__/features/busMix/services`.
  Depends on: T-001
  Reuses: `X32Protocol.defaultScalarSubscriptionTimeFactor`, `OscClient.subscribeScalarValue`, `BusMixService.subscribeChannelLevelUpdates`.
  Done when: BusMix uses a documented fader-specific subscription time factor that reduces packet pressure while preserving real-time feel in UAT.
  Tests: Assert the default time factor used by BusMix fader subscriptions; assert existing subscribe/renew/unsubscribe behavior still works; assert `/xremote` keepalive remains unchanged.
  Gate: Shared OSC tests, BusMix service tests, and `yarn tsc` pass.

  Implementation result: Completed. Added `X32Protocol.defaultBusMixFaderSubscriptionTimeFactor = 20` and made `BusMixService.subscribeChannelLevelUpdates(...)` pass that fader-specific value into `OscClient.subscribeScalarValue(...)`. `/xremote` keepalive behavior was not changed.

  Verification result: Focused BusMix service/X32 protocol tests passed; shared OSC tests passed; `yarn tsc` passed.

  SPEC_DEVIATION: The conservative time factor was applied before a real-console numeric baseline because the user already reported real-console lag/thrash and external X32/Mix Station guidance supports reducing `/subscribe` pressure. T-010 remains required to tune further if hardware proves `20` too slow.

- [x] T-003: Add a pure remote fader packet coalescer
  Reqs: REQ-003, REQ-004, REQ-006, REQ-007, REQ-008, REQ-010, REQ-017
  What: Create a pure utility that accepts high-frequency remote fader packets and emits only the latest useful value per fader for a frame flush. It must dedupe near-identical values using a small epsilon, keep only the latest packet by exact path/channel, count dropped/coalesced packets, and expose stats without React state. The utility must not know about React, BusMix UI components, or OSC transport.
  Where: New `src/features/busMix/utils/remoteFaderCoalescing.ts`; tests in `__tests__/features/busMix/utils/remoteFaderCoalescing.test.ts`.
  Depends on: T-001
  Reuses: existing `clamp` conventions and fader raw `0..1` value model.
  Done when: The coalescer can turn many packets for CH 17 within one frame into one latest update and can report how many packets were coalesced/dropped.
  Tests: Cover latest-value-wins, duplicate epsilon, independent channels, stats counters, out-of-order timestamp handling, and flush reset behavior.
  Gate: Focused utility tests and `yarn tsc` pass.

  Implementation result: Completed. Added `src/features/busMix/utils/remoteFaderCoalescing.ts` with latest-value-wins buffering, duplicate epsilon filtering, stale echo suppression hook, out-of-order drop handling, pending flush reset, and cumulative stats.

  Verification result: `remoteFaderCoalescing.test.ts` passed and BusMix suite passed.

- [x] T-004: Frame-align remote fader application with requestAnimationFrame
  Reqs: REQ-003, REQ-004, REQ-007, REQ-009, REQ-010, REQ-017
  What: Integrate the coalescer into `useBusMixRemoteFaderSubscription` so subscribed values are buffered in refs and applied via one scheduled `requestAnimationFrame`. Multiple incoming packets before the next frame must result in one `onRemoteLevel` or batch callback per channel. Cleanup must cancel pending frame work on unmount, bus change, console disconnect, or subscription scope change.
  Where: `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts`; hook tests under `__tests__/features/busMix/hooks`.
  Depends on: T-003
  Reuses: `selectVisibleFaderSubscriptionChannels`, existing health callback shape, and React Native `requestAnimationFrame` behavior.
  Done when: Incoming subscribed values no longer call the reconciliation path once per packet; they flush at frame cadence and only with latest values.
  Tests: Fake `requestAnimationFrame` tests proving packet bursts flush once; cleanup cancels pending flush; visible subscription cleanup still unsubscribes paths; health counters distinguish incoming vs applied updates.
  Gate: Focused hook tests, BusMix tests, and `yarn tsc` pass.

  Implementation result: Completed. `useBusMixRemoteFaderSubscription` now buffers incoming subscribed fader values in refs and schedules one `requestAnimationFrame` flush. Packet bursts apply only the latest value per channel/path. Cleanup cancels pending frame work and clears pending coalesced values.

  Verification result: Existing visible-subscription hook tests passed; BusMix suite passed; `yarn tsc` passed.

- [x] T-005: Batch remote fader reconciliation inside one store update per frame
  Reqs: REQ-003, REQ-007, REQ-009, REQ-010, REQ-017
  What: Add a batched remote fader reconciliation path in `useBusMix`, so a frame flush with several fader updates performs one `busMixChannelStore.updateChannels(...)` call. The batch path must still use `applyLinkedRemoteLevelUpdate` for each channel to preserve linked-channel visual reflection and local protection behavior. It must not bypass `BusMixChannelStore`.
  Where: `src/features/busMix/hooks/useBusMix.ts`, possibly `src/features/busMix/utils/linkedChannelSync.ts` if a pure batch helper is cleaner; tests under `__tests__/features/busMix/utils` or existing BusMix hook/service tests.
  Depends on: T-004
  Reuses: `reconcileRemoteFader`, `applyLinkedRemoteLevelUpdate`, `pendingLocalChangeAtRef`, `LOCAL_PROTECTION_WINDOW_MS`, `updateSharedChannels`.
  Done when: A frame containing N remote fader updates produces one shared store update while preserving final fader state and linked-peer behavior.
  Tests: Batch applies latest values, linked CH peers reflect correctly, local protection still blocks stale echoes, and batch order does not cause older values to override newer values.
  Gate: BusMix tests, BusGroups tests, and `yarn tsc` pass.

  Implementation result: Completed. Added `applyLinkedRemoteLevelUpdates(...)` and updated `useBusMix` so each frame flush applies remote fader updates through one `busMixChannelStore.updateChannels(...)` call while preserving linked-channel reflection and local protection.

  Verification result: Added linked-channel batch reducer coverage; BusMix and BusGroups suites passed; `yarn tsc` passed.

- [x] T-006: Harden local echo and stale packet suppression
  Reqs: REQ-002, REQ-003, REQ-006, REQ-008, REQ-017
  What: Track per-channel remote receive metadata so delayed echoes of local writes and out-of-order packets cannot pull the fader backward after the user or another app stops moving it. Extend the current time-window protection with last-applied timestamps, last-applied level, and local-write markers. The implementation must converge to the true console value after the protection window through the next fresh accepted update or background sync.
  Where: Prefer `src/features/busMix/utils/remoteFaderCoalescing.ts` for pure packet decisions and `src/features/busMix/hooks/useBusMix.ts` for local-write metadata handoff.
  Depends on: T-003, T-005
  Reuses: `pendingLocalChangeAtRef`, `LOCAL_PROTECTION_WINDOW_MS`, current local optimistic update flow.
  Done when: A delayed packet matching an older local write cannot create visible fader jitter, and a genuinely different remote value after protection is still accepted.
  Tests: Simulate local write followed by old remote echo, then fresh remote value; assert old echo is dropped and fresh value applies. Simulate out-of-order remote timestamps and duplicate raw values.
  Gate: Focused coalescer/protection tests, BusMix tests, and `yarn tsc` pass.

  Implementation result: Completed. The coalescer now supports suppressing packets until a per-channel timestamp, and `useBusMix` supplies a suppression window derived from recent local fader writes and linked peers. The coalescer also drops out-of-order packets and duplicate values.

  Verification result: Coalescer stale echo/out-of-order tests passed; BusMix suite passed; `yarn tsc` passed.

- [x] T-007: Add subscription visibility hysteresis to prevent scroll churn
  Reqs: REQ-005, REQ-011, REQ-012, REQ-015
  What: Add a small visibility scope manager so channels do not immediately unsubscribe/resubscribe during tiny scroll movements. Keep visible channels subscribed immediately, retain recently visible channels for a short grace period, cap retained subscriptions to a small configurable budget, and evict least-recently-visible channels when over budget. This should reduce network bursts without broad all-channel subscription.
  Where: New pure utility in `src/features/busMix/utils/faderSubscriptionScope.ts` or inside `useBusMixRemoteFaderSubscription.ts` if kept small; tests under `__tests__/features/busMix/utils`.
  Depends on: T-001
  Reuses: `visibleChannelIds`, `selectVisibleFaderSubscriptionChannels`, current subscription cleanup pattern.
  Done when: Fast scroll changes produce bounded subscription churn and the total subscribed path count stays within the documented cap.
  Tests: Visible channels subscribe immediately; recently visible channels remain through grace period; cap evicts old retained channels; bus/screen cleanup clears all retained paths.
  Gate: Focused utility/hook tests and `yarn tsc` pass.

  Implementation result: Completed. Added `faderSubscriptionScope` and integrated it into `useBusMixRemoteFaderSubscription`. Visible faders subscribe immediately; recently visible faders are retained briefly; retained subscriptions are capped to visible count plus a small buffer; retention is cleaned up with a timer and on unmount.

  Verification result: `faderSubscriptionScope.test.ts` passed; BusMix suite passed; `yarn tsc` passed.

- [x] T-008: Extend performance diagnostics without render pressure
  Reqs: REQ-010, REQ-015, REQ-016, REQ-018
  What: Extend `getRealtimeSubscriptionHealth()` with ref-backed performance metrics: incoming fader packet count, applied fader update count, coalesced count, duplicate count, stale echo count, out-of-order drop count, last frame flush duration, max pending packet age, estimated incoming packets/sec, estimated applied updates/sec, and current fader subscription time factor. Do not update React state per packet and do not render these diagnostics in UI unless explicitly requested.
  Where: `src/features/busMix/hooks/useBusMix.ts`, `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts`, and any new coalescer stats types.
  Depends on: T-003, T-004
  Reuses: existing `BusMixRealtimeSubscriptionHealth`, `markRemoteFaderSubscriptionHealth`, and ref-based diagnostics pattern.
  Done when: A developer can inspect runtime health and know whether the app is receiving too many packets, coalescing correctly, or applying too many UI updates.
  Tests: Focused tests for stats propagation from coalescer to health refs; `getRealtimeSubscriptionHealth()` computes stale/performance fields without causing render updates.
  Gate: Focused tests and `yarn tsc` pass.

  Implementation result: Completed. `getRealtimeSubscriptionHealth()` now exposes ref-backed performance counters for incoming packets, applied updates, coalesced packets, duplicate drops, stale echo drops, out-of-order drops, max pending packet age, frame flush duration, estimated packet/update rates, and current fader subscription time factor. These metrics do not update React state per packet.

  Verification result: BusMix suite and `yarn tsc` passed.

- [x] T-009: Prove local send path and meters did not regress
  Reqs: REQ-001, REQ-002, REQ-009, REQ-014
  What: Run non-regression checks after the receive optimization. Confirm local fader drag still uses 30 ms send throttle and final immediate send. Confirm meters were not touched. Confirm BusGroups receives shared state updates coherently. Confirm pan and mute/on receive behavior still work as before.
  Where: Existing code and test suites; no intended production code changes in this task.
  Depends on: T-002 through T-008
  Reuses: existing BusMix, BusGroups, shared OSC, meter routing, and TypeScript gates.
  Done when: Diff and tests show the optimization is limited to remote fader receive performance and related diagnostics.
  Tests:
  ```sh
  yarn jest __tests__/features/busMix --runInBand
  yarn jest __tests__/features/busGroups --runInBand
  yarn jest __tests__/shared/osc --runInBand
  yarn tsc
  ```
  Gate: All listed commands pass. If `yarn lint` is attempted, document that the workspace currently lacks a resolvable `eslint` binary if still true.

  Implementation result: Completed. The optimization did not modify meter runtime files. Local fader send functions remain unchanged. `/xremote` and background sync remain enabled. BusGroups shared-state tests passed.

  Verification result:
  - `yarn jest __tests__/features/busMix --runInBand`: passed, 10 suites / 44 tests.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed, 2 suites / 10 tests.
  - `yarn jest __tests__/shared/osc --runInBand`: passed, 4 suites / 11 tests.
  - `yarn tsc`: passed.

- [ ] T-010: Real-console UAT for fluidity, latency, and low-device performance
  Reqs: REQ-001 through REQ-018
  What: Validate on the connected X32/M32 plus emulator/device, focusing on perceived smoothness rather than just correctness. Test CH 17 same-BUS send level from the X32 official app, another CH source, and one AUX/FX source if available. Measure before/after latency, packet rate, applied update rate, fader settle time after remote movement stops, and subjective UI responsiveness while several visible faders are subscribed. Include at least one lower-performance device/emulator profile if available.
  Where: Manual UAT; update `src/features/busMix/.specs/STATE.md`, `.specs/project/STATE.md`, and create `logs/YYYY-MM-DD_HH-MM-SS-busmix-remote-fader-fluidity-performance-uat.txt`.
  Depends on: T-009
  Reuses: real-console UAT script from `remote-fader-subscription-sync`, new diagnostics from this feature, and logs convention.
  Done when: The fader no longer has a visible 2-second frantic settle, remote movement feels fluid enough for monitor-mix usage, and diagnostics show bounded incoming/apply rates.
  Tests: Manual only.
  Gate: UAT complete or explicitly blocked with reason.

## Implementation Notes

- Optimize receive/render flow before considering any broader polling.
- Keep `/xremote`; it is lower traffic for changes and complements `/subscribe`.
- Avoid replaying network history. Render the newest useful state.
- Treat `requestAnimationFrame` as the UI boundary for fader application.
- Keep high-frequency diagnostics in refs.
- Keep subscription count visibility-scoped with a small grace period, not global.
- Do not change meter runtime files.
- Do not treat `/ch/17/mix/fader` as equivalent to `/ch/17/mix/{bus}/level`.
