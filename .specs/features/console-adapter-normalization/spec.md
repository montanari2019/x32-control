# Console Adapter Normalization Spec

Date: 2026-06-14
Status: planned
Scope: global app architecture feature

## Problem

Tacimix currently exposes X32/M32 protocol details through multiple feature
services. The UI consumes normalized app concepts such as consoles, buses,
channels, groups, faders, mutes, pans, and meters, but the normalization is
implemented separately in each feature service.

That makes future console support risky because a console with different ports,
paths, discovery, subscription, keepalive, source numbering, or meter streams
would force changes across the UI and feature hooks.

## Goal

Introduce a single UI-facing console adapter contract that returns the same
normalized data shapes the app consumes today while isolating console-specific
protocol details underneath the adapter layer.

Initial implementation scope is architecture and migration only:

- keep X32/M32 as the only real console implementation;
- keep Demo/mock behavior;
- do not implement WING runtime support yet;
- leave a clear extension point for future adapters.

## Requirements

REQ-001: Single UI-facing adapter contract

- Features must be able to depend on one normalized console adapter interface
  instead of importing X32/M32 protocol details directly.
- The adapter contract must cover discovery/identity, BUS selection, BusMix
  channels/control, BusGroups master/MCA control, meters, subscriptions,
  connection lifecycle, and cleanup.

REQ-002: Preserve current normalized data shapes

- The adapter must supply data compatible with the UI shapes currently used by
  `consoleDiscovery`, `busSelection`, `busGroups`, and `busMix`.
- Existing behavior must not require UI-level rewrites or new feature state
  models in this feature.

REQ-003: Keep X32/M32 behavior unchanged

- The initial production adapter must preserve current X32/M32 behavior:
  UDP port `10023`, `/info`, `/xremote`, `/node` bulk loading with fallback,
  current CH/AUX/FX/BUS/DCA paths, current meter streams, and current request
  timeouts unless a task explicitly proves a no-regression change.

REQ-004: Keep Demo behavior unchanged

- Demo/mock console behavior must remain available offline and must satisfy the
  same adapter contract as the real X32/M32 adapter.
- Demo routing must not leak into production protocol logic.

REQ-005: Adapter factory

- A `ConsoleAdapterFactory` must choose the correct adapter from console
  endpoint/profile information.
- In this feature, supported runtime adapter kinds are limited to X32/M32 and
  Demo/mock.
- Unknown or future console kinds must fail predictably or stay unreachable
  until implemented.

REQ-006: Protocol isolation

- Console-specific paths, ports, keepalive/subscription semantics, source
  numbering, and meter decoding must live below the adapter boundary.
- UI/features must not need to know whether a future console uses
  `/ch/01/...`, `/ch/1/...`, `/xremote`, or a different subscription command.

REQ-007: Shared connection lifecycle

- The adapter layer must preserve current shared OSC client lease behavior,
  reference-counted `/xremote`, socket cleanup, and listener cleanup.
- Navigating between BusGroups and BusMix must not create stale listeners,
  duplicate sockets, or frozen meters.

REQ-008: Storage compatibility

- Existing storage namespaces and keys for presets, MCA state, and channel
  structure cache must remain compatible.
- Console identity changes needed by the adapter must not orphan existing X32
  user data.

REQ-009: Incremental migration

- The implementation must allow current feature services to become thin
  facades over the adapter before any file renames or wider cleanup.
- Large code moves must be separated from behavior changes.

REQ-010: Future WING extension point without WING implementation

- The design must document where a future `WingAdapter` would live and which
  differences it must handle.
- This feature must not add WING discovery, WING paths, WING writes, or WING
  subscriptions as active runtime behavior.

REQ-011: Verification

- Automated tests must cover adapter factory selection, X32 adapter path
  preservation, demo adapter behavior, cleanup, and feature-service
  compatibility facades.
- Existing BusMix, BusGroups, shared OSC, and shared network tests must pass.
- Real-console UAT must verify no regression on the current X32/M32 workflow.

## Acceptance Criteria

- Feature services can obtain console data/control through the adapter factory
  while the UI receives the same `ConsoleDevice`, `Bus`, `Channel`, and
  `BusGroupsState`-compatible values as before.
- Demo console still appears and remains usable without a real console.
- Real X32/M32 discovery still uses `/info` and port `10023`.
- X32/M32 bus loading still collapses linked stereo odd/even BUS pairs.
- BusMix still loads 48 sources, uses `/node` when available, and falls back to
  per-path requests when needed.
- BusMix fader, mute/on, pan, linked-channel behavior, presets, channel
  structure cache, and meters behave as before.
- BusGroups Bus Master, MCA faders/mutes, local MCA assignment persistence, and
  `/meters/2` Bus Master meter behave as before.
- `WingAdapter` is not active in runtime code in this feature.
- `yarn tsc` passes.
- Focused adapter/factory tests pass.
- Existing BusMix, BusGroups, shared OSC, and shared network suites pass.
- Manual X32/M32 UAT passes for discovery, BUS selection, BusGroups, BusMix,
  faders, mutes, pans, meters, presets, and navigation between screens.

## Out Of Scope

- Implementing WING support.
- Implementing WING discovery, `WING?`, port `2222`, port `2223`, or WING OSC
  subscription behavior.
- Adding a console type picker to the UI.
- Changing UI layouts or visual design.
- Changing fader math, pan math, meter smoothing, or meter visuals.
- Changing storage key formats for existing user data.
- Reintroducing broad scalar subscriptions that were rolled back.
- Replacing `react-native-udp`.
- Adding TCP/native WING API support.
