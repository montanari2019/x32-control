# Spec - BusMix Remote Fader Subscription Sync

Last updated: 2026-05-24

## Context

The current BusMix app-to-console fader path is working well and must be preserved. The problem is the reverse path: when a user changes CH 17 from the X32 official app or another console client, the BusMix fader position in Tacimix does not update in real time. The value becomes correct only after leaving and re-entering BusMix, because the screen reloads the channel faders from the console.

This feature is different from `realtime-console-reactivity`:

- `realtime-console-reactivity` added local and remote linked-peer visual reflection once an OSC value is already received by the app.
- `remote-fader-subscription-sync` must make sure Tacimix actually receives fresh remote fader values while BusMix is open.

The exact OSC path matters. Tacimix BusMix faders represent source send level to the selected BUS, not the source's main channel fader:

- CH 17 main channel fader: `/ch/17/mix/fader`
- CH 17 send level to BUS 01: `/ch/17/mix/01/level`
- CH 17 send level to BUS 08: `/ch/17/mix/08/level`

If the user changes CH 17 in the X32 app while that app is not in the same sends-on-fader/BUS context, Tacimix should not blindly move the BusMix fader because that would mirror a different console parameter. The implementation must first prove whether the remote edit is on `/ch/17/mix/{bus}/level` or `/ch/17/mix/fader`.

## Source Of Truth

Implementation must follow:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/design.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/tlc-spec-driven/references/implement.md`
- `docs/skills/custom-hooks/SKILL.md`
- `docs/skills/services-and-auth/SKILL.md`
- `docs/skills/components-and-shared-ui/SKILL.md`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`

## External Research Summary

Research performed on 2026-05-24:

- Mixing Station's X32/M32 documentation describes X32 remote sync as OSC over UDP. UDP does not guarantee delivery. It identifies two sync strategies:
  - `/subscribe`: repeated reports for requested values for the next 10 seconds, commonly used by X32-Mix for visible values.
  - `/xremote`: event-style updates for parameter changes during the next 10 seconds.
  - Mixing Station still performs periodic background sync because UDP packets can be dropped.
  Source: https://dev-core.org/ms-docs/mixers/behringer/x32/
- The unofficial X32/M32 OSC protocol documents `/subscribe <string> <optional int>`, `/formatsubscribe`, `/batchsubscribe`, `/renew`, `/unsubscribe`, and `/xremote`. It states subscriptions time out after 10 seconds if not renewed.
  Source: https://www.z80ne.com/behringer/docs/X32-OSC%20v.4.0.pdf
- The same protocol documents BusMix-relevant send-level paths:
  - `/ch/[01...32]/mix/[01...16]/level`
  - `/ch/[01...32]/mix/[01...16]/on`
  - `/ch/[01...32]/mix/[odd bus]/pan`
  Source: https://www.z80ne.com/behringer/docs/X32-OSC%20v.4.0.pdf
- The protocol also documents `/ch/[01...32]/mix/fader` as the main channel fader. This must not be treated as equivalent to a BusMix send level unless product explicitly changes the feature definition.
  Source: https://www.z80ne.com/behringer/docs/X32-OSC%20v.4.0.pdf
- The Janis Streib X32 OSC field report notes that `/xremote` must be sent periodically and that the X32 may not send fader updates caused by OSC commands. This supports keeping optimistic local reflection and background reconciliation even after adding subscriptions.
  Source: https://janis-streib.de/post/behringer-x32-osc-is-quirky/
- A GitHub issue discussing Behringer-style OSC integrations notes that mixers can reply to the same UDP port the client sent from, so bidirectional send/receive should share the same UDP socket when possible.
  Source: https://github.com/orchetect/swift-osc/issues/32
- Stack Overflow X32 meter discussion reinforces that meters are a separate subscription mechanism. This feature must not mix fader reactivity with meter streaming.
  Source: https://stackoverflow.com/questions/79628962/how-to-access-meters-on-behringer-x32

## Current Code Observations

- `src/shared/osc/OscClient.ts` already sends `/xremote` every 5000 ms through `startXRemoteKeepAlive()`.
- `OscClient.subscribe(address, listener)` is currently only a local dispatcher registration. It does not send X32 `/subscribe`.
- `OscClient.handlePacket()` dispatches incoming messages only by exact OSC address.
- `src/shared/osc/SharedOscClient.ts` reuses a shared UDP client per console endpoint, which matches the same-socket requirement.
- `src/features/busMix/services/BusMixService.ts`:
  - acquires the shared OSC client;
  - starts `/xremote` on connect;
  - exposes `onLevel`, `onOn`, and `onPan`, but these only register local exact-address listeners;
  - writes BusMix fader values through `setChannelFader()` using source-specific `getLevelPath(...)`;
  - reloads faders through `loadChannelFaders()`.
- `src/features/busMix/hooks/useBusMix.ts`:
  - keeps the current optimistic local fader path;
  - protects recent local fader edits from stale remote echo;
  - subscribes to remote level/on/pan exact addresses for all loaded channels;
  - background-syncs faders every 30000 ms;
  - now has linked visual reflection helpers, but only after a value arrives.
- `src/features/busMix/screens/BusMixScreen.tsx` already tracks `visibleChannelIds` for meter subscriptions and list virtualization. This is the natural signal for a low-traffic fader subscription strategy.
- `src/features/busMix/hooks/useMeterSubscription.ts` owns meter traffic and should remain separate.

## Requirements

REQ-001: Preserve the existing app-to-console fader send path exactly: drag throttle, final send on release, optimistic UI, local protection, presets, and BusGroups shared state.

REQ-002: BusMix must update visible fader positions when the same source send level is changed outside Tacimix, e.g. CH 17 BUS 01 send level `/ch/17/mix/01/level`.

REQ-003: The implementation must explicitly distinguish BusMix send-level paths from main source fader paths. `/ch/17/mix/fader` must not move Tacimix's BUS send fader unless a future product decision says BusMix should show main channel faders.

REQ-004: The implementation must keep `/xremote` active and renewed before its 10-second timeout.

REQ-005: The implementation must add an explicit receive strategy for fader values that does not depend only on `/xremote`.

REQ-006: The primary receive strategy should use X32 `/subscribe` for currently visible BusMix source send-level paths, renewed before the 10-second timeout.

REQ-007: Subscription responses must be received through the same shared UDP client used for writes.

REQ-008: The app must not aggressively subscribe all 48 BusMix faders at high frequency when only a few strips are visible. Subscribe visible strips, and optionally a small adjacent buffer only if UX evidence requires it.

REQ-009: The implementation must support CH 01..32, AUX 01..08, and FX Return 01..08 source send-level paths using existing `SourceDefinition` path builders.

REQ-010: Remote fader values received through `/subscribe`, `/xremote`, or explicit request responses must feed one reconciliation path so linked-channel reflection, local-protection windows, and `BusMixChannelStore` updates remain consistent.

REQ-011: Pan and mute/on receive behavior must not regress. Pan remains per-channel. Mute/on may later use the same subscription infrastructure, but this feature is focused on fader level.

REQ-012: Meters must not change. This feature must not add meter streams, change `/meters/1`, change `/meters/13`, or increase meter renew frequency.

REQ-013: The implementation must expose diagnostics for real-console validation: subscribed fader path count, last fader update timestamp, last subscription renewal timestamp, and whether fader updates are stale.

REQ-014: If `/subscribe` cannot deliver the needed values in real hardware testing, the fallback may be a narrow visible-fader polling loop. It must poll only visible BusMix send-level paths, not all app parameters.

REQ-015: The implementation must be covered by unit tests and fake-timer tests before real-console UAT.

REQ-016: Real-console UAT must validate CH 17 specifically, plus at least one other CH source and one AUX/FX source if available.

## Acceptance Criteria

- With Tacimix BusMix open on BUS N, changing CH 17's send level to that same BUS from the X32 app updates Tacimix's CH 17 BusMix fader without leaving and re-entering the screen.
- The update latency is low enough to feel near-real-time to a musician using the monitor mix. Target: under 250 ms when `/subscribe` is active and the network is healthy.
- Moving CH 17's main channel fader `/ch/17/mix/fader` does not incorrectly move the Tacimix BusMix send fader unless the app is explicitly changed to show main fader state elsewhere.
- App-originated fader changes remain as responsive as before.
- Linked-channel visual reflection from `realtime-console-reactivity` still works when subscribed values arrive.
- Pan receive remains independent and is not mirrored across linked peers.
- AUX/FX meters remain stable and unchanged.
- No duplicate OSC fader writes are sent as part of receive-side sync.
- Subscription lifecycle stops when BusMix unmounts or the console lease disconnects.
- Subscription renewal runs before the X32/M32 10-second timeout.
- Focused tests and `yarn tsc` pass.
- Real-console UAT notes are recorded after hardware validation.

## Out Of Scope

- Replacing the OSC transport.
- Changing the visual fader component.
- Changing CH/AUX/FX meter decoding or subscription behavior.
- Adding new user-facing UI for diagnostics unless requested later.
- Mirroring main channel fader values into BusMix send fader values.
- Adding broad all-parameter polling.
- Solving router/Wi-Fi packet loss outside app-level diagnostics and scoped reconciliation.

## Open Risks

- The user's CH 17 reproduction may be on the main channel fader path rather than the BUS send-level path. The first task must prove this before code changes.
- `/xremote` may not report every value changed by another OSC client depending on firmware/client behavior. `/subscribe` should reduce this risk for visible faders.
- `/subscribe` frequency must be tuned carefully. Too frequent values for too many paths could make the app worse on Wi-Fi.
- `/formatsubscribe` could reduce request count for ranges but returns blob payloads and needs additional decoding. It should be evaluated later, not used as the first implementation unless tests prove it is safer.
- Hardware UAT is required before marking the feature fully complete.
