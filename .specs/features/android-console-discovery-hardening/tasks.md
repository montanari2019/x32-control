# Android Console Discovery Hardening Tasks

Date: 2026-06-19
Status: implemented; device runtime proof and manual UAT pending

## Task List

- [ ] T-001: Capture runtime proof of the Android stall point
  Reqs: REQ-001, REQ-003, REQ-006
  What: Reproduce the issue on Android with focused diagnostics or `logcat`
  evidence to prove whether the unresolved promise is inside bind, broadcast
  enable, send, or response wait.
  Where: `src/shared/network/UdpTransport.ts`,
  `src/shared/network/NetworkScanner.ts`, Android runtime logs.
  Depends on: none
  Reuses: existing `UdpDiagnostics` logging surface.
  Done when: There is concrete evidence showing the last reached discovery step
  before the infinite spinner.
  Tests: manual Android reproduction with captured logs.
  Gate: No behavioral change is committed before the stall point is proven.

- [x] T-002: Add an automated regression test for the infinite-search path
  Reqs: REQ-001, REQ-006, REQ-008
  What: Create a focused test that models Android broadcast configuration never
  completing and proves the scan promise must still settle.
  Where: `__tests__/shared/network/NetworkScanner.test.ts` and/or
  `__tests__/shared/network/UdpTransport*.test.ts`.
  Depends on: T-001
  Reuses: current fake transport testing style in shared network tests.
  Done when: The test fails on the current bug behavior and protects the future
  fix.
  Tests: focused shared network Jest run.
  Gate: The bug must be reproducible in test form before transport changes are
  considered complete.

- [x] T-003: Harden Android broadcast setup so bind cannot hang forever
  Reqs: REQ-001, REQ-004, REQ-006, REQ-007
  What: Change Android broadcast socket configuration so `UdpTransport.bind()`
  cannot wait forever on `NativeModules.UdpSockets.setBroadcast(...)`.
  Where: `src/shared/network/UdpTransport.ts`.
  Depends on: T-001, T-002
  Reuses: existing `configureBroadcastOnce()` structure and diagnostics.
  Done when: Android bind either completes through success, timed fallback, or
  surfaced failure within a bounded timeout.
  Tests: shared network tests covering success, timeout, and error paths.
  Gate: iOS code path and Local Network preflight behavior remain unchanged.

- [x] T-004: Decide and validate the Android fallback path after broadcast timeout
  Reqs: REQ-004, REQ-007, REQ-008
  What: Validate the safest Android behavior after broadcast-enable timeout:
  continue with a safe fallback path, or abort cleanly with a surfaced error if
  discovery cannot proceed reliably.
  Where: `src/shared/network/UdpTransport.ts`,
  `src/shared/network/NetworkScanner.ts`.
  Depends on: T-003
  Reuses: current bounded wait windows and no-console UX.
  Done when: The fallback/abort behavior is explicit, tested, and does not
  leave the UI spinning.
  Tests: shared network tests plus Android manual UAT.
  Gate: no silent indefinite wait remains.

- [x] T-005: Implement Android native network-interface enumeration parity
  Reqs: REQ-005, REQ-006, REQ-008
  What: Add an Android-native helper equivalent to the iOS network info module
  so discovery can enumerate active IPv4 interfaces and directed broadcast
  addresses.
  Where: Android native code under `android/app/src/main/java/...` plus
  `src/shared/network/NativeNetworkInterfaces.ts`.
  Depends on: T-004
  Reuses: the existing `NativeNetworkInterface` JS contract and iOS helper
  behavior as the model.
  Done when: Android can return valid active interface data to JS without
  affecting iOS.
  Tests: focused native-bridge contract tests where feasible, plus shared
  network tests with mocked Android interface data.
  Gate: interface enumeration remains discovery-scoped and does not add an
  Android runtime permission flow.

- [x] T-006: Extend `NetworkScanner` to use Android directed broadcast and subnet fallback
  Reqs: REQ-005, REQ-007, REQ-008
  What: Reuse the new Android interface data so `NetworkScanner` can try
  platform-aware directed broadcasts and bounded subnet-targeted unicast
  fallback instead of depending only on `255.255.255.255`.
  Where: `src/shared/network/NetworkScanner.ts`.
  Depends on: T-005
  Reuses: existing iOS-oriented directed broadcast and host derivation logic.
  Done when: Android discovery uses the same bounded fallback model where the
  platform can provide valid interface data.
  Tests: shared network tests for Android interface cases and no-interface
  fallback cases.
  Gate: iOS behavior stays behaviorally identical.

- [x] T-007: Surface clean user outcomes for Android discovery completion
  Reqs: REQ-001, REQ-007, REQ-008
  What: Verify the ConsoleDiscovery hook/screen correctly leaves the loading
  state for Android success, no-console, and transport-failure outcomes after
  the transport fix.
  Where: `src/features/consoleDiscovery/hooks/useConsoleDiscovery.ts`,
  `src/features/consoleDiscovery/screens/ConsoleDiscoveryScreen.tsx`.
  Depends on: T-004, T-006
  Reuses: existing error/no-console UX and demo console behavior.
  Done when: the user never sees an endless search spinner and existing UI
  semantics are preserved.
  Tests: focused hook/component tests if practical, plus manual Android UAT.
  Gate: Demo console card and navigation remain unchanged.

- [x] T-008: Run automated non-regression gates
  Reqs: REQ-002, REQ-008
  What: Run the project gates after the Android discovery fix is implemented.
  Where: whole repo.
  Depends on: T-007
  Reuses: existing shared network, OSC, BusMix, and BusGroups test suites.
  Done when: required suites pass or pre-existing failures are documented with
  evidence.
  Tests: `yarn tsc`, `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`,
  `yarn jest __tests__/shared/osc --runInBand`,
  `yarn jest __tests__/features/busMix --runInBand`,
  `yarn jest __tests__/features/busGroups --runInBand`.
  Gate: no iOS-sensitive regression is introduced by the Android fix.

- [ ] T-009: Perform manual Android and iOS discovery UAT
  Reqs: REQ-001, REQ-002, REQ-004, REQ-005, REQ-007, REQ-008
  What: Validate the finished fix on real devices and a real console network.
  Where: Android device, iPhone/iOS device, real X32/M32 environment.
  Depends on: T-008
  Reuses: existing real-console UAT style and Local Network prompt checks.
  Done when: Android finds a reachable console or exits cleanly when none is
  available, and iOS still behaves correctly.
  Tests: manual UAT notes with timestamps and observed behavior.
  Gate: iOS Local Network preflight/discovery remains preserved.

- [x] T-010: Update docs and project state after implementation
  Reqs: REQ-002, REQ-005, REQ-006, REQ-008
  What: Record the final Android discovery decision, chosen fallback strategy,
  and residual caveats in project memory and logs.
  Where: `.specs/project/STATE.md`, `logs/`, and docs if needed.
  Depends on: T-009
  Reuses: current project memory/logging conventions.
  Done when: future sessions can see what was fixed, what remains device-
  specific, and why iOS behavior was left untouched.
  Tests: documentation review.
  Gate: recorded behavior matches the implemented code path.

## Implementation Notes

- Implemented 2026-06-19 with an Android-specific transport hardening path
  plus Android native interface parity.
- `UdpTransport.bind()` now emits bind/broadcast diagnostics, time-bounds the
  Android native broadcast-confirmation wait, and falls back to the library
  `socket.setBroadcast(true)` async path instead of keeping the discovery
  promise unresolved forever.
- Immediate Android broadcast errors no longer wedge the UI; discovery can
  continue into the existing bounded wait windows and subnet unicast fallback.
- `NetworkScanner.scanForConsoles()` now always closes the transport in
  `finally`, emits scan/wait diagnostics, and reuses native directed
  broadcast + subnet unicast fallback on Android once native interface data is
  available.
- Added Android native module `TacimixNetworkInfo` under
  `android/app/src/main/java/com/tacimix/app/network/` and registered it in
  `MainApplication.kt` so JS can read active IPv4 address/netmask/broadcast
  data on Android without adding a runtime permission flow.
- Added focused tests for:
  - Android bind settling when broadcast confirmation never returns.
  - iOS broadcast failure path non-regression.
  - Android/iOS local-network-permission assumptions.
  - Android native interface contract filtering.
  - Shared scanner fallback behavior and bind-failure cleanup.
- Automated gates passed:
  - `yarn tsc`
  - `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`
  - `yarn jest __tests__/shared/osc --runInBand`
  - `yarn jest __tests__/features/busMix --runInBand`
  - `yarn jest __tests__/features/busGroups --runInBand`
  - `android\\gradlew.bat -p android :app:compileDevelopDebugKotlin`
  - `git diff --check` (only existing LF/CRLF warnings, no diff errors)
- T-001 remains open because this environment did not include a real Android
  runtime/logcat reproduction of the pre-fix stall.
- T-009 remains open pending real-device Android/iOS discovery UAT on the same
  X32/M32 network.
