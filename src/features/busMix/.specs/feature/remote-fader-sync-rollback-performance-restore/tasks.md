# Tasks - BusMix Remote Fader Sync Rollback Performance Restore

Last updated: 2026-05-25

## Task List

- [x] T-001: Capture rollback baseline and confirm scope
  Reqs: REQ-001, REQ-002, REQ-012
  What: Record the exact current files touched by `remote-fader-fluidity-performance` and `remote-fader-subscription-sync`, compare against `HEAD~1` and the user-referenced smoother version/build where available, and confirm the rollback scope is limited to remote fader receive additions. Do not include Local Network permission files in the rollback scope.
  Where: `git diff --name-status HEAD`, `git diff --name-status HEAD~1..HEAD`, Xcode build/version notes if available, and this feature's docs/log.
  Depends on: none
  Reuses: existing git history and logs.
  Done when: The implementer has a written file-level rollback map and a list of files explicitly excluded from rollback.
  Tests: `git status --short`; no code test required.
  Gate: Scope excludes `src/shared/network/*`, `ios/Tacimix/LocalNetworkPermission.m`, `ios/Tacimix/Info.plist`, and LocalNetworkPermission project entries.

  Implementation result: Completed. Compared `HEAD~1..HEAD`, current worktree, and permission-related files. Rollback scope was limited to BusMix remote fader receive additions and shared OSC scalar subscription support. Local Network permission files were explicitly excluded.

- [x] T-002: Remove remote-fader-fluidity-performance runtime code
  Reqs: REQ-001, REQ-008, REQ-012
  What: Remove the runtime code and tests introduced only for `remote-fader-fluidity-performance`: remote fader coalescer, subscription hysteresis utility, frame-flush integration, batch-only diagnostics fields, BusMix-specific fader subscription time factor, and their focused tests. Leave the spec/log history intact unless the user asks to delete documentation too.
  Where:
  - `src/features/busMix/utils/remoteFaderCoalescing.ts`
  - `src/features/busMix/utils/faderSubscriptionScope.ts`
  - `__tests__/features/busMix/utils/remoteFaderCoalescing.test.ts`
  - `__tests__/features/busMix/utils/faderSubscriptionScope.test.ts`
  - `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts`
  - `src/features/busMix/hooks/useBusMix.ts`
  - `src/shared/osc/X32Protocol.ts`
  - related tests
  Depends on: T-001
  Reuses: restored lightweight receive flow from T-004.
  Done when: No runtime imports reference `remoteFaderCoalescing` or `faderSubscriptionScope`, and no BusMix code references `defaultBusMixFaderSubscriptionTimeFactor`.
  Tests: `rg -n "remoteFaderCoalescing|faderSubscriptionScope|defaultBusMixFaderSubscriptionTimeFactor" src __tests__` returns no runtime/test references.
  Gate: `yarn tsc` passes.

  Implementation result: Completed. Removed `remoteFaderCoalescing`, `faderSubscriptionScope`, their tests, frame-flush diagnostics, and the BusMix-specific fader subscription time factor. Static search shows no remaining references in `src` or `__tests__`.

  Verification result: `yarn tsc` passed.

- [x] T-003: Remove managed visible-fader X32 subscribe receive path from BusMix
  Reqs: REQ-002, REQ-003, REQ-004, REQ-012
  What: Remove BusMix usage of managed scalar `/subscribe` receive loops. Delete `useBusMixRemoteFaderSubscription` if unused, remove `subscribeChannelLevelUpdates(...)` from `BusMixService`, remove visible-fader subscription health fields, and restore the previous lightweight `service.onLevel(channel, busNumber, listener)` receive listener in `useBusMix` alongside existing `onOn` and `onPan`.
  Where:
  - `src/features/busMix/hooks/useBusMix.ts`
  - `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts`
  - `src/features/busMix/services/BusMixService.ts`
  - `src/features/busMix/screens/BusMixScreen.tsx`
  - related BusMix tests
  Depends on: T-002
  Reuses: `BusMixService.onLevel`, `reconcileRemoteFader` or equivalent existing remote reconciliation, `syncRemoteFaders()`, and `BusMixChannelStore.updateChannels`.
  Done when: BusMix no longer starts X32 `/subscribe` commands for visible fader paths, and remote fader receive behavior is back to exact-address listener plus background sync.
  Tests: BusMix tests updated/passing; static search shows no `useBusMixRemoteFaderSubscription` runtime import.
  Gate: `yarn jest __tests__/features/busMix --runInBand` and `yarn tsc` pass.

  Implementation result: Completed. Deleted `useBusMixRemoteFaderSubscription`, removed `BusMixService.subscribeChannelLevelUpdates(...)`, removed BusMixScreen `realtimeVisibleChannelIds` wiring into `useBusMix`, and restored lightweight `service.onLevel(...)` listeners alongside `onOn` and `onPan`.

  Verification result: `yarn jest __tests__/features/busMix --runInBand` passed, 6 suites / 32 tests. `yarn tsc` passed.

- [x] T-004: Remove generic scalar subscription infrastructure if it has no remaining consumers
  Reqs: REQ-002, REQ-008, REQ-012
  What: Check whether `OscClient.subscribeScalarValue(...)`, scalar subscription state, and X32 `/subscribe`/`renew`/`unsubscribe` helpers are used anywhere after BusMix rollback. If no runtime consumer remains, remove the API and its tests. If another feature still uses it, keep the API but ensure BusMix does not.
  Where:
  - `src/shared/osc/OscClient.ts`
  - `src/shared/osc/X32Protocol.ts`
  - `__tests__/shared/osc/OscClient.test.ts`
  - `__tests__/shared/osc/X32Protocol.test.ts`
  Depends on: T-003
  Reuses: existing `OscClient.subscribe(...)`, `send(...)`, request/response handling, and `/xremote` keepalive.
  Done when: Shared OSC no longer contains unused scalar subscription code, or the remaining usage is explicitly documented.
  Tests: `yarn jest __tests__/shared/osc --runInBand`.
  Gate: Shared OSC tests and `yarn tsc` pass.

  Implementation result: Completed. No remaining runtime consumer used `OscClient.subscribeScalarValue(...)`, so the scalar subscription state/API and `/subscribe`/`renew`/`unsubscribe` helpers were removed from shared OSC.

  Verification result: `yarn jest __tests__/shared/osc --runInBand` passed, 4 suites / 8 tests. `yarn tsc` passed.

- [x] T-005: Preserve Local Network permission preflight
  Reqs: REQ-006, REQ-007, REQ-011
  What: Verify the rollback did not remove or alter the Local Network permission prompt/preflight. The first UDP bind must still call `ensureLocalNetworkPermission()`, native `LocalNetworkPermission.m` must remain compiled into iOS, and Info.plist must still declare Local Network usage and Bonjour services.
  Where:
  - `src/shared/network/UdpTransport.ts`
  - `src/shared/network/LocalNetworkPermission.ts`
  - `ios/Tacimix/LocalNetworkPermission.m`
  - `ios/Tacimix/Info.plist`
  - `ios/Tacimix.xcodeproj/project.pbxproj`
  Depends on: T-002, T-003, T-004
  Reuses: existing permission preflight implementation.
  Done when: Static checks confirm permission code and plist declarations remain intact.
  Tests:
  ```sh
  rg -n "ensureLocalNetworkPermission|LocalNetworkPermission|NSLocalNetworkUsageDescription|NSBonjourServices" src ios
  plutil -lint ios/Tacimix/Info.plist
  yarn jest __tests__/shared/network --runInBand --testTimeout=10000
  ```
  Gate: Static checks and shared network tests pass, or any pre-existing network test timeout is documented.

  Implementation result: Completed. Static checks confirmed `ensureLocalNetworkPermission`, `LocalNetworkPermission`, `NSLocalNetworkUsageDescription`, `NSBonjourServices`, and the iOS project source entry remain present. `plutil` confirmed `Info.plist` is valid.

  Verification result: `yarn jest __tests__/shared/network --runInBand --testTimeout=10000` passed, 2 suites / 8 tests.

- [x] T-006: Preserve meter stability and local send behavior
  Reqs: REQ-004, REQ-005, REQ-007, REQ-011
  What: Confirm rollback does not touch meter runtime files and does not change app-to-console fader sends. Verify AUX/FX meter stream isolation still routes `/meters/1` only to CH 01..32 and `/meters/13` only to AUX/FX IDs 33..48. Verify fader drag send throttle/final send remain unchanged.
  Where:
  - `src/features/busMix/hooks/useMeterSubscription.ts`
  - `src/features/busMix/utils/meterStreamRouting.ts`
  - `src/features/busMix/utils/meterDecoder.ts`
  - `src/features/busMix/hooks/useBusMix.ts`
  - `src/features/busMix/services/BusMixService.ts`
  Depends on: T-003
  Reuses: existing meter tests and BusMix tests.
  Done when: Git diff shows no unintended meter runtime edits and BusMix tests pass.
  Tests:
  ```sh
  yarn jest __tests__/features/busMix --runInBand
  yarn jest __tests__/features/busGroups --runInBand
  yarn tsc
  ```
  Gate: All listed commands pass.

  Implementation result: Completed. Meter runtime files were not edited by the rollback. Local fader send path remains in `sendLevelOnly`, `enqueueFaderSend`, and `applyCommittedLevel`.

  Verification result: BusMix, BusGroups, and TypeScript gates passed.

- [x] T-007: Mark removed features as undone in specs and state
  Reqs: REQ-009, REQ-010
  What: Update local/global state and the affected feature task files to mark `remote-fader-subscription-sync` and `remote-fader-fluidity-performance` as reverted/undone due to real-device performance regression. Keep historical docs for traceability, but make the current product state unambiguous.
  Where:
  - `.specs/project/STATE.md`
  - `src/features/busMix/.specs/STATE.md`
  - `src/features/busMix/.specs/feature/remote-fader-subscription-sync/tasks.md`
  - `src/features/busMix/.specs/feature/remote-fader-fluidity-performance/tasks.md`
  - new log under `logs/`
  Depends on: T-002 through T-006
  Reuses: existing log/state conventions.
  Done when: State docs no longer describe either feature as active implementation; they describe both as intentionally reverted.
  Tests: `git diff --check`.
  Gate: Rollback log exists and states Local Network permission was preserved.

  Implementation result: Completed. Local/global state and both affected feature task files mark the implementations as rollback targets/reverted. Rollback log created at `logs/2026-05-25_20-56-39-busmix-remote-fader-sync-rollback-performance-restore-implementation.txt`.

  Verification result: `git diff --check` passed.

- [ ] T-008: Real-device performance validation after rollback
  Reqs: REQ-001 through REQ-012
  What: Validate on the real console and the device/emulator that felt slow. Compare against the smoother previous build if available. Focus on overall BusMix smoothness and meter smoothness, not just remote fader mirroring.
  Where: Manual UAT; update local/global state and create UAT log.
  Depends on: T-007
  Reuses: ConsoleDiscovery real-console flow and existing BusMix manual UAT steps.
  Done when: User confirms the app feels closer to the previous smoother build, Local Network permission still appears/works, console discovery works first try, meters remain fluid, and local fader control remains responsive.
  Tests: Manual only.
  Gate: UAT complete or explicitly blocked with reason.

## Implementation Notes

- Do not use `git reset --hard`.
- Do not broad-checkout `HEAD~1` because that risks removing unrelated improvements and user work.
- Preserve Local Network permission prompt/preflight.
- Preserve `aux-fx-meter-stability`.
- Prefer restoring lightweight receive behavior before attempting any new remote-fader sync design.
- A future remote-fader sync should be feature-flagged and benchmarked against the restored baseline.
