# Tasks - BusMix Realtime Console Reactivity

Last updated: 2026-05-24

## Task List

- [ ] T-001: Document and protect the current OSC send/receive baseline
  Reqs: REQ-001, REQ-003, REQ-004, REQ-011, REQ-012
  What: Before changing behavior, create a concise implementation baseline in code comments/tests or a developer note proving how the current send and receive paths work. Confirm that `BusMixService.connect()` acquires `SharedOscClient`, starts `/xremote`, and that `useMeterSubscription` owns meter-specific `/meters` renew behavior separately. This task should identify the exact files that must not regress and record current intervals: fader send throttle, xremote renewal, meter renewal, background fader sync, and shared-client release delay.
  Where: Read/update only if needed: `src/shared/osc/OscClient.ts`, `src/shared/osc/SharedOscClient.ts`, `src/features/busMix/services/BusMixService.ts`, `src/features/busMix/hooks/useBusMix.ts`, `src/features/busMix/hooks/useMeterSubscription.ts`, `.specs/codebase/INTEGRATIONS.md`, and this feature's `design.md` if discoveries differ.
  Depends on: none
  Reuses: Existing `startXRemoteKeepAlive`, `stopXRemoteKeepAlive`, `acquireSharedOscClient`, `BusMixChannelStore`, and meter hook separation.
  Done when: The implementer can state exactly which code path sends to the console, which code path receives from the console, where `/xremote` is kept alive, and why meter traffic is out of scope for this feature.
  Tests: No code test required if no code changes. If docs/state are touched, run `git diff --check`.
  Gate: No functional code changed or, if changed, `yarn tsc` passes.

- [ ] T-002: Add pure linked-channel sync helpers for BusMix state updates
  Reqs: REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-014, REQ-016
  What: Create deterministic helper functions that update BusMix channel arrays for linked channel behavior without touching OSC transport. The helpers must update linked peers for level and on changes, never mirror pan, and support both local-originated and remote-originated update metadata. They must be able to update all fader fields consistently (`faderRaw`, `faderDb`, `localFaderRaw`, `remoteFaderRaw`, `level`, `isDirty`, `lastLocalChangeAt`) according to whether the update is local, remote, or background reconciliation.
  Where: Add `src/features/busMix/utils/linkedChannelSync.ts`. Add tests under `__tests__/features/busMix/utils/linkedChannelSync.test.ts`.
  Depends on: T-001
  Reuses: `Channel`, `x32RawToDb`, existing `channelLinkMapRef` semantics, and `BusMixChannelStore.updateChannels` data shape.
  Done when: A single helper call can update channel N and its linked peer for level/on, while pan only updates channel N. The helper must work if the peer is absent from the current list. The helper must be idempotent if events arrive for both linked sides.
  Tests: Cover unlinked level, linked level from left, linked level from right, linked mute/on, pan exclusion, peer missing, and duplicate linked events. Run `yarn jest __tests__/features/busMix/utils/linkedChannelSync.test.ts --runInBand`.
  Gate: Focused helper tests pass and `yarn tsc` passes.

- [ ] T-003: Apply linked visual reflection to local BusMix sends without duplicate OSC writes
  Reqs: REQ-001, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-016
  What: Integrate the linked sync helpers into local user actions in `useBusMix`. When the user moves a linked channel fader, update both linked visual peers in `BusMixChannelStore` immediately, but keep the existing OSC send directed to the touched channel only. When the user toggles mute/on on a linked channel, centralize the existing local linked on update through the new helper. Keep pan as single-channel only. Preserve `sendLevelOnly`, `setLevel`, `applyCommittedLevel`, `applyCommittedOn`, `setPan`, throttling, final send on release, and local protection semantics.
  Where: `src/features/busMix/hooks/useBusMix.ts`; possibly `src/features/busMix/services/BusMixService.ts` only if a clean service-level helper is required, but avoid changing wire commands.
  Depends on: T-002
  Reuses: `channelLinkMapRef`, `pendingLocalChangeAtRef`, `LOCAL_PROTECTION_WINDOW_MS`, `enqueueFaderSend`, `sendFaderImmediately`, `service.setChannelFader`, `service.setChannelOn`, `service.setChannelPan`.
  Done when: For a linked CH pair, local fader drag on either side updates both faders visually while sending only one fader command to the console. Local mute/on toggles update both peers visually. Pan still changes only the selected channel. Existing optimistic UI remains smooth.
  Tests: Extend or add hook/service tests with mocked linked map and mocked service sends. Assert one OSC/service write for a fader action, two visual channel updates in store, and no pan peer update. Run focused tests plus `yarn jest __tests__/features/busMix --runInBand`.
  Gate: Focused tests, BusMix tests, and `yarn tsc` pass.

- [ ] T-004: Apply linked visual reflection to console-originated level/on events
  Reqs: REQ-002, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-013, REQ-016
  What: Update the remote receive handlers so when X32 sends a level or on event for one linked side, the app updates the peer visually too. This must use the same pure helpers as local sends. Remote fader reconciliation must still respect the existing local-protection window so delayed remote echo cannot pull a recently dragged fader backwards. If both linked sides send events, the updates must remain idempotent and avoid flicker.
  Where: `src/features/busMix/hooks/useBusMix.ts`, specifically `reconcileRemoteFader`, `reconcileRemoteOn`, and the `service.onLevel/onOn` subscription setup.
  Depends on: T-002, T-003
  Reuses: `service.onLevel`, `service.onOn`, `pendingLocalChangeAtRef`, `channelLinkMapRef`, `BusMixChannelStore.updateChannels`.
  Done when: A synthetic remote event for one side of a linked pair updates both visual peers for level/on. A synthetic remote pan event, if introduced later, does not mirror. Recently changed local faders remain protected from stale remote values.
  Tests: Add tests around remote event application if hook tests are feasible. Otherwise extract remote reducers to pure helpers and test them. Include cases for late echo inside and outside `LOCAL_PROTECTION_WINDOW_MS`.
  Gate: Focused tests, BusMix tests, BusGroups tests, and `yarn tsc` pass.

- [ ] T-005: Add pan receive support without linked mirroring
  Reqs: REQ-002, REQ-008, REQ-009, REQ-014, REQ-016
  What: Evaluate and add service-level pan subscription for BusMix source send pan paths so console-originated pan changes can update the selected channel's visual state. Do not mirror pan to linked peers. This keeps remote reactivity complete while preserving stereo left/right behavior.
  Where: `src/features/busMix/services/BusMixService.ts` add `onPan(channel, bus, listener)` if source path helpers already exist. `src/features/busMix/hooks/useBusMix.ts` subscribe and reconcile pan. Tests under BusMix hook/service utilities.
  Depends on: T-002, T-004
  Reuses: Existing `source.getPanPath`, `x32PanToPercent`, `percentToX32Pan`, `PanControlModal` behavior, `Channel.pan`.
  Done when: A console-originated pan event updates only the matching channel's `pan` value in store. Linked peer pan is unchanged. Existing app-originated pan writes still use `percentToX32Pan`.
  Tests: Focused pan receive test: linked pair receives pan for left, only left changes; right remains unchanged. Run `yarn jest __tests__/shared/x32/pan.test.ts --runInBand` and BusMix tests.
  Gate: Focused tests and `yarn tsc` pass.

- [ ] T-006: Add subscription health and diagnostics for real-console validation
  Reqs: REQ-002, REQ-003, REQ-004, REQ-012, REQ-013
  What: Track enough receive-side health to know whether the app is actually receiving timely X32 events. At minimum, record last OSC event timestamp, last BusMix level/on event timestamp, and stale status if no relevant event is received for a configurable threshold after subscription starts. This should be lightweight and should not cause rerenders per packet. It may be dev-only state, a ref exposed from a hook, or structured log diagnostics. Avoid user-facing UI unless product explicitly asks later.
  Where: Prefer a new `src/features/busMix/hooks/useBusMixRealtimeSync.ts` if extraction is introduced; otherwise keep refs inside `useBusMix.ts`. Logging can reuse existing app log patterns if available.
  Depends on: T-004
  Reuses: `OscClient.subscribe`, `startXRemoteKeepAlive`, `SharedOscClient`, existing silent background sync behavior.
  Done when: Real-console testers can tell whether `/xremote`/subscriptions are alive without packet capture. Stale detection does not spam state updates or logs.
  Tests: Unit test stale/healthy transition with fake timers if implemented as a pure helper/hook utility.
  Gate: Focused tests and `yarn tsc` pass.

- [ ] T-007: Evaluate AUX/FX link-map support and extend only if protocol paths are verified
  Reqs: REQ-014, REQ-015, REQ-016
  What: Current code only fetches CH 01..32 link pairs through `/config/chlink/{left}-{right}`. Research shows X32 scene data has `/config/auxlink` and `/config/fxlink`, but implementation must verify the exact query paths and response shape before using them. Add protocol helpers and link map support for AUX/FX only if the path contract is confirmed in code or docs. If not confirmed, document CH-only support and keep behavior stable.
  Where: `src/shared/osc/X32Protocol.ts`, `src/features/busMix/services/BusMixService.ts`, `src/features/busMix/types/Channel.ts` only if needed, and tests under `__tests__/shared/osc` or `__tests__/features/busMix/services`.
  Depends on: T-002
  Reuses: Existing `fetchChannelLinkMap`, `SOURCE_DEFINITIONS`, `Channel.kind`, absolute channel numbering.
  Done when: Either AUX/FX link maps are safely supported with tests, or the implementation explicitly records CH-only support and does not guess unsupported paths.
  Tests: Protocol helper tests for valid pair paths and invalid ranges. Service tests with mocked responses if supported.
  Gate: Tests and `yarn tsc` pass. No fabricated protocol paths.

- [ ] T-008: Add optional focused linked-pair reconciliation fallback
  Reqs: REQ-002, REQ-013, REQ-014, REQ-016
  What: Only if T-003/T-004 still leave visible drift during real-console validation, add a narrow reconciliation loop for linked pairs while BusMix is visible. This loop must query or refresh only active BUS level/on values for linked pairs, not all app parameters, and must stop on unmount. It must not replace `/xremote`; it is a UDP-loss safety net. Start conservative, e.g. 1000-2000 ms, and make the interval easy to tune.
  Where: `src/features/busMix/hooks/useBusMix.ts` or extracted `useBusMixRealtimeSync.ts`; `BusMixService` may need focused request helpers for level/on if existing `loadChannelFaders` is too broad.
  Depends on: T-004, T-006, real-console validation evidence
  Reuses: Existing `safeRequestLevel`, `safeRequestOn`, `loadChannelFaders`, `requestMessage`, and `BusMixChannelStore.updateChannels`.
  Done when: Linked visual drift self-heals quickly without increasing meter traffic or causing visible UI jitter.
  Tests: Fake timer tests for start/stop and request scope. Ensure no polling occurs when no linked pairs exist.
  Gate: Implement only with evidence. If implemented, focused tests, BusMix tests, BusGroups tests, and `yarn tsc` pass.

- [ ] T-009: Build mock-console scenarios for linked channel reactivity
  Reqs: REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-016
  What: Extend mock provider or tests so the app can simulate linked CH pairs without physical console. It must simulate both local command effects and remote events. The mock should be able to demonstrate the bug: one side changes audibly/logically while the other visual side would stay stale unless linked reflection is applied.
  Where: `src/shared/mixer/mock/mockMixerProvider.ts`, `src/shared/mixer/mock/demoMixerProvider.ts` if needed, and BusMix tests.
  Depends on: T-002
  Reuses: Existing mock subscription APIs: `subscribeChannelLevel`, `subscribeChannelOn`, meter mocks, and BusMix store tests.
  Done when: Tests can reproduce and verify linked fader/on reflection without real hardware. Demo console may optionally include at least one linked pair for manual simulator validation.
  Tests: Mock provider tests and BusMix hook/store tests.
  Gate: Tests pass and Demo behavior remains stable.

- [ ] T-010: Real-console UAT checklist and final state update
  Reqs: REQ-001 through REQ-016
  What: When physical X32/M32 access is available, run a structured validation pass. Confirm app-originated and console-originated updates for linked fader and mute/on with CH L/R pairs, pan exclusion, meters, presets, BusGroups, and network health diagnostics. Record results in local `STATE.md`, global `.specs/project/STATE.md`, and a dated log file.
  Where: Manual testing; update `src/features/busMix/.specs/STATE.md`, `.specs/project/STATE.md`, and `logs/YYYY-MM-DD_HH-MM-SS-busmix-realtime-console-reactivity-uat.txt`.
  Depends on: T-003, T-004, T-005, T-006, and optionally T-008/T-009
  Reuses: Demo/manual app flow, real console selected through ConsoleDiscovery, existing logs convention.
  Done when: UAT records exact console model/firmware if available, network type, linked-pair setup, observed latency, pass/fail for each acceptance criterion, and any remaining risks.
  Tests: Manual only.
  Gate: UAT complete or explicitly marked blocked due lack of hardware.

## Manual Real-Console Validation Script

1. Connect phone and X32/M32 to the same stable network.
2. Confirm no unrelated network scanner/debug session is flooding UDP.
3. On the console, link a channel pair such as CH 01/02.
4. Route or label them as a stereo source such as Guitar L/R.
5. Open Tacimix -> real console -> target BUS -> BusMix.
6. Move CH 01 fader in the app:
   - CH 01 visual fader moves immediately;
   - CH 02 visual fader follows immediately;
   - audible console result remains correct;
   - only the touched channel command should be sent unless a later task intentionally changes this.
7. Move CH 02 fader in the app:
   - CH 02 visual fader moves immediately;
   - CH 01 visual fader follows immediately.
8. Toggle CH 01 mute/on in the app:
   - both linked visual peers update.
9. Toggle CH 02 mute/on in the app:
   - both linked visual peers update.
10. Change pan on CH 01:
   - only CH 01 pan changes visually;
   - CH 02 pan remains independent.
11. Move linked fader from the console surface:
   - both visual peers update in the app with low latency.
12. Toggle mute from the console surface:
   - both visual peers update in the app with low latency.
13. Keep BusMix open for at least 2 minutes:
   - no visible desync accumulates;
   - meters continue rendering;
   - app remains responsive.
14. Switch to BusGroups and back:
   - shared state remains coherent.
15. Save/restore preset:
   - no regression in preset flow.

## Implementation Notes

- Do not solve this by increasing global polling aggressively.
- Do not fold meters into the linked-channel sync hook.
- Do not remove the existing optimistic send path.
- Prefer pure reducer/helper tests over fragile component touch tests.
- Treat `/xremote` as necessary but not sufficient: local reflection is required because OSC-originated linked changes may not echo fully.
- Keep every task small enough to revert independently if real-console behavior differs by firmware.
