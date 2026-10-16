# Design - Android Discovery Field Failure

Date: 2026-10-15

## Strategy

Prove first, then layer defenses so that no single native call can freeze or blind the scan.

1. Observability: Android-visible diagnostics (native `Log.i("TacimixDiscovery", ...)` bridge or `console.warn`-free path that reaches logcat) with a scan id and step names.
2. Liveness: `Promise.race` timeouts around every awaited step in `scanForConsoles` (bind, native broadcasts, native interfaces) plus a global scan watchdog in `NetworkScanner`/hook. On timeout: close transport, continue to unicast/or return empty + typed error.
3. Reception: native Android helper (extend `TacimixNetworkInfo` or new `TacimixWifiLock`) exposing `acquireMulticastLock()/release()`; hold it for the scan duration only (try/finally), reference-counted.
4. Routing: native helper returns the Wi-Fi `Network` and binds the process to it for the scan (`ConnectivityManager.bindProcessToNetwork(wifi)`, restore `null` in finally), because per-socket binding is not reachable through react-native-udp. Scoped to scan, Android only.
5. Fallback order on Android: unicast subnet sweep starts in parallel (not after a 2s idle) because broadcast is the least reliable path; stop on first reply.
6. UX: Android-specific error copy; optional hint to enable Wi-Fi/stay on the console network.

## Preserved

- iOS: Local Network preflight, `TacimixNetworkInfo.m`, 500ms broadcast delay, timings.
- Shared scanner semantics/payload (address-only `/info`).

## Risks

- `bindProcessToNetwork` affects the whole process (other traffic during scan); mitigated by scan-scoped bind/restore. If Wi-Fi disconnects mid-scan, sockets stop (acceptable).
- Parallel unicast sweep raises packet burst on Android; keep batch 32/25ms.
- Android 16+/target 36: re-check local network permission before bumping targetSdk (add note in CONCERNS).

## Tests

- Jest: scanner settles when bind never resolves; when native interfaces promise never resolves; when watchdog fires; parallel unicast finds console after broadcast silence; iOS path unchanged.
- Kotlin compile: `./gradlew :app:compileDevelopDebugKotlin`.
- Device UAT: Redmi Note 9S + X32 at 192.168.1.250, console on/off, Wi-Fi without internet, mobile data on/off.
