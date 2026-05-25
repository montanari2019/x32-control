# Tasks - BusMix AUX/FX Meter Stability

Last updated: 2026-05-24

## Task List

- [x] T-001: Lock CH 01-32 meters as the non-regression baseline
  Reqs: REQ-001, REQ-007, REQ-009, REQ-010
  What: Capture the current CH 01..32 meter behavior as the baseline that must not change. Identify the existing decoder tests, hook behavior, meter component behavior, and meter stream subscription path that make CH meters correct today. Add or strengthen tests only if needed to ensure `/meters/1` channel indexes 1..32 remain unchanged.
  Where: `__tests__/features/busMix/utils/meterDecoder.test.ts`, `src/features/busMix/utils/meterDecoder.ts`, `src/features/busMix/hooks/useMeterSubscription.ts`, `src/features/busMix/components/ChannelVuMeter.tsx`.
  Depends on: none
  Reuses: Existing `decodeMeter1BlobForChannel`, `ChannelVuMeter`, `getMeterFillRatios`, and current `/meters/1` request/renew behavior.
  Done when: There is explicit test coverage or documented proof that CH 01, CH 16, CH 17, and CH 32 still decode from `/meters/1` exactly as before.
  Tests: `yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts --runInBand`.
  Gate: Existing CH meter tests pass before any AUX/FX fix is applied.

  Implementation result: Completed on 2026-05-24. Added explicit CH baseline coverage for CH01, CH16, CH17, and CH32 in `meterDecoder.test.ts`; runtime CH decoder behavior was not changed.

  Verification result: focused meter tests passed; BusMix suite passed; `yarn tsc` passed.

- [x] T-002: Add explicit meter stream classification helpers
  Reqs: REQ-004, REQ-005, REQ-006, REQ-010, REQ-011
  What: Add small pure helpers that encode BusMix meter stream ownership: CH IDs `1..32` belong to `/meters/1`; AUX/FX IDs `33..48` belong to `/meters/13`. This prevents future code from dispatching one stream to the wrong channel family. The helpers should make invalid ranges explicit.
  Where: Prefer `src/features/busMix/utils/meterDecoder.ts` or a new `src/features/busMix/utils/meterStreamRouting.ts`; tests in `__tests__/features/busMix/utils/meterDecoder.test.ts` or `meterStreamRouting.test.ts`.
  Depends on: T-001
  Reuses: Current absolute BusMix channel IDs: CH `1..32`, AUX `33..40`, FX `41..48`.
  Done when: Code has named predicates or mapping helpers for `isInputChannelMeterId`, `isAuxFxMeterId`, and optionally `getMeterStreamForChannelId`.
  Tests: Cover IDs `0`, `1`, `32`, `33`, `40`, `41`, `48`, `49`.
  Gate: Focused routing tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Added `src/features/busMix/utils/meterStreamRouting.ts` with `isInputChannelMeterId`, `isAuxFxMeterId`, `getMeterStreamForChannelId`, and stream-specific decode/dispatch helpers.

  Verification result: `meterStreamRouting.test.ts` covers IDs `0`, `1`, `32`, `33`, `40`, `41`, `48`, and `49`.

- [x] T-003: Isolate `/meters/1` dispatch to CH 01-32 only
  Reqs: REQ-001, REQ-004, REQ-005, REQ-009, REQ-010
  What: Fix the likely flicker root cause by making the `/meters/1` handler ignore all listener IDs outside `1..32`. This must prevent AUX/FX listeners from decoding `/meters/1` gate/dynamics regions as if they were AUX/FX values. Do not change the `/meters/1` decoder math for CH 01..32.
  Where: `src/features/busMix/hooks/useMeterSubscription.ts`; tests through an extracted dispatcher helper if needed.
  Depends on: T-002
  Reuses: Existing `/meters/1` subscription, `decodeMeter1BlobForChannel`, `listenersRef`, visible-channel registration behavior.
  Done when: A registered AUX 01 listener does not receive any callback from a `/meters/1` blob, even if that blob has a loud value at index 32.
  Tests: Add a regression test that reproduces the current suspected bug: AUX 01 listener + `/meters/1` index 32 high value must produce zero AUX callback. Existing CH listener must still receive the same `/meters/1` callback.
  Gate: Regression test, BusMix tests, and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. `/meters/1` handler now routes through `dispatchMeterStreamBlob('meters1', ...)`, which ignores channel IDs outside `1..32`. This prevents AUX/FX listeners from reading `/meters/1` gate/dynamics data.

  Verification result: regression test proves AUX 01 is not called by `/meters/1` even when index 32 is loud, while CH 01 still receives the correct `/meters/1` value.

- [x] T-004: Keep `/meters/13` dispatch isolated to AUX/FX only
  Reqs: REQ-002, REQ-003, REQ-006, REQ-010, REQ-011
  What: Keep and formalize the existing `/meters/13` channel filter so only IDs `33..48` consume that stream. Add tests proving CH 01..32 listeners do not receive `/meters/13` updates. This protects CH meters from future regressions while fixing AUX/FX.
  Where: `src/features/busMix/hooks/useMeterSubscription.ts`; tests through extracted dispatcher helper if needed.
  Depends on: T-002
  Reuses: Existing `/meters/13` subscription and `decodeMeter13BlobForChannel`.
  Done when: `/meters/13` updates AUX/FX listeners only and never touches CH listeners.
  Tests: Register CH 01 and AUX 01 listeners, dispatch `/meters/13`, assert only AUX listener is called.
  Gate: Focused dispatch tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. `/meters/13` handler now routes through `dispatchMeterStreamBlob('meters13', ...)`, which ignores channel IDs outside `33..48`.

  Verification result: dispatch isolation test proves CH 01 is not called by `/meters/13`, while AUX 01 receives the correct value.

- [x] T-005: Strengthen AUX/FX `/meters/13` offset tests
  Reqs: REQ-002, REQ-003, REQ-006, REQ-010, REQ-011
  What: Expand decoder tests to cover the full BusMix AUX/FX boundaries inside `/meters/13`. The tests must prove that AUX 01, AUX 08, FX Return 01, and FX Return 08 map to the intended offsets and return stable values. Include a comment explaining that `/meters/13` includes 32 input channels before AUX/FX, so BusMix absolute channel IDs map directly through `channelId - 1`.
  Where: `__tests__/features/busMix/utils/meterDecoder.test.ts`, `src/features/busMix/utils/meterDecoder.ts`.
  Depends on: T-002
  Reuses: `decodeMeter13BlobForChannel`.
  Done when: Boundary tests for IDs `33`, `40`, `41`, and `48` pass and document the expected offsets.
  Tests: `yarn jest __tests__/features/busMix/utils/meterDecoder.test.ts --runInBand`.
  Gate: Decoder tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Added boundary tests for AUX 01 (`33`), AUX 08 (`40`), FX Return 01 (`41`), and FX Return 08 (`48`) inside the 48-float `/meters/13` blob.

  Verification result: focused meter decoder tests passed.

- [ ] T-006: Evaluate `/meters/3` as a fallback only if `/meters/13` remains unstable
  Reqs: REQ-002, REQ-003, REQ-006, REQ-008, REQ-012
  What: Do not switch to `/meters/3` blindly. First implement stream isolation for `/meters/1` and `/meters/13`. If real-console validation still shows AUX/FX flicker, evaluate `/meters/3`, whose documented layout is 6 aux sends, 8 aux returns, and 4x2 stereo FX returns. Create a separate decoder and tests before using it because the offsets differ from `/meters/13`.
  Where: Research/doc update first; possible future files: `src/shared/osc/X32Protocol.ts`, `src/features/busMix/hooks/useMeterSubscription.ts`, `src/features/busMix/utils/meterDecoder.ts`.
  Depends on: T-003, T-004, T-005, real-console evidence
  Reuses: X32 meter docs and existing meter request/renew machinery.
  Done when: Either `/meters/3` is explicitly not needed because `/meters/13` is stable, or a tested `/meters/3` fallback plan exists with exact offsets.
  Tests: If implemented, add decoder tests for `/meters/3` AUX 01, AUX 08, FX Return 01, FX Return 08. Run BusMix meter tests and `yarn tsc`.
  Gate: No `/meters/3` runtime change without tests and hardware-driven reason.

  Implementation result: Not implemented in this pass. `/meters/3` remains a documented fallback only. No real-console evidence is available yet after stream isolation, so switching streams would be premature.

- [x] T-007: Preserve meter request/renew performance characteristics
  Reqs: REQ-001, REQ-008, REQ-009
  What: Ensure the fix does not increase meter traffic unnecessarily. The current renew interval is 8000 ms and request throttle is 1000 ms. Keep these values unless real-console testing proves they are part of the AUX/FX instability. Ensure `/meters/1` is requested only when CH listeners exist and `/meters/13` only when AUX/FX listeners exist.
  Where: `src/features/busMix/hooks/useMeterSubscription.ts`.
  Depends on: T-003, T-004
  Reuses: `METER_RENEW_INTERVAL_MS`, `METER_REQUEST_THROTTLE_MS`, `requestActiveMeterStreams`.
  Done when: Stream request conditions remain scoped by active visible listeners and no extra meter stream is started by default.
  Tests: Fake timer or hook utility tests if feasible; otherwise code review plus existing BusMix tests.
  Gate: BusMix tests and `yarn tsc` pass.

  Implementation result: Completed on 2026-05-24. Existing `METER_RENEW_INTERVAL_MS` and `METER_REQUEST_THROTTLE_MS` were not changed. `/meters/1` requests still start only when CH listeners exist; `/meters/13` requests still start only when AUX/FX listeners exist, now through shared classification helpers.

  Verification result: BusMix suite and `yarn tsc` passed. No new meter stream or higher polling frequency was introduced.

- [ ] T-008: Real-console UAT for AUX/FX meter stability
  Reqs: REQ-001 through REQ-012
  What: When a real X32/M32 is available, validate the exact visual behavior. CH meters must be checked first as the baseline. Then AUX and FX Return meters must be observed under actual signal. Record whether flicker is gone, whether values feel as smooth as CH meters, and whether `/meters/13` is sufficient. If not, record evidence for `/meters/3` evaluation.
  Where: Manual UAT; update `src/features/busMix/.specs/STATE.md`, `.specs/project/STATE.md`, and create `logs/YYYY-MM-DD_HH-MM-SS-busmix-aux-fx-meter-uat.txt`.
  Depends on: T-003, T-004, T-005
  Reuses: Demo/manual app flow, real console selected through ConsoleDiscovery, existing logs convention.
  Done when: UAT records console model/firmware if known, network type, tested CH/AUX/FX channels, observed meter behavior, pass/fail for acceptance criteria, and remaining risk.
  Tests: Manual only.
  Gate: UAT complete or explicitly blocked due lack of hardware.

  Implementation result: Blocked/pending. No physical X32/M32 console is connected in this session, so UAT remains open.

## Manual Real-Console Validation Script

1. Connect to a real X32/M32.
2. Open Tacimix -> real console -> target BUS -> BusMix.
3. Validate CH baseline:
   - send signal to CH 01;
   - send signal to CH 16;
   - send signal to CH 17;
   - send signal to CH 32;
   - confirm meters behave exactly like the current desired behavior.
4. Validate AUX:
   - send or route signal into AUX 01;
   - observe AUX 01 meter;
   - repeat with AUX 08;
   - confirm no erratic blinking or alternating unrelated values.
5. Validate FX Returns:
   - feed FX Return 01 L/R through an effect return path;
   - observe FX Return 01 meter;
   - repeat with FX Return 08 if practical;
   - confirm behavior matches CH meter stability.
6. Scroll BusMix horizontally:
   - confirm invisible meters unsubscribe/reset as before;
   - confirm visible AUX/FX meters resume cleanly.
7. Keep BusMix open for at least 2 minutes:
   - confirm no progressive instability;
   - confirm CH meters stay perfect.

## Implementation Notes

- The first suspected fix is dispatch isolation, not visual smoothing.
- Do not change `ChannelVuMeter` until stream routing tests prove the data layer is clean.
- Do not change CH decoder behavior.
- Do not request `/meters/3` by default until `/meters/13` isolation is tested.
- Treat meter blobs as binary payloads with source-specific layouts.
- Keep this feature separate from `realtime-console-reactivity`; meters have their own X32 mechanism.
