# Android Console Discovery Hardening Design

Date: 2026-06-19
Status: planned

## Overview

Treat the Android discovery problem as two separate layers:

1. Primary correctness bug:
   Android discovery can stall before the scan enters its bounded response
   windows.
2. Secondary reliability gap:
   Android lacks the native interface/broadcast enumeration that currently
   hardens iOS discovery.

The implementation should solve the primary bounded-completion bug first, then
add Android parity hardening without changing the proven iOS path.

## Existing Patterns To Preserve

- `ConsoleDiscoveryScreen` and `useConsoleDiscovery` remain the UI/state owners
  of the search lifecycle.
- `ConsoleDiscoveryService` remains a thin wrapper over `NetworkScanner`.
- `NetworkScanner` remains the owner of discovery packet flow and response wait
  windows.
- `UdpTransport` remains the owner of socket bind/send/broadcast mechanics.
- iOS `LocalNetworkPermission` behavior remains unchanged.

## Proposed Correction Strategy

### 1. Prove the bind-stage stall

Before changing behavior, add targeted diagnostics around:

- bind start
- native `setBroadcast` start
- native `setBroadcast` success
- native `setBroadcast` timeout/failure
- first discovery packet send
- wait-window start/end

This separates "broadcast enable hang" from "no UDP responses".

### 2. Decouple Android bind success from unbounded broadcast enable

Recommended implementation direction:

- Socket bind success should not depend indefinitely on Android broadcast
  enablement.
- Android broadcast setup should be time-bounded.
- If native `setBroadcast` does not confirm promptly, discovery should proceed
  through a controlled fallback path or fail fast with a surfaced error instead
  of hanging.

Safe patterns to evaluate during implementation:

- Android-only timeout wrapper around native `setBroadcast`.
- Android-only fallback to the library's JS `socket.setBroadcast(true)` fire-
  and-forget path when native callback semantics are unreliable.
- Android-only decision to skip explicit broadcast enable if empirical testing
  proves `DatagramSocket` defaults plus directed broadcast are sufficient on the
  supported device matrix.

The final implementation choice must be validated on real Android hardware and
must not change iOS behavior.

### 3. Add Android native network-interface parity

After the infinite-spinner bug is removed, add an Android-native helper that
can provide:

- active IPv4 interface address
- netmask/prefix information
- directed broadcast address

That enables Android to reuse the existing `NetworkScanner` hardening model:

- send to directed broadcast addresses, not only `255.255.255.255`
- derive subnet host candidates for bounded unicast fallback

This should mirror the iOS helper contract closely enough that shared scanner
logic stays simple.

### 4. Keep behavior platform-split where necessary

The fix should prefer:

- shared scanning logic where behavior is already safe;
- platform-specific transport/interface handling where Android differs.

Do not force a single identical code path if that increases iOS risk.

## Data Flow After Hardening

```txt
Android search tap
  -> useConsoleDiscovery.scan()
    -> ConsoleDiscoveryService.scan()
      -> NetworkScanner.scanForConsoles()
        -> UdpTransport.bind()
          -> bounded Android broadcast setup
        -> send directed/fallback broadcasts
        -> bounded response wait
        -> optional bounded subnet unicast fallback
      -> scan promise resolves/rejects
    -> isSearching=false in finally
```

## Testing Strategy

Unit/integration tests:

- scanner settles when Android broadcast configuration never confirms
- scanner still reaches response waits after Android broadcast timeout/fallback
- scanner keeps existing bounded no-response behavior
- iOS-oriented Local Network preflight assumptions remain unchanged
- Android interface enumeration helpers return only valid IPv4/broadcast data

Non-regression gates:

- `yarn tsc`
- `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`
- `yarn jest __tests__/shared/osc --runInBand`
- `yarn jest __tests__/features/busMix --runInBand`
- `yarn jest __tests__/features/busGroups --runInBand`

Manual UAT:

- Android device on same Wi-Fi as real X32/M32:
  - reachable console found
  - unreachable/no-console path exits search cleanly
  - repeated searches do not wedge the socket lifecycle
- iOS regression:
  - first-run Local Network prompt/preflight still works
  - reachable console still discovered
  - no-console path still completes

## Risks And Trade-Offs

- A broad shared transport change could regress iOS if Android-specific failure
  semantics are applied globally.
- Skipping or timeboxing broadcast enable may improve liveness but reduce
  discovery reach on some Android devices unless directed broadcast/unicast
  fallback is added soon after.
- Android-native interface enumeration introduces new native code, so it needs
  tight scope and validation.
- Diagnostics must help prove the stall without becoming noisy or destabilizing
  release builds.
