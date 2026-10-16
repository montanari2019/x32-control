# Android Discovery Field Failure Spec

Date: 2026-10-15
Status: planned
Scope: consoleDiscovery (+ shared/network, Android native)
Follows: `.specs/features/android-console-discovery-hardening/` (implemented, UAT never passed)

## Problem

Real device (Redmi Note 9S, Android 12) on the same Wi-Fi/subnet as a powered X32 does
not find the console. iOS (published) works.

Field evidence collected 2026-10-15 (see context.md):

- Phone `192.168.1.36/24` on Wi-Fi "SOM 2.4G", validated, default network = wlan0.
- X32 answers `/info` at `192.168.1.250:10023` to a Mac on the same subnet (unicast and broadcast).
- In the app, tapping "Buscar mesas na rede" leaves the spinner on for 45s+.
  The scan is designed to settle in about 5.5s, so the previous fix did not remove the stall.
  REQ-001 of the earlier spec (bounded completion) is currently violated on this device.

## Requirements

REQ-001: Scan always settles in a bounded time (hard watchdog, e.g. 8s) with found / not found / error. Independent of any native call.

REQ-002: A powered X32 on the same subnet is found on Android (Redmi Note 9S first) in under ~6s.

REQ-003: Android scan must not depend on broadcast alone: use Wi-Fi-bound sockets, a held MulticastLock, and the subnet unicast fallback.

REQ-004: Android diagnostics must be visible in `adb logcat` (tag-able, also in release-debuggable builds) so field failures can be proven, not guessed.

REQ-005: No regression for iOS (Local Network preflight, native interfaces, discovery timing).

REQ-006: Android no-console / failure copy must not mention iPhone/Local Network.

## Acceptance Criteria

- On the Redmi Note 9S with X32 at 192.168.1.250, the console card appears in < 6s, 5 consecutive scans.
- With console off, scan ends in <= 8s with the existing "no console found" feedback.
- logcat shows the step sequence (bind, listening, send, wait, complete) for every scan.
- `yarn tsc`, shared network/osc/busMix/busGroups suites pass; iOS code paths untouched.

## Out of Scope

- Rewriting away from `react-native-udp`.
- Android runtime permission prompt (not needed through Android 15; see design.md for Android 16/17 note).
- Manual IP UI (separate spec `manual-ip-fallback`; referenced as a mitigation only).
