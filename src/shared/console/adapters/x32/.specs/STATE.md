# Local State - shared console X32 adapter

Last updated: 2026-06-14

## Scope

Adapter: `src/shared/console/adapters/x32`

Purpose:

- Own X32/M32-specific protocol behavior behind the shared console adapter
  boundary.
- Normalize X32/M32 OSC paths, source definitions, bus state, BusMix state,
  BusGroups state, meters, subscriptions, and lifecycle into the
  `IConsoleAdapter` contract consumed by feature services.

## Current Files

```txt
X32Adapter.ts
X32Adapter/
  X32Adapter.ts
  X32AdapterConstants.ts
  X32AdapterContext.ts
  X32BusAdapter.ts
  X32BusGroupsAdapter.ts
  X32BusMixAdapter.ts
  X32ChannelCache.ts
  X32ConnectionLifecycle.ts
  X32MeterSubscriptions.ts
  X32NodeClient.ts
  x32BusGroupsUtils.ts
  x32OscValueUtils.ts
X32SourceDefinitions.ts
```

## Current Behavior

- `X32Adapter.ts` is the stable public entrypoint and re-exports the adapter
  class plus `isChannelInDca`.
- `X32Adapter/X32Adapter.ts` composes focused modules for the runtime adapter
  implementation.
- Responsibilities are split by concern:
  - OSC connection lifecycle and shared lease ownership;
  - `/xremote` heartbeat;
  - BUS name/color loading and stereo BUS link collapse;
  - BusGroups master/DCA state, writes, and subscriptions;
  - BusMix channel loading;
  - `/node` bulk loading, response-mode detection, parsing, and fallback;
  - channel structure cache persistence;
  - channel link map cache;
  - CH/AUX/FX fader/on/pan writes;
  - exact-address fader/on/pan subscriptions;
  - `/meters/1`, `/meters/13`, and `/meters/2` subscriptions.
- `X32SourceDefinitions.ts` already separates CH/AUX/FX source path metadata.

## Current Decisions

- `X32Adapter.ts` is the public import used by `ConsoleAdapterFactory`.
- Feature services must not import X32 protocol internals directly.
- WING support remains documentation-only and must not be registered by this
  adapter decomposition work.
- The decomposition must preserve the current `IConsoleAdapter` runtime
  behavior and public imports.

## Known Concerns

- `X32Adapter.ts` is too large to review safely.
- Private method coupling is high because one class owns unrelated concerns.
- A broad mechanical split can accidentally change UDP/OSC timing, listener
  cleanup, cache keys, or meter stream ownership.
- Real X32/M32 UAT is still required for adapter-level changes even when
  automated tests pass.

## Future Spec Placement

Feature specs for this adapter should live under:

```txt
src/shared/console/adapters/x32/.specs/feature/[feature-name]/
```

## Implemented Specs

- `x32-adapter-file-decomposition`: implemented 2026-06-14. Split the large
  `X32Adapter.ts` implementation into focused files under an `X32Adapter/`
  folder while preserving the public `X32Adapter.ts` import as a thin
  entrypoint.

## Latest Verification Notes

- X32 adapter file decomposition passed:
  - `npx tsc --noEmit --pretty false`
  - `npx jest __tests__/shared/console --runInBand`
  - `npx jest __tests__/features/busMix --runInBand`
  - `npx jest __tests__/features/busGroups --runInBand`
  - `npx jest __tests__/shared/osc --runInBand`
  - `npx jest __tests__/shared/network --runInBand --testTimeout=10000`
  - real X32/M32 hardware UAT remains pending.
- Adapter normalization implementation previously passed:
  - `npx tsc --noEmit --pretty false`
  - `npx jest __tests__/shared/console --runInBand`
  - `npx jest __tests__/features/busMix --runInBand`
  - `npx jest __tests__/features/busGroups --runInBand`
  - `npx jest __tests__/shared/osc --runInBand`
  - `npx jest __tests__/shared/network --runInBand --testTimeout=10000`
