# X32 Adapter File Decomposition Design

Date: 2026-06-14
Status: planned

## Overview

Keep the root `X32Adapter.ts` as the stable public entrypoint and move the
implementation into a folder named `X32Adapter/`.

Preferred public entrypoint:

```ts
export { X32Adapter } from './X32Adapter/X32Adapter';
export { isChannelInDca } from './X32Adapter/x32BusGroupsUtils';
```

The implementation can then be split by adapter responsibilities without
changing imports in `ConsoleAdapterFactory` or tests.

## Existing Patterns Reused

- Keep `X32SourceDefinitions.ts` as the source metadata module.
- Keep `IConsoleAdapter` as the class contract.
- Keep `OscClient` and `SharedOscClient` as transport primitives.
- Keep existing BusMix `ChannelStructureCache` behavior.
- Keep existing meter decoder/routing helpers from BusMix.
- Keep existing focused Jest suites.
- Keep adapter boundary guardrails.

## Proposed Modules

```txt
src/shared/console/adapters/x32/
  X32Adapter.ts
  X32SourceDefinitions.ts
  X32Adapter/
    X32Adapter.ts
    X32AdapterContext.ts
    X32AdapterConstants.ts
    X32ConnectionLifecycle.ts
    X32BusAdapter.ts
    X32BusMixAdapter.ts
    X32BusGroupsAdapter.ts
    X32MeterSubscriptions.ts
    X32NodeClient.ts
    X32ChannelCache.ts
    x32OscValueUtils.ts
    x32BusGroupsUtils.ts
```

### `X32Adapter/X32Adapter.ts`

Owns the public class implementing `IConsoleAdapter`.

Responsibilities:

- Construct shared context/dependencies.
- Delegate each method to focused modules.
- Preserve public method names and signatures.
- Stay relatively small and readable.

### `X32AdapterContext.ts`

Shared state/dependencies for the composed adapter:

- endpoint;
- `OscClient`;
- shared lease;
- connected IP;
- shared lease option;
- node client;
- meter subscription manager.

This can be a class or plain object. The important part is explicit ownership,
not hidden module globals.

### `X32AdapterConstants.ts`

Shared constants:

- request timeouts/retries;
- expected channel count;
- DCA numbers;
- meter renew intervals;
- bus master meter interval;
- meter request throttle;
- default BUS names;
- X32 BUS colors;
- MCA color tokens.

### `X32ConnectionLifecycle.ts`

Connection methods:

- connect;
- disconnect;
- startHeartbeat;
- stopHeartbeat.

Owns shared lease setup/cleanup and must preserve current `OscClient` behavior.

### `X32BusAdapter.ts`

BUS selection methods:

- `getBuses`;
- bus color parsing;
- stereo bus link collapse.

Uses `X32Protocol`, `fetchBusStereoLinkMap`, cached stereo link helpers, and
the default BUS fallback names.

### `X32BusMixAdapter.ts`

BusMix methods:

- `getChannels`;
- `loadChannels`;
- `loadChannelsBulk`;
- `loadChannelsWithFallback`;
- `loadChannelsWithCache`;
- `fetchChannelLinkMap`;
- `loadChannelFaders`;
- channel fader/on/pan writes;
- channel fader/on/pan exact-address subscriptions.

Uses `X32SourceDefinitions`, `X32NodeClient`, and `X32ChannelCache`.

### `X32BusGroupsAdapter.ts`

BusGroups methods:

- `getBusGroupsState`;
- DCA fader/on writes;
- Bus Master fader/on writes;
- DCA subscriptions;
- Bus Master subscriptions.

Uses `x32BusGroupsUtils` for `isChannelInDca` and assigned-channel creation.

### `X32MeterSubscriptions.ts`

Meter methods/state:

- channel meter listener registration;
- `/meters/1` and `/meters/13` subscription ownership;
- Bus Master `/meters/2` subscription ownership;
- throttled `/meters` requests;
- interval cleanup.

This module is the sensitive part of the split: it must preserve renew intervals
and cleanup semantics exactly.

### `X32NodeClient.ts`

`/node` handling:

- response-mode detection;
- request chaining for no-echo mode;
- echo-mode request matching;
- retry behavior;
- timeout behavior.

Uses `x32OscValueUtils` for parsing.

### `X32ChannelCache.ts`

Channel cache mapping:

- load dynamic channel values from cached structure;
- save channel structure;
- preserve existing cache key behavior by using `ChannelStructureCache`.

### `x32OscValueUtils.ts`

Pure helpers:

- `asString`;
- `asNumber`;
- `getBlobArg`;
- `parseBusColor`;
- `sanitizeNodeValue`;
- `splitNodeValueString`;
- `oscArgToNodeValue`;
- `normalizeNodePath`;
- `parseNodeResponseValues`;
- `parseNodeFloat01`;
- `parseNodeInt`.

This file should get focused unit tests where practical.

### `x32BusGroupsUtils.ts`

BusGroups helpers:

- `isChannelInDca`;
- `buildAssignedChannelsFromIds`;

Keeps compatibility export through root `X32Adapter.ts`.

## Data Flow

```txt
ConsoleAdapterFactory
  -> X32Adapter.ts public entrypoint
    -> X32Adapter/X32Adapter class
      -> X32ConnectionLifecycle
      -> X32BusAdapter
      -> X32BusMixAdapter
        -> X32NodeClient
        -> X32ChannelCache
      -> X32BusGroupsAdapter
      -> X32MeterSubscriptions
```

## State And Persistence

- No persistence changes.
- `ChannelStructureCache` remains the persistence boundary for channel
  structure.
- Channel link map cache remains adapter-local behavior and should not change
  cache key semantics.
- Meter subscription state should remain instance-owned, not module-global.

## Error Handling

- Preserve current fallback behavior:
  - bus names/colors fall back when requests fail;
  - channel fields use safe request fallbacks;
  - `/node` failures fall back to per-path loading;
  - meter send failures stay best-effort.
- Do not introduce new user-facing error messages in this refactor.

## Testing Strategy

Focused tests:

- Existing `ConsoleAdapterFactory` and `X32SourceDefinitions` tests.
- Add `x32OscValueUtils` tests for `/node` parsing edge cases.
- Add `x32BusGroupsUtils` tests if `isChannelInDca` moves.

Regression gates:

```sh
npx tsc --noEmit --pretty false
npx jest __tests__/shared/console --runInBand
npx jest __tests__/features/busMix --runInBand
npx jest __tests__/features/busGroups --runInBand
npx jest __tests__/shared/osc --runInBand
npx jest __tests__/shared/network --runInBand --testTimeout=10000
git diff --check
```

Manual UAT:

- Real X32/M32 validation remains required before marking hardware-complete:
  - discovery;
  - BUS selection;
  - BusMix load/fader/mute/pan/meter;
  - BusGroups master/MCA/meter;
  - navigation between BusGroups and BusMix.

## Risks And Trade-Offs

- A class split can create awkward shared mutable context. Keep context explicit
  and typed.
- A purely mechanical split may preserve behavior but still leave unclear
  ownership. The task sequence should extract by behavior area, not by arbitrary
  line ranges.
- Meter cleanup and `/node` request matching are sensitive. Move them with
  focused tests and avoid changing control flow.
- Many modules can be worse than one large file if boundaries are too tiny.
  Target cohesive modules, not one helper per function.

