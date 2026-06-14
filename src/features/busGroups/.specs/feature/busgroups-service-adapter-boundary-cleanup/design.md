# Design - BusGroups Service Adapter Boundary Cleanup

Date: 2026-06-14
Status: implemented; manual demo/X32 UAT pending

## Current Shape

```txt
useBusGroups
  -> new BusGroupsService()
       -> ConsoleAdapterFactory
            -> X32Adapter | DemoConsoleAdapter
```

`X32BusGroupsService` remains as a compatibility alias only.

## Target Shape

```txt
useBusGroups
  -> new BusGroupsService()
       -> ConsoleAdapterFactory
            -> IConsoleAdapter
                 -> X32Adapter | DemoConsoleAdapter | future adapters
```

The feature service should be named after the feature capability. The adapter
chooses protocol-specific behavior.

## Proposed File Changes

Primary runtime files:

```txt
src/features/busGroups/services/BusGroupsService.ts
src/features/busGroups/services/X32BusGroupsService.ts
src/features/busGroups/hooks/useBusGroups.ts
src/features/busGroups/hooks/useOscSubscription.ts
```

Tests:

```txt
__tests__/features/busGroups/services/BusGroupsService.test.ts
__tests__/features/busGroups/hooks/useBusGroups.test.ts
```

Optional compatibility:

```ts
// X32BusGroupsService.ts
export { BusGroupsService as X32BusGroupsService } from './BusGroupsService';
```

The compatibility alias should be temporary and documented if retained.

## Service API

The neutral service should preserve the current method names used by hooks:

- `connect(consoleIp)`
- `disconnect()`
- `startHeartbeat()`
- `stopHeartbeat()`
- `fetchInitialState(busId)`
- `subscribeToDcaFader(dcaNumber, listener)`
- `subscribeToDcaOn(dcaNumber, listener)`
- `subscribeToBusMasterFader(busId, listener)`
- `subscribeToBusMasterOn(busId, listener)`
- `subscribeToBusMasterMeter(busId, listener)`
- `setDcaFader(dcaNumber, value)`
- `setDcaOn(dcaNumber, isOn)`
- `setBusMasterFader(busId, value)`
- `setBusMasterOn(busId, isOn)`

This keeps the first cleanup mostly mechanical.

## Adapter Selection

Default runtime path:

```ts
adapterFactory.createAdapter({ ip: consoleIp })
```

Injected-client test path:

```ts
adapterFactory.createAdapter(
  { ip: consoleIp, kind: 'x32' },
  { client, useSharedLease: false },
)
```

This branch is intentionally X32-specific because an injected raw `OscClient`
represents the current X32 OSC test harness. A future cleaner option is a
mocked `IConsoleAdapter` injection instead of a raw transport client.

## DCA Helper

The feature-level duplicate implementation should be removed. Preferred
outcome:

- no feature runtime import of `isChannelInDca`;
- DCA bitmask logic remains inside the X32 adapter module where console DCA
  assignment normalization happens.

If an old test or consumer still imports it, use a documented temporary
compatibility export and add a task to remove that alias later.

## Test Strategy

The service test should validate adapter delegation, not X32 OSC internals:

- connects through `ConsoleAdapterFactory`;
- disconnects the current adapter;
- forwards BusGroups reads/writes/subscriptions;
- preserves injected-client compatibility behavior if retained.

Protocol assertions like `/meters/2` path, renewal timing, and blob decoding
belong to the X32 adapter or meter decoder tests after this cleanup.

## Risks

- Jest mocks currently reference `X32BusGroupsService`; they must be updated in
  the same task as hook imports.
- Removing the alias too aggressively can break old imports outside visible
  `rg` results if path aliases or generated files exist.
- The injected `OscClient` constructor path may look protocol-specific by
  design; document it as test compatibility until adapter injection is added.

## Migration Strategy

1. Add `BusGroupsService` with current behavior.
2. Convert hooks/tests to the neutral service.
3. Keep `X32BusGroupsService` as a short compatibility alias only if needed.
4. Move protocol-specific service tests to adapter-level tests or rewrite them
   as delegation tests.
5. Run focused gates and update local spec state.
