# Android Console Discovery Hardening Spec

Date: 2026-06-19
Status: planned
Scope: global app feature

## Problem

On Android, real-console discovery can remain stuck in the searching state
instead of completing with either a found console or a bounded "not found"
result. The same discovery flow works on iOS.

Current code analysis shows a high-probability Android-specific stall before
the scanner even reaches its bounded response wait windows:

- `ConsoleDiscoveryScreen` keeps the loading state while
  `useConsoleDiscovery().scan()` is unresolved.
- `scan()` awaits `ConsoleDiscoveryService.scan()`, which awaits
  `NetworkScanner.scanForConsoles()`.
- `NetworkScanner.scanForConsoles()` first awaits `UdpTransport.bind(0, {
  broadcast: true })`.
- `UdpTransport.bind()` resolves only after `configureBroadcastOnce()` resolves.
- On Android, `configureBroadcastOnce()` prefers
  `NativeModules.UdpSockets.setBroadcast(...)`.
- External library evidence indicates `react-native-udp` Android
  `setBroadcast(true)` can hang, which matches the observed infinite search.

There is also a secondary Android-only hardening gap:

- `NativeNetworkInterfaces.ts` returns native interface/broadcast data only on
  iOS.
- Android therefore lacks the native directed-broadcast and subnet-targeted
  unicast fallback now used to harden iOS discovery.
- This secondary gap does not explain an infinite spinner by itself, but it
  lowers Android discovery reliability once the primary stall is fixed.

## Goal

Make Android discovery deterministic and bounded without regressing iOS:

- Android search must always finish with success, "not found", or a surfaced
  failure within a bounded time.
- Real-console discovery on Android must no longer depend on an unbounded
  broadcast-enable handshake.
- iOS Local Network permission preflight, native interface enumeration, and
  current discovery hardening must remain intact.

## Requirements

REQ-001: Bounded completion on Android

- Starting console search on Android must always settle within a bounded time.
- The UI must not remain indefinitely in `isSearching=true`.

REQ-002: Preserve iOS behavior

- Do not regress iOS Local Network permission preflight.
- Do not remove iOS native interface enumeration or current iOS discovery
  hardening.
- Keep current iOS discovery timing semantics unless a shared fix is proven
  safe.

REQ-003: Root-cause-first correction

- The first implementation task must prove where the Android discovery promise
  stalls before broadening the fix.
- Changes must distinguish the primary stall from secondary reliability gaps.

REQ-004: Android broadcast lifecycle hardening

- Android discovery must not block forever on broadcast socket configuration.
- If broadcast enablement cannot be confirmed promptly, discovery must either
  continue via a safe fallback path or fail visibly with diagnostics.

REQ-005: Android fallback parity

- Android discovery hardening should gain platform-appropriate native network
  interface/broadcast enumeration so it can use directed broadcast and subnet
  fallback similarly to iOS where possible.
- Any Android-native enhancement must stay scoped to discovery and must not
  alter iOS code paths.

REQ-006: Diagnostics

- Discovery must emit enough diagnostics to distinguish:
  - bind stall
  - broadcast-enable stall/failure
  - no-response timeout
  - Android interface-enumeration absence
- Diagnostics must remain low-risk for release behavior.

REQ-007: User-visible behavior

- If no console is found, Android must leave the loading state and surface the
  existing "no console found" behavior.
- If a transport/configuration failure occurs, Android must leave the loading
  state and surface a meaningful error instead of hanging silently.

REQ-008: Verification

- Automated tests must cover the infinite-search regression path, Android
  broadcast configuration timeout/fallback behavior, and iOS non-regression for
  Local Network preflight assumptions.
- Manual UAT must cover Android real-console discovery and iOS regression
  checks.

## Acceptance Criteria

- On Android, tapping the discovery button never leaves the app searching
  indefinitely.
- If Android broadcast configuration stalls, discovery still settles within the
  defined bound and the UI leaves the loading state.
- If the console is reachable on the local network, Android can discover it via
  the chosen hardened path.
- If no console is reachable, Android exits search with the existing no-console
  feedback instead of hanging.
- iOS still preserves Local Network preflight and existing discovery success
  behavior.
- `yarn tsc` passes.
- Shared network tests pass with updated Android-focused coverage.
- Existing BusMix, BusGroups, shared OSC, and existing iOS-sensitive network
  tests remain green.

## Out Of Scope

- Rewriting the entire UDP stack away from `react-native-udp`.
- Adding an Android runtime permission prompt analogous to iOS Local Network.
- Exposing manual IP entry in UI as part of this fix.
- Changing BusSelection, BusGroups, BusMix, OSC write paths, or meter behavior.
- Implementing discovery changes in this planning step.
