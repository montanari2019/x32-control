# Console Adapter Normalization Design

Date: 2026-06-14
Status: planned

## Overview

Add a shared console adapter layer that acts as an anti-corruption boundary
between UI/features and console-specific protocol code.

```txt
UI / feature hooks
  -> existing feature services as compatibility facades
    -> ConsoleAdapterFactory
      -> IConsoleAdapter
        -> X32Adapter
        -> DemoConsoleAdapter
        -> future WingAdapter placeholder only
          -> OscClient / SharedOscClient / UdpTransport / protocol helpers
```

This keeps the migration brownfield-friendly: the first implementation can
preserve public feature service APIs while moving protocol decisions below the
adapter boundary.

## Existing Patterns Reused

- Shared infrastructure under `src/shared`.
- Feature services remain the dependency point for feature hooks during the
  first migration pass.
- `OscClient` continues to own OSC encode/decode request and exact-address
  local subscriptions.
- `SharedOscClient` continues to own endpoint lease reuse.
- `UdpTransport` continues to own UDP bind/send/receive and iOS Local Network
  permission preflight.
- Existing mock/demo provider behavior is reused behind a demo adapter.
- Existing Jest focused suites and TypeScript gates remain the regression
  safety net.

## Proposed Modules

```txt
src/shared/console/
  IConsoleAdapter.ts
  ConsoleAdapterFactory.ts
  ConsoleEndpoint.ts
  ConsoleAdapterKind.ts
  ConsoleAdapterRegistry.ts
  types.ts
  adapters/
    x32/
      X32Adapter.ts
      X32ConsoleProtocol.ts
      X32SourceDefinitions.ts
    demo/
      DemoConsoleAdapter.ts
    wing/
      README.md
```

Notes:

- `wing/README.md` documents future constraints only. It must not export a
  runtime adapter in this feature.
- `X32ConsoleProtocol.ts` may wrap or incrementally absorb
  `src/shared/osc/X32Protocol.ts`; avoid a large rename unless tests first
  prove path parity.
- `types.ts` should define normalized DTOs only if the migration can avoid
  circular imports. Otherwise, first use existing structural feature types and
  create a follow-up task to move type ownership.

## Adapter Contract Shape

The exact TypeScript shape should be finalized during T-002, but the contract
should cover these capabilities:

```ts
export interface IConsoleAdapter {
  readonly kind: ConsoleAdapterKind;
  readonly endpoint: ConsoleEndpoint;

  connect(): Promise<void>;
  disconnect(): void;

  getBuses(): Promise<ConsoleBus[]>;
  getBusGroupsState(busId: number): Promise<ConsoleBusGroupsState>;
  getChannels(busId: number): Promise<ConsoleChannel[]>;
  fetchChannelLinkMap?(): Promise<Map<number, number>>;

  setChannelFader(channel: ConsoleChannelRef, busId: number, value: number): Promise<void>;
  setChannelOn(channel: ConsoleChannelRef, busId: number, isOn: boolean): Promise<void>;
  setChannelPan(channel: ConsoleChannelRef, busId: number, value: number): Promise<void>;
  setDcaFader(dcaNumber: number, value: number): Promise<void>;
  setDcaOn(dcaNumber: number, isOn: boolean): Promise<void>;
  setBusMasterFader(busId: number, value: number): Promise<void>;
  setBusMasterOn(busId: number, isOn: boolean): Promise<void>;

  subscribeChannelLevel(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): Unsubscribe;
  subscribeChannelOn(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: boolean) => void,
  ): Unsubscribe;
  subscribeChannelPan(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): Unsubscribe;
  subscribeMeter(
    channel: ConsoleChannelRef,
    listener: (values: ChannelMeterValues) => void,
  ): Unsubscribe;
  subscribeBusMasterMeter(busId: number, listener: (dbfs: number) => void): Unsubscribe;
  subscribeDcaFader(dcaNumber: number, listener: (value: number) => void): Unsubscribe;
  subscribeDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): Unsubscribe;
  subscribeBusMasterFader(busId: number, listener: (value: number) => void): Unsubscribe;
  subscribeBusMasterOn(busId: number, listener: (isMuted: boolean) => void): Unsubscribe;
}
```

Design intent:

- UI/features ask for normalized concepts, not protocol paths.
- The adapter accepts stable channel references instead of requiring features
  to construct protocol paths.
- Cleanup always returns `Unsubscribe`.
- Subscription names describe app concepts, not X32 implementation details.

## Data Flow

```txt
ConsoleDiscoveryScreen
  -> ConsoleDiscoveryService
    -> ConsoleAdapterFactory.discovery / NetworkScanner
      -> X32 discovery using /info on 10023
      -> Demo console entry
      -> normalized ConsoleDevice list

BusSelectionScreen
  -> BusService facade
    -> adapter.getBuses()
      -> X32Adapter reads /bus/XX/config/* and /config/buslink/*
      -> normalized Bus list

BusGroupsScreen
  -> X32BusGroupsService facade or renamed BusGroupsConsoleService
    -> adapter.getBusGroupsState()
    -> adapter.subscribeBusMasterMeter()
    -> adapter.setDcaFader()/setBusMasterFader()

BusMixScreen
  -> BusMixService facade
    -> adapter.getChannels()
    -> adapter.subscribeChannelLevel()/On()/Pan()/Meter()
    -> adapter.setChannelFader()/On()/Pan()
```

## Factory Selection

Initial runtime adapter kinds:

- `demo`: selected for `DEMO_CONSOLE_IP` and dev mock IPs.
- `x32`: selected for real discovered X32/M32 devices and manual IP
  validation.

Potential endpoint shape:

```ts
type ConsoleEndpoint = {
  id: string;
  ip: string;
  port: number;
  name?: string;
  model?: string;
  firmware?: string;
  kind?: ConsoleAdapterKind;
};
```

Selection rules for this feature:

- Demo/mock IPs always return `DemoConsoleAdapter`.
- X32/M32 discovered devices return `X32Adapter`.
- Missing kind defaults to X32/M32 only for backward compatibility with current
  route params, because routes currently pass only `consoleIp` and names.
- Future unknown kinds must not silently default to X32 once routes carry
  explicit adapter kind.

## X32/M32 Adapter Responsibilities

The X32 adapter keeps current behavior:

- Connect on port `10023`.
- Use `/info` for current discovery.
- Use `/xremote` keep-alive through existing ref-counted `OscClient`.
- Reuse shared OSC leases for overlapping BusMix/BusGroups sessions.
- Generate current paths through `X32Protocol`.
- Preserve current source definitions for:
  - CH `1..32`;
  - AUX `1..8`;
  - FX Return `1..8`.
- Preserve `/node` bulk loading with response-mode detection and per-path
  fallback.
- Preserve bus and channel stereo link maps.
- Preserve exact-address subscriptions for fader/on/pan receive.
- Preserve current meter stream ownership:
  - BusMix CH: `/meters/1`;
  - BusMix AUX/FX: `/meters/13`;
  - BusGroups Bus Master: `/meters/2`.

## Demo Adapter Responsibilities

The demo adapter wraps or migrates the current mock provider behavior:

- Demo console remains available offline.
- Demo buses, channels, MCAs, faders, mutes, pan, and meters match current
  behavior.
- Demo code satisfies the same adapter contract as X32.
- Demo code must not depend on X32 paths or OSC transport.

## Future WING Notes

No WING runtime implementation is included here.

The adapter boundary is designed to handle known future differences:

- WING OSC port `2223`, not X32 `10023`.
- WING discovery can use `WING?` on UDP port `2222`, not X32 `/info`.
- WING channel paths use a different style such as `/ch/1/...`, not
  zero-padded X32 paths like `/ch/01/...`.
- WING OSC event subscriptions use `/*s`, `/*S`, or binary subscription forms
  and must be renewed differently from X32 `/xremote`.
- WING OSC appears constrained to a single active event subscription, so a
  future adapter must centralize and multiplex receive behavior carefully.

## State And Persistence

- No new user-facing settings are required.
- No storage migration is planned.
- Existing storage keys must continue using the same console identity inputs
  unless a compatibility layer maps old and new identities.
- If `ConsoleEndpoint.kind` is added to route params later, it must be optional
  during migration so existing navigation behavior remains valid.

## Error Handling

- Preserve `AppError` and localized error messages.
- Adapter factory should return predictable unsupported-console errors when a
  future kind is requested without an implementation.
- X32 adapter should preserve current fallback behavior for partial read
  failures, especially bus names/colors and channel load fallbacks.
- Network/UDP diagnostics stay in `UdpTransport` and `NetworkScanner`.

## Testing Strategy

Unit tests:

- Adapter factory selection for demo, dev mock, X32/M32, unknown kind.
- X32 protocol parity for paths currently used by BusService, BusMixService,
  and X32BusGroupsService.
- X32 adapter calls expected `OscClient` paths for bus loading, channel sends,
  DCA sends, Bus Master sends, and subscriptions.
- Demo adapter returns stable demo data and emits subscriptions.
- Compatibility facades preserve current public service APIs.
- Listener cleanup and disconnect cleanup.

Existing regression gates:

- `yarn tsc`
- `yarn jest __tests__/shared/osc --runInBand`
- `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`
- `yarn jest __tests__/features/busMix --runInBand`
- `yarn jest __tests__/features/busGroups --runInBand`
- `git diff --check`

Manual UAT:

- Demo full flow.
- Real X32/M32 discovery.
- BUS selection with mono and linked stereo buses.
- BusGroups master fader/mute/meter.
- MCA fader/mute and persisted assignments.
- BusMix CH/AUX/FX load, fader, mute/on, pan, meters, linked channels,
  presets, and return navigation from BusMix to BusGroups.

## Risks And Trade-Offs

- Moving too much code at once can hide behavior changes. Tasks must separate
  type/contract creation, adapter extraction, feature rewiring, and cleanup.
- Current `MixerControlProvider` already resembles part of the needed contract
  but sits at an awkward layer because it imports feature-owned types. Reusing
  it directly as the final abstraction would preserve that coupling.
- Adding `kind` to navigation params is desirable for future consoles but
  should be optional in this feature to avoid route regressions.
- X32 receive-path performance is known sensitive. Do not reintroduce broad
  scalar subscription/coalescing behavior during this refactor.
- Hardware validation remains required because automated tests cannot prove
  real UDP/OSC timing, meters, or discovery behavior.
