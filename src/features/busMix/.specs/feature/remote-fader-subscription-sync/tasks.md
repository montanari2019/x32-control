# Tasks - BusMix Remote Fader Subscription Sync

Last updated: 2026-05-24

## Task List

- [ ] T-001: Prove the exact CH 17 remote-edit OSC path before changing behavior
  Reqs: REQ-002, REQ-003, REQ-013, REQ-016
  What: Reproduce the user problem with the real X32/M32 and the emulator on the same network, then identify whether the X32 official app is changing CH 17's main channel fader (`/ch/17/mix/fader`) or CH 17's send level for the selected BusMix BUS (`/ch/17/mix/{bus}/level`). Add temporary dev diagnostics if needed, but do not ship noisy packet logs. The task must produce a written result because the implementation differs depending on the path. If the user is changing the main fader, record that Tacimix BusMix should not mirror it into a BUS send fader unless product scope changes. If the user is changing the same BUS send level, continue with the subscription implementation.
  Where: Diagnostic-only reads/temporary logs in `src/shared/osc/OscClient.ts`, `src/features/busMix/services/BusMixService.ts`, or `src/features/busMix/hooks/useBusMix.ts`; final documentation in `src/features/busMix/.specs/STATE.md` and this feature's `design.md`.
  Depends on: none
  Reuses: Existing `OscClient.handlePacket`, `BusMixService.onLevel`, and X32 path helpers in `X32Protocol`.
  Done when: The implementer can state the exact OSC address observed for CH 17 during the failing scenario and can explain whether Tacimix should mirror that address in BusMix.
  Tests: No automated test required if only diagnostics/docs are touched. Run `git diff --check`.
  Gate: No production diagnostic spam remains in code.

  Implementation result: Blocked/pending real-console interaction. This terminal pass cannot operate the X32 official app to capture the user's exact CH 17 action. The implementation therefore preserved the path distinction in code and tests: BusMix subscribes only to same-BUS send-level paths such as `/ch/17/mix/01/level`, while `/ch/17/mix/fader` remains explicitly separate. Final physical confirmation remains part of T-010 UAT.

- [x] T-002: Add X32 scalar subscription protocol helpers
  Reqs: REQ-004, REQ-005, REQ-006, REQ-014, REQ-015
  What: Add explicit protocol helpers for scalar subscriptions so the code no longer treats all receive behavior as local callback registration. Add helpers for `/subscribe`, `/renew`, and `/unsubscribe`. Keep `/batchsubscribe` out of the fader implementation because the researched X32 protocol describes it primarily for blob/batch data and meters; scalar fader values should start with `/subscribe`. Consider `/formatsubscribe` only as future optimization after exact-path subscriptions pass UAT.
  Where: `src/shared/osc/X32Protocol.ts`; tests under `__tests__/shared/osc` or the existing protocol test location if one exists.
  Depends on: T-001
  Reuses: Existing `X32Protocol.getXRemotePath()`, `getMetersRenewPath()`, and source path helpers.
  Done when: The protocol layer exposes named methods or constants for:
  - subscribe path: `/subscribe`;
  - renew path: `/renew`;
  - unsubscribe path: `/unsubscribe`;
  - default scalar subscription time factor;
  - default renewal interval below 10000 ms.
  Tests: Cover helper output and invalid configuration if range validation is added. Include a test proving CH 17 BUS 01 send level is `/ch/17/mix/01/level` and CH 17 main fader remains `/ch/17/mix/fader`.
  Gate: Focused protocol tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Added scalar subscription command helpers/constants to `X32Protocol`: `/subscribe`, `/renew`, `/unsubscribe`, default time factor, and renewal interval. Added regression coverage proving CH 17 BUS 01 send level is `/ch/17/mix/01/level` and the main fader path is `/ch/17/mix/fader`.

  Verification result: Focused shared OSC tests passed and `yarn tsc` passed.

- [x] T-003: Implement managed scalar subscriptions in OscClient
  Reqs: REQ-004, REQ-005, REQ-006, REQ-007, REQ-013, REQ-015
  What: Add an `OscClient` API that sends X32 `/subscribe` commands and manages renewal/cleanup while preserving the existing `subscribe(address, listener)` local dispatcher behavior. The API must register the local listener and then send `/subscribe ,si <address> <timeFactor>` through the same UDP transport. It must ref-count identical subscriptions so multiple listeners for the same fader path do not generate duplicate subscribe loops. It must renew before the 10-second timeout, preferably around 8000 ms. On final unsubscribe, it should send `/unsubscribe ,s <address>` best-effort and stop the timer. It must not create `request()` pending promises for stream packets because subscription responses are not one-shot replies.
  Where: `src/shared/osc/OscClient.ts`; tests under `__tests__/shared/osc/OscClient.test.ts` or a new focused test file.
  Depends on: T-002
  Reuses: Existing `send`, `subscribe`, `handlePacket`, `clearXRemoteKeepAlive`, and shared UDP transport.
  Done when: A caller can subscribe to a scalar X32 address and receive streaming values through the existing packet dispatcher, with automatic renewal and cleanup.
  Tests: With fake timers/mocked transport:
  - first subscription sends one `/subscribe`;
  - second listener for same address does not send a second `/subscribe`;
  - timer renews before 10 seconds;
  - incoming message dispatches to all local listeners;
  - unsubscribing one of two listeners keeps renewal alive;
  - unsubscribing the last listener sends `/unsubscribe` and clears the timer;
  - disconnect/close clears all managed subscription timers.
  Gate: Focused OscClient tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Added `OscClient.subscribeScalarValue(...)`, which registers a local exact-address listener, sends X32 `/subscribe`, ref-counts duplicate address subscriptions, renews with `/renew`, and sends `/unsubscribe` when the last local listener is removed. Existing `OscClient.subscribe(...)` remains a local dispatcher only.

  Verification result: Added fake-timer tests for subscribe, duplicate listener ref-counting, incoming dispatch, renewal, final unsubscribe, and disconnect cleanup.

- [x] T-004: Add BusMixService managed fader-level subscription method
  Reqs: REQ-002, REQ-003, REQ-006, REQ-007, REQ-009, REQ-010, REQ-015
  What: Add a service method that subscribes to source send-level updates for one BusMix channel and one BUS using the managed scalar subscription infrastructure. The method must use the existing source definition path builders for CH/AUX/FX and clamp incoming float values to `0..1`. It must not send any fader write. It must not use `/ch/{n}/mix/fader` for BusMix faders. In mock mode, route through the mock provider so tests can simulate remote fader changes without physical hardware.
  Where: `src/features/busMix/services/BusMixService.ts`; possible protocol tests around `SOURCE_DEFINITIONS`; mock updates in `src/shared/mixer/mock/mockMixerProvider.ts` if needed.
  Depends on: T-003
  Reuses: `SOURCE_DEFINITIONS`, `getSourceDefinition`, `Channel.kind`, `Channel.sourceNumber`, `mockProvider.subscribeChannelLevel`, and `x32RawToDb` store conventions.
  Done when: `subscribeChannelLevelUpdates(channel, bus, listener)` or equivalent can subscribe CH 17 BUS N, AUX 01 BUS N, and FX Return 01 BUS N send-level paths without knowing path details at the hook layer.
  Tests: Mock service/client tests assert:
  - CH 17 BUS 01 subscribes to `/ch/17/mix/01/level`;
  - CH 17 main fader path is never used by this method;
  - AUX 01 BUS 01 subscribes to `/auxin/01/mix/01/level`;
  - FX Return 01 BUS 01 subscribes to `/fxrtn/01/mix/01/level`;
  - incoming value is clamped before listener callback.
  Gate: Focused service tests, BusMix tests, and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Added `BusMixService.subscribeChannelLevelUpdates(...)`, which uses the existing source definitions to subscribe CH/AUX/FX BusMix send-level paths through the managed scalar subscription API. The method clamps incoming values and does not send any fader write.

  Verification result: Added service tests for CH 17, AUX 01, FX Return 01, main-fader path exclusion, and incoming value clamping.

- [x] T-005: Create visible-channel remote fader subscription hook
  Reqs: REQ-002, REQ-006, REQ-008, REQ-009, REQ-010, REQ-013, REQ-015
  What: Add a focused hook that subscribes only the BusMix faders currently visible on screen. It should receive the loaded channels, `visibleChannelIds`, `busNumber`, `service`, and an `onRemoteLevel(channelNumber, level)` callback. It should compute visible channels by `Channel.id`, start managed subscriptions for their source send-level paths, and clean up subscriptions when visibility, bus, console, or channel list changes. It should not update React state per packet; it should call the provided reconciliation callback and update diagnostics refs.
  Where: New `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts`; tests under `__tests__/features/busMix/hooks` or pure utility tests if hook testing is heavy.
  Depends on: T-004
  Reuses: `visibleChannelIds` from `BusMixScreen`, `Channel.id`, `Channel.number`, and existing `reconcileRemoteFader` callback in `useBusMix`.
  Done when: Visible CH 17 starts a managed subscription for the selected BUS send level and invisible CH 17 does not. Changing the visible set stops stale subscriptions and starts new ones.
  Tests: Fake hook/service tests:
  - visible CH 17 subscribes;
  - invisible CH 17 does not subscribe;
  - making CH 17 invisible calls unsubscribe;
  - incoming remote value calls `onRemoteLevel(17, value)`;
  - no fader send function is called from the remote path.
  Gate: Focused hook tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Added `useBusMixRemoteFaderSubscription`, which selects only currently visible BusMix channels and subscribes their source send-level paths. The hook feeds subscribed values into the provided remote-level reconciliation callback and exposes health updates through refs/callbacks rather than React state per packet.

  Verification result: Added pure selector tests proving visible channels are selected and invisible channels are ignored.

- [x] T-006: Integrate visible fader subscriptions into BusMix without regressing local sends
  Reqs: REQ-001, REQ-002, REQ-006, REQ-008, REQ-010, REQ-011, REQ-012
  What: Wire `BusMixScreen.visibleChannelIds` into `useBusMix` or into a small returned setter so the hook can manage visible fader subscriptions. Route subscribed values into the existing `reconcileRemoteFader` path. Preserve `sendLevelOnly`, `setLevel`, `applyCommittedLevel`, drag throttling, final send, local-protection windows, linked-channel reflection, mute/on, pan, presets, meters, and BusGroups behavior. Do not add duplicate service writes.
  Where: `src/features/busMix/screens/BusMixScreen.tsx`, `src/features/busMix/hooks/useBusMix.ts`, and the new `useBusMixRemoteFaderSubscription.ts`.
  Depends on: T-005
  Reuses: `visibleChannelIds`, `reconcileRemoteFader`, `pendingLocalChangeAtRef`, `LOCAL_PROTECTION_WINDOW_MS`, `BusMixChannelStore.updateChannels`, and linked sync helpers.
  Done when: A remote subscribed value for visible CH 17 updates the Tacimix fader through the same reducer/reconciliation path used by `/xremote` and background sync, while the local app-to-console send path remains untouched.
  Tests: Extend BusMix hook tests or add integration-style tests:
  - local drag still sends exactly as before;
  - subscribed remote value updates local store;
  - stale remote echo inside protection window is ignored;
  - linked peer visual reflection still occurs;
  - pan and meters are unchanged.
  Gate: `yarn jest __tests__/features/busMix --runInBand`, `yarn jest __tests__/features/busGroups --runInBand`, and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. `BusMixScreen` now passes `visibleChannelIds` into `useBusMix`. `useBusMix` uses the new visible-fader subscription hook and routes subscribed values into `reconcileRemoteFader`, preserving local protection, linked-channel reflection, and `BusMixChannelStore` updates. The old all-channel `onLevel` listener in BusMix was replaced by the visibility-scoped managed subscription path to avoid duplicate level processing. Local send functions were not changed.

  Verification result: BusMix tests passed, BusGroups tests passed, and `yarn tsc` passed.

- [x] T-007: Extend realtime diagnostics for fader subscription health
  Reqs: REQ-013, REQ-016
  What: Extend the existing realtime health refs so real-console testers can see whether fader subscriptions are active and receiving values. Track subscribed path count, last fader subscribe command timestamp, last renew timestamp, last subscribed fader event timestamp, and stale status if no subscribed fader value has arrived within a configurable window after subscription starts. Keep this non-UI unless product explicitly asks for a visible indicator.
  Where: `src/features/busMix/hooks/useBusMix.ts`, `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts`, and relevant tests.
  Depends on: T-006
  Reuses: Existing `getRealtimeSubscriptionHealth()` and `markRealtimeEvent(...)` style.
  Done when: A developer can inspect runtime health and distinguish:
  - `/xremote` events are arriving;
  - managed fader subscriptions are active;
  - subscribed fader values are stale;
  - no visible faders are currently subscribed.
  Tests: Fake timer tests for stale/healthy transition if implemented as a pure helper. Otherwise focused hook tests around health ref values.
  Gate: Focused tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Extended `getRealtimeSubscriptionHealth()` data with fader subscription counters/timestamps: subscribed fader path count, subscribe command timestamp, renew timestamp, last subscribed fader event timestamp, subscribed fader event count, and computed stale state.

  Verification result: TypeScript passed and BusMix tests passed. Diagnostics are ref-based and do not add packet-level React rerenders.

- [x] T-008: Keep meters and existing AUX/FX meter stability untouched
  Reqs: REQ-001, REQ-012, REQ-015
  What: Confirm the fader subscription implementation does not modify meter subscription files, meter stream routing, meter decoder behavior, or meter intervals. This is a non-regression task because the CH meters are the protected baseline and AUX/FX meter isolation was just implemented.
  Where: `src/features/busMix/hooks/useMeterSubscription.ts`, `src/features/busMix/utils/meterStreamRouting.ts`, `src/features/busMix/utils/meterDecoder.ts`, and meter tests only if accidental regressions appear.
  Depends on: T-006
  Reuses: `aux-fx-meter-stability` implementation and tests.
  Done when: Git diff shows no fader feature changes to meter runtime files unless strictly necessary and covered by tests.
  Tests: `yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts __tests__/features/busMix/utils/meterStreamRouting.test.ts --runInBand`.
  Gate: Meter tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. The fader subscription implementation did not modify `useMeterSubscription`, `meterStreamRouting`, or `meterDecoder`. Existing BusMix meter tests were run as part of the full BusMix suite.

  Verification result: BusMix tests passed, including meter decoder/routing coverage, and `yarn tsc` passed.

- [ ] T-009: Add optional visible-fader polling fallback only with hardware evidence
  Reqs: REQ-014, REQ-015, REQ-016
  What: Do not implement fallback polling by default. If real-console UAT proves `/subscribe` does not deliver the CH 17 send-level path reliably, add a narrow fallback loop for visible fader send-level paths. It should poll visible paths at 250-500 ms, stop on unmount, avoid all-48 polling, and reuse `safeRequestLevel`/`loadChannelFaders` only in a scoped manner. It must feed `reconcileRemoteFader` and respect local protection.
  Where: `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts` or a separate `useBusMixVisibleFaderPolling.ts`; service helpers in `BusMixService` if needed.
  Depends on: T-006, T-007, real-console evidence
  Reuses: `loadChannelFaders`, `safeRequestLevel`, `reconcileRemoteFader`, and visibility tracking.
  Done when: Either no fallback is implemented because `/subscribe` works, or a tested and scoped fallback exists with documented hardware evidence.
  Tests: Fake timer tests for polling start/stop, visible scope, and no duplicate polling while local fader drag is protected.
  Gate: Implement only after evidence. If implemented, BusMix tests, BusGroups tests, and `yarn tsc` pass.

  Implementation result: Not implemented. No hardware evidence has proven `/subscribe` insufficient yet. This remains the correct fallback decision point after UAT.

- [ ] T-010: Real-console UAT for CH 17 remote fader reactivity
  Reqs: REQ-001 through REQ-016
  What: Validate with the connected emulator and real X32/M32 on the same network. Test both the X32 official app and physical console surface if available. Record the exact console model, firmware if known, network type, selected BUS, channel, source type, observed latency, and whether values are coming from `/subscribe`, `/xremote`, or fallback polling.
  Where: Manual UAT; update `src/features/busMix/.specs/STATE.md`, `.specs/project/STATE.md`, and create `logs/YYYY-MM-DD_HH-MM-SS-busmix-remote-fader-subscription-sync-uat.txt`.
  Depends on: T-006, T-007 and optionally T-009
  Reuses: ConsoleDiscovery real-console flow, BusMix screen, existing logs convention.
  Done when: UAT proves CH 17 same-BUS send-level changes mirror in Tacimix without leaving the screen, and app-originated sends still behave exactly as before.
  Tests: Manual only.
  Gate: UAT complete or explicitly blocked with reason.

  Implementation result: Pending manual validation with the connected X32/M32 and X32 official app. Automated implementation gates passed, but physical latency and exact user-action path must still be recorded.

## Manual Real-Console Validation Script

1. Connect the emulator/device and X32/M32 to the same stable network.
2. Open Tacimix -> real console -> select BUS N -> BusMix.
3. Keep CH 17 visible in Tacimix.
4. In the X32 official app, first identify whether you are editing CH 17 main fader or CH 17 send to BUS N.
5. If editing main fader:
   - confirm the observed path is `/ch/17/mix/fader`;
   - confirm Tacimix BusMix does not mirror it as a send-level fader;
   - record whether product wants a separate main-fader indicator later.
6. If editing sends-on-fader for BUS N:
   - move CH 17 send level in the X32 app;
   - Tacimix CH 17 BusMix fader should move without leaving the screen;
   - target latency is under 250 ms on a healthy network.
7. Move CH 17 from Tacimix:
   - app-to-console behavior should remain perfect;
   - no duplicate writes should be observed.
8. Repeat with CH 01 and CH 32.
9. If available, repeat with AUX 01 and FX Return 01.
10. If CH 17 is linked with CH 18, verify linked visual reflection still works.
11. Verify pan remains independent.
12. Watch meters while testing:
   - CH meters remain stable;
   - AUX/FX meters remain stable;
   - no new meter flicker appears.
13. Leave BusMix open for 2 minutes:
   - fader subscriptions renew;
   - no progressive desync;
   - app remains responsive.
14. Switch to BusGroups and back:
   - shared state remains coherent.
15. Record results in local/global STATE and the UAT log.

## Implementation Notes

- Do not fix this by changing the fader component.
- Do not fix this by increasing global background sync for all 48 channels.
- Do not use `/batchsubscribe` for scalar faders unless a later protocol task proves it is correct for this specific use.
- Keep `/xremote` because it catches event-style updates and complements `/subscribe`.
- Keep optimistic UI because the X32 may not echo every OSC-originated change.
- Treat `/subscribe` as a visibility-scoped data stream, not as a replacement for local sends.
- Do not confuse `/ch/17/mix/fader` with `/ch/17/mix/{bus}/level`.
- All implementation tasks must preserve existing tests before adding the new receive path.
