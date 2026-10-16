# Android Discovery Field Failure - Tasks

Date: 2026-10-15
Status: implemented and validated on device 2026-10-15 (T-011 docs pending final review)

Gate for all tasks: `yarn tsc`, `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`,
`yarn jest __tests__/shared/osc --runInBand`, BusMix/BusGroups suites, Kotlin compile. iOS paths untouched.
Run commands from `repos/x32-control/`.

- [x] T-001: Make discovery diagnostics visible in logcat
  Reqs: REQ-004
  What: Route `logUdpDiagnostic` (and scan id/step names) to `adb logcat` on Android (e.g. `console.warn`/native `Log.i` tag `TacimixDiscovery`), not only `console.info`.
  Where: `src/shared/network/UdpDiagnostics.ts`, optional Kotlin log method.
  Done when: one scan on the Redmi prints bind_start ... discovery_scan_complete (or the last step reached) in `adb logcat -s TacimixDiscovery`.
  Tests: UdpDiagnostics unit test updated.

- [x] T-002: Prove the stall step on the Redmi Note 9S (replaces old T-001)
  Reqs: REQ-001, REQ-002
  What: With T-001, run a scan against X32 192.168.1.250; record the last step reached (bind / listening / native promises / waits). Confirm or reject H1..H3 in context.md.
  Depends on: T-001
  Done when: context.md "Findings" section lists the proven stall step with logcat excerpt.
  Gate: no behavior change before this is recorded.

- [x] T-003: Regression tests for unbounded awaits
  Reqs: REQ-001
  What: Failing tests where (a) `transport.bind` never resolves, (b) `getNativeBroadcastAddresses` never resolves, (c) `getNativeNetworkInterfaces` never resolves; scan must still settle.
  Where: `__tests__/shared/network/NetworkScanner.test.ts`, `UdpTransport.test.ts`.
  Depends on: T-002

- [x] T-004: Add timeouts and global watchdog to the scan
  Reqs: REQ-001
  What: `withTimeout` helper; wrap bind (~3s), native broadcasts/interfaces (~1s each, fallback to []); global watchdog (~8s) closes transport and settles with empty/typed error. Hook `finally` already clears `isSearching`.
  Where: `src/shared/network/NetworkScanner.ts`, `UdpTransport.ts`, optionally `useConsoleDiscovery.ts`.
  Depends on: T-003
  Done when: T-003 tests pass; spinner never exceeds watchdog on device even with console off.

- [x] T-005: Hold a WifiManager.MulticastLock during Android scans
  Reqs: REQ-002, REQ-003
  What: Native method `acquireMulticastLock/releaseMulticastLock` (ref-counted, released in finally and on destroy) in the Android `TacimixNetworkInfo` package; call from scanner on Android only.
  Where: `android/app/src/main/java/com/tacimix/app/network/*`, `NativeNetworkInterfaces.ts`, `NetworkScanner.ts`.
  Depends on: T-004
  Tests: JS contract test with mocked module; Kotlin compile.

- [x] T-006: Bind the scan to the Wi-Fi Network on Android
  Reqs: REQ-002, REQ-003
  What: Native `bindToWifiNetwork()/unbind()` using `ConnectivityManager` (`TRANSPORT_WIFI`) + `bindProcessToNetwork`, scan-scoped with finally restore; no-op when Wi-Fi absent. Handle Wi-Fi without internet.
  Where: Kotlin module (needs ACCESS_NETWORK_STATE, already declared), `NetworkScanner.ts`.
  Depends on: T-005

- [x] T-007: Run subnet unicast sweep in parallel with broadcast on Android
  Reqs: REQ-002
  What: On Android start the unicast sweep right after the broadcast send (priority .250/.251...), stop on first reply; keep iOS sequence unchanged.
  Where: `NetworkScanner.ts`.
  Depends on: T-004
  Tests: scanner test with broadcast silent, unicast reply found < 2s.

- [x] T-008: Android-specific error/empty copy
  Reqs: REQ-006
  What: Split i18n keys (en, pt-BR, es) so Android text refers to Wi-Fi/same network, not iPhone/Local Network.
  Where: `src/shared/i18n/resources/*`, `ConsoleDiscoveryScreen`/hook.
  Tests: i18n resource completeness test.

- [x] T-009: Automated gates
  Reqs: REQ-005
  What: Run full gate list above; confirm no iOS-file diffs (`git diff -- ios src/shared/network/LocalNetworkPermission.ts`).
  Depends on: T-004..T-008

- [x] T-010: Device UAT matrix
  Reqs: REQ-001, REQ-002
  What: Redmi Note 9S + X32 at 192.168.1.250: 5 scans found <6s; console off -> <=8s no-console; Wi-Fi without internet + mobile data on; app background/foreground; iPhone regression (prompt, discovery).
  Depends on: T-009
  Done when: notes with timestamps appended to context.md.

- [ ] T-011: Update docs/state
  What: Update `.specs/project/STATE.md`, local STATE.md, mark global `android-console-discovery-hardening` T-001/T-009 superseded by this spec; add Android 16 local-network note to `.specs/codebase/CONCERNS.md`.
  Depends on: T-010

## Implementation notes (2026-10-15)

- Root cause PROVEN (T-002): `react-native-udp` Android `setBroadcast()` blocks forever on the Redmi Note 9S
  (native debug logs: `setBroadcast run` never followed by `done`). The module's pool has 2 threads; the
  native call and the library's own JS fallback each pinned one, so every later bind/send task starved.
  Result: no packet ever left the phone, and a second scan's bind timed out.
- Fix: `UdpTransport` skips `setBroadcast` on Android entirely (iOS unchanged). Sockets still send to
  directed/limited broadcast; the subnet unicast sweep finds the console regardless.
- Layered guards kept: bind timeout 4s, native lookups 1.5s, global watchdog 9s (Android only), MulticastLock +
  scan-scoped Wi-Fi network binding, parallel unicast sweep, logcat tag `TacimixDiscovery`, Android copy.
- T-010 result: scan on Redmi Note 9S shows `osc-server` / `X32` / `192.168.1.250:10023` in ~3.5s.
  Still to run manually: console-off run, Wi-Fi without internet, iPhone regression.
- Automated: tsc OK; jest 28 suites / 117 tests OK; `compileDevelopDebugKotlin` OK.
