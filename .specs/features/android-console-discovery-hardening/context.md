# Android Console Discovery Hardening Context

Date: 2026-06-19

## Scope

Global feature: Android-specific discovery hardening spanning shared network
infrastructure and the ConsoleDiscovery feature.

Reason for global placement:

- The problem crosses `src/shared/network/*` and
  `src/features/consoleDiscovery/*`.
- The user explicitly requested the planning artifacts in the global `.specs`
  area.
- Per `docs/skills/tlc-spec-driven/SKILL.md`, cross-cutting mobile work can
  live under `.specs/features/[feature-name]/`.

## User Request Summary

The user asked to:

- read `docs/skills` and `.specs/project/STATE.md` for project context;
- investigate why Android discovery keeps searching forever while iOS works;
- research related Android/web references;
- create only the correction tasks in the project's global spec;
- avoid implementation for now;
- keep the plan precise enough to fix Android without harming iOS.

## Current Code Observations

Primary loading chain:

- `src/features/consoleDiscovery/screens/ConsoleDiscoveryScreen.tsx`
  renders `LoadingState` while `isSearching` is true.
- `src/features/consoleDiscovery/hooks/useConsoleDiscovery.ts`
  sets `isSearching=true` before `await service.scan()` and clears it only in
  `finally`.
- Any unresolved `service.scan()` promise therefore creates the exact infinite
  searching symptom reported by the user.

Discovery path:

- `src/features/consoleDiscovery/services/ConsoleDiscoveryService.ts`
  delegates directly to `NetworkScanner.scanForConsoles()`.
- `src/shared/network/NetworkScanner.ts` begins with:
  `await transport.bind(0, { broadcast: true })`.
- Only after bind completes does the scanner send discovery packets and enter
  bounded response waits (`2000 ms` broadcast + `3000 ms` unicast).

Primary Android stall hypothesis from local code:

- `src/shared/network/UdpTransport.ts`
  `bind()` waits for `configureBroadcastOnce(options.broadcast)`.
- `configureBroadcastOnce()` checks `NativeModules.UdpSockets.setBroadcast`.
- When available, it wraps `setBroadcast(...)` in a promise and waits for the
  native callback.
- If that callback never returns on Android, `bind()` never resolves, the
  scanner never reaches `waitForResponses(...)`, and the UI spinner never ends.

Secondary Android hardening gap from local code:

- `src/shared/network/NativeNetworkInterfaces.ts` intentionally returns native
  interfaces only on iOS.
- `NetworkScanner` uses `getNativeBroadcastAddresses()` and
  `getNativeNetworkInterfaces()` for directed broadcast and subnet unicast
  fallback.
- On Android these helpers return `[]`, leaving Android with only
  `255.255.255.255` broadcast and no native subnet-targeted unicast fallback.
- This weakens Android discovery reliability, but by itself should still allow
  the scan promise to complete because the wait windows are bounded.

Prior recorded project decision:

- `.specs/project/STATE.md` already records on 2026-06-19 that Android does
  not need an iOS-style runtime Local Network permission prompt.
- That prior audit also records the residual gap that Android lacks the iOS
  native interface/broadcast enumeration helper.

## External Research Notes

Sources consulted:

- Android `WifiManager.MulticastLock` API reference:
  https://developer.android.com/reference/android/net/wifi/WifiManager.MulticastLock
- Android `DatagramSocket` API reference:
  https://developer.android.com/reference/java/net/DatagramSocket
- `react-native-udp` repository:
  https://github.com/tradle/react-native-udp
- `react-native-udp` issue `setBroadcast(true) hangs on Android`:
  https://github.com/tradle/react-native-udp/issues/82
- `react-native-udp` issue `Not receiving broadcast messages on Android`:
  https://github.com/tradle/react-native-udp/issues/50

Research conclusions relevant to this codebase:

- Android's `DatagramSocket` documentation says broadcast send/receive behavior
  is implementation-sensitive and `setBroadcast(true)` may require underlying
  platform support/privileges.
- The upstream `react-native-udp` project has a documented Android issue where
  `setBroadcast(true)` hangs.
- The local app currently waits synchronously for that broadcast-enablement step
  inside `UdpTransport.bind()`, which aligns closely with the reported symptom.
- Android Wi-Fi stacks can be stricter about multicast/broadcast handling than
  iOS; even after removing the infinite stall, Android discovery still benefits
  from interface-aware fallback instead of depending only on
  `255.255.255.255`.

## Confidence And Remaining Uncertainty

High-confidence conclusion:

- The strongest root-cause candidate for the infinite search is an unresolved
  Android broadcast configuration step in `UdpTransport.bind()`.

Medium-confidence conclusion:

- Android also needs native interface/broadcast parity to make discovery as
  robust as the current iOS path after the spinner bug is removed.

Uncertainty still present:

- This session did not reproduce the issue on a physical Android device or
  collect `logcat`, so the first implementation task must confirm the stall
  point with runtime evidence before changing behavior.
