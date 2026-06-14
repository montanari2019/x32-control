# Console Adapter Normalization Context

Date: 2026-06-14
Status: planned

## Scope

Global architecture feature: introduce a single normalized console adapter
contract between UI/features and mixer-specific protocol implementations.

Reason for global placement:

- The change crosses `consoleDiscovery`, `busSelection`, `busGroups`,
  `busMix`, shared OSC/network code, demo provider, tests, and docs.
- It is not owned by one `src/features/*` folder.
- `.specs/project/STATE.md` says app-wide cross-feature specs belong under
  `.specs/features/[feature-name]/`.

## User Request Summary

Create an interface that supplies data to the UI in the shape the UI consumes
today. The console-specific layer talks to the desk, the adapter normalizes the
result, and the UI/features consume only the normalized contract.

The goal is to make future console support possible without changing the UI
surface every time a protocol differs.

Target architecture:

```txt
UI / Features
  -> IConsoleAdapter
    -> ConsoleAdapterFactory
      -> X32Adapter
      -> future WingAdapter
```

Important constraint: do not add a new console implementation now. This feature
plans the interface/factory/structure and migrates the current X32/M32/demo
behavior behind it without regressing anything that already works.

## Current Code Observations

Current console-specific behavior is spread across feature services:

- `src/features/consoleDiscovery/services/ConsoleDiscoveryService.ts`
  delegates to `NetworkScanner`.
- `src/features/busSelection/services/BusService.ts` owns bus loading, bus
  colors, stereo bus links, mock/demo selection, `OscClient`, and
  `X32Protocol`.
- `src/features/busMix/services/BusMixService.ts` owns source definitions,
  X32 path selection for CH/AUX/FX sends, `/node` bulk loading/fallback,
  channel link maps, send writes, pan/on subscriptions, shared OSC leases, and
  mock/demo selection.
- `src/features/busGroups/services/X32BusGroupsService.ts` owns BUS master,
  DCA/MCA state, DCA assignments, `/meters/2` master meter subscription,
  shared OSC leases, heartbeat, and mock/demo selection.
- `src/shared/osc/X32Protocol.ts` centralizes X32/M32 path construction and
  default port `10023`.
- `src/shared/osc/OscClient.ts` owns UDP OSC request/send/subscribe behavior
  and `/xremote` keep-alive ref counting.
- `src/shared/osc/SharedOscClient.ts` owns endpoint lease reuse.
- `src/shared/mixer/MixerControlProvider.ts` is an existing provider interface,
  but it imports feature-owned types and is used primarily by the demo/mock
  path, not as the app-wide production console abstraction.

The current normalized shapes consumed by UI/features are:

- `ConsoleDevice`
- `Bus`
- `BusGroupsState`
- `Channel`
- `ChannelMeterValues`

Those shapes must remain compatible through the migration.

## Relevant Logs Read

- `logs/2026-05-24_12-24-56-global-specs-brownfield-map.txt`
  - Confirms global `.specs` and feature-local scaffolding were created for
    brownfield planning.
- `logs/2026-05-24_20-32-54-busmix-remote-fader-subscription-sync-implementation.txt`
  - Shows an attempted receive-path expansion added scalar subscriptions and
    was sensitive to fader fluidity.
- `logs/2026-05-25_20-56-39-busmix-remote-fader-sync-rollback-performance-restore-implementation.txt`
  - Confirms that subscription/coalescing changes were rolled back because the
    older exact-address receive path felt smoother. This is a non-regression
    warning for any adapter migration.
- `logs/2026-05-31_16-20-25-busgroups-bus-master-meter-rail-implementation.txt`
  - Confirms `/meters/2` Bus Master meter behavior and BusMix meter streams
    must be preserved.

## External Research Notes

Sources consulted:

- Patrick-Gilles Maillot X32 repo:
  https://github.com/pmaillot/X32-Behringer
- Unofficial X32/M32 OSC Remote Protocol PDF:
  https://wiki.munichmakerlab.de/images/1/17/UNOFFICIAL_X32_OSC_REMOTE_PROTOCOL_%281%29.pdf
- Janis Streib X32 OSC notes:
  https://janis-streib.de/post/behringer-x32-osc-is-quirky/
- WING Remote Protocols FW 3.0.6 PDF:
  https://cdn-media.empowertribe.com/f255e02a7d164692b3ac2aff862cfcad/WING%20Remote%20Protocols%20FW%203.0.6.pdf
- Bitfocus Companion Behringer WING module:
  https://github.com/bitfocus/companion-module-behringer-wing
- Bitfocus WING connection page:
  https://bitfocus.io/connections/behringer-wing

Research conclusions relevant to this feature:

- X32/M32 OSC uses UDP port `10023`, replies to the client's source port, and
  uses `/xremote` for deferred event updates.
- X32/M32 UDP behavior can drop packets under high traffic; the adapter must
  keep current conservative receive/write behavior and avoid broad new
  subscriptions as a side effect of refactoring.
- WING OSC differs materially: OSC uses UDP port `2223`, discovery can use a
  native `WING?` datagram on port `2222`, OSC subscriptions are different and
  must be kept alive separately.
- WING supports only one active OSC event subscription at a time according to
  the researched protocol document, which is a critical future design
  constraint.
- Third-party WING tooling such as the Bitfocus Companion module keeps protocol
  command definitions organized separately from the module UI/actions, which
  supports the proposed adapter/protocol separation.

## Non-Regression Constraints

- Existing X32/M32 behavior remains the product baseline.
- Demo console must keep working offline.
- Current UI data shapes must remain compatible.
- `UdpTransport.bind()` Local Network permission preflight must be preserved.
- Shared OSC leases must continue preventing duplicate sockets where BusMix and
  BusGroups overlap.
- BusMix exact-address receive path and background sync must not be replaced by
  broad subscriptions in this refactor.
- BusMix `/meters/1` and `/meters/13` isolation must be preserved.
- BusGroups `/meters/2` Bus Master meter must be preserved.
- Storage keys for presets, MCA state, and channel structure cache must not
  change.

## Open Questions For Implementation Time

- Should `ConsoleDevice` gain an explicit `adapterKind`/`consoleFamily`, or
  should adapter selection infer from `model` and `port` until future console
  support is implemented?
- Should normalized DTOs live entirely in `src/shared/console/types.ts`, with
  feature types becoming aliases, or should the first migration keep existing
  feature types and use structural TypeScript compatibility?
- Should current feature services be renamed during migration, or should they
  become thin compatibility facades over adapters first to reduce review risk?
- Should manual IP validation support a console type selector now, or remain
  X32/M32-only until a real WING implementation is planned?
