# Spec - BusMix Realtime Console Reactivity

Last updated: 2026-05-24

## Context

BusMix already sends control changes to the X32/M32 with good responsiveness. The send path must remain intact:

- fader send during drag remains throttled and lightweight;
- final fader send remains immediate on release;
- mute/on send remains optimistic;
- pan send remains normalized through the current `0..1` X32 contract;
- meters remain isolated in the existing meter subscription flow;
- presets, BusGroups, MCA behavior, and shared channel store must not regress.

The current problem is the reverse direction: the visual state coming back from the console is not reactive enough for linked channels. Example:

- guitar L and guitar R are linked on the desk;
- the user moves or mutes one side;
- the audible result is correct because the console link applies the change;
- the app can show one side changed while the linked side still appears stale;
- pan is the exception and must not be mirrored as a linked value, because left/right pan should remain independent for stereo sources.

This is a high-risk, performance-sensitive feature because it touches OSC receive behavior, shared app state, linked-channel semantics, and real console assumptions that cannot be physically tested in this session.

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

- Mixing Station docs describe X32/M32 sync as OSC over UDP. UDP is not connection based and does not guarantee packet delivery. The docs compare two sync strategies:
  - `/subscribe`: requested values are sent repeatedly, commonly every 50 ms for 10 seconds.
  - `/xremote`: event-style updates are sent for value changes during the next 10 seconds.
  - Mixing Station combines event sync with periodic background sync because UDP packets may be dropped.
  Source: https://dev-core.org/ms-docs/mixers/behringer/x32/
- The unofficial X32/M32 OSC protocol states that `/xremote` registers a client for console updates for 10 seconds and must be renewed before timeout. It also states that `/subscribe`, `/formatsubscribe`, and `/batchsubscribe` can request regular updates from the server.
  Source: https://www.z80ne.com/behringer/docs/X32-OSC%20v.4.0.pdf
- The same protocol notes that `/renew` can renew active subscriptions and can renew all active subscriptions when no name is provided.
  Source: https://www.z80ne.com/behringer/docs/X32-OSC%20v.4.0.pdf
- A field report about X32 OSC notes that `/xremote` must be sent periodically and that X32 may not send fader updates caused by an OSC command, which can break linked-channel visual sync unless the client reflects its own commands locally.
  Source: https://janis-streib.de/post/behringer-x32-osc-is-quirky/
- Public Behringer mixer integration docs show an API pattern where a subscription callback receives changed mixer properties and a separate subscription health check is true only when data has been received recently.
  Source: https://github.com/wrodie/behringer-mixer
- A GitHub issue about Behringer-style OSC clients highlights that mixers often reply to the same UDP port the client sends from, so send and receive should share the same UDP socket/transport where possible.
  Source: https://github.com/orchetect/swift-osc/issues/32
- Public X32 scene documentation shows `/config/chlink`, `/config/auxlink`, `/config/fxlink`, and `/config/buslink` as the console's link configuration surfaces. It also documents that for stereo mix-bus sends, pan is intentionally special: the left source may be `-100` and the right source `+100`.
  Source: https://github.com/cabcookie/saddleback-x32-general-scene
- Meter discussions confirm that meter subscriptions are their own mechanism and should be kept separate from general fader/mute reactivity.
  Source: https://stackoverflow.com/questions/79628962/how-to-access-meters-on-behringer-x32

## Current Code Observations

- `src/shared/osc/OscClient.ts` already has:
  - a single UDP transport per client;
  - `startXRemoteKeepAlive()` renewing `/xremote` every 5000 ms;
  - path-based `subscribe(address, listener)`;
  - request correlation by response address.
- `src/shared/osc/SharedOscClient.ts` already reuses one `OscClient` per endpoint and keeps it alive briefly after release.
- `src/features/busMix/services/BusMixService.ts` already:
  - acquires the shared OSC client;
  - starts `/xremote` keepalive on connect;
  - subscribes to level and on paths via `onLevel` and `onOn`;
  - fetches linked CH pairs through `/config/chlink/{left}-{right}`;
  - does not expose pan subscriptions yet;
  - does not expose AUX/FX link maps yet.
- `src/features/busMix/hooks/useBusMix.ts` already:
  - applies optimistic local fader changes;
  - protects recent local fader changes from delayed remote echo for a short window;
  - subscribes to remote level/on for every current BusMix channel;
  - periodically syncs remote faders every 30 seconds;
  - uses a `channelLinkMapRef` only for mute/on local linked peer updates, not for fader-level visual mirroring.
- `src/features/busMix/hooks/useMeterSubscription.ts` already has independent meter polling/renew behavior and should not be folded into this feature.
- `src/features/busGroups/hooks/useBusGroups.ts` also listens to BusMix channel level/on and updates `BusMixChannelStore`, so changes to the sync path must be compatible with BusGroups.

## Requirements

REQ-001: The app must keep the existing high-performance OSC send path unchanged for fader, mute/on, pan, presets, meters, and BusGroups.

REQ-002: BusMix must react to console-originated changes for visible/current source send level and mute/on with the lowest safe latency available through the current OSC transport.

REQ-003: BusMix must keep `/xremote` active while a real console BusMix session is connected, renewing before the X32/M32 10-second timeout.

REQ-004: BusMix must continue using the shared OSC client so sends and receives happen through the same UDP transport and endpoint lease model.

REQ-005: Linked channel pairs reported by the console must be applied visually in BusMix for level and mute/on.

REQ-006: When one linked side changes level, the linked peer must visually reflect the same level quickly without requiring delayed remote echo.

REQ-007: When one linked side changes mute/on, the linked peer must visually reflect the same on state quickly without requiring delayed remote echo.

REQ-008: Pan must not be mirrored across linked peers. Pan changes must remain per-side and must preserve the current `-100..0..+100` UI and `0..1` X32 write contract.

REQ-009: The feature must handle both local-originated sends and console-originated events. Local-originated sends may need immediate local reflection because X32 may not echo every OSC-caused linked update.

REQ-010: The feature must not send duplicate commands to linked peers unless an implementation task proves that the console requires it. The default behavior is one command to the touched channel and local visual mirroring of linked peers.

REQ-011: The feature must not increase meter traffic or change meter subscription behavior.

REQ-012: The feature must expose observable subscription health/diagnostics in code or state so delayed/lost remote updates can be detected during real-console validation.

REQ-013: The feature must be defensive against UDP packet loss by keeping the existing background sync and, if needed, tightening only the relevant fader/on refresh path without heavy polling of all unrelated parameters.

REQ-014: The feature must support the current 48 BusMix sources:
  - CH 01..32;
  - AUX 01..08;
  - FX 01..08.

REQ-015: Link-map handling must start with CH pairs because current code already fetches `/config/chlink`; AUX/FX link support must be explicitly evaluated and implemented if paths are available in the current protocol helpers.

REQ-016: The implementation must be testable without a physical console through unit tests and mocks for linked-pair state updates, subscription dispatch, and local-originated reflection.

## Acceptance Criteria

- Moving CH 01 level in BusMix when CH 01/02 are linked updates CH 01 and CH 02 visually in the app without waiting for slow background sync.
- Moving CH 02 level in BusMix when CH 01/02 are linked updates CH 02 and CH 01 visually in the app without waiting for slow background sync.
- Muting or unmuting one linked channel updates both linked peers visually.
- Pan changes remain independent and do not mirror across linked peers.
- If the console sends an event for one linked side only, BusMix updates both visual peers for level/on.
- If the console sends events for both linked sides, BusMix remains stable and does not oscillate or flicker.
- If a remote echo arrives late after a local drag, the existing local-protection behavior prevents stale regressions.
- Meter rendering remains unchanged.
- Preset save/restore remains unchanged unless preset restore intentionally updates both linked visual peers through the same shared store path.
- `yarn tsc` passes.
- BusMix and BusGroups test suites pass.
- New unit tests cover linked fader/on reflection and pan exclusion.
- Real-console UAT notes are added when hardware is available.

## Out Of Scope

- Replacing OSC transport.
- Adding a native networking library.
- Changing the current fader send throttle unless a later implementation proves it is the bottleneck.
- Changing meter decoding or meter IDs.
- Sending duplicate fader/on commands to linked peers by default.
- Mirroring pan between linked channels.
- Redesigning BusMix UI.
- Solving Wi-Fi/router packet loss outside the app.
- Guaranteeing behavior on unsupported firmware without a graceful fallback.

## Open Risks

- Physical X32/M32 validation is required before declaring the feature fully done.
- `/xremote` event behavior for OSC-originated linked changes may vary by firmware or configuration.
- AUX/FX link paths need careful protocol validation before broadening link support beyond CH pairs.
- Too-aggressive polling can make the app feel worse on Wi-Fi; tasks must preserve the current lightweight app feel.
