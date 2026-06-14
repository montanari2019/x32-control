# X32 Adapter File Decomposition Context

Date: 2026-06-14
Status: planned

## Scope

Local adapter refactor for:

```txt
src/shared/console/adapters/x32/X32Adapter.ts
```

The current file has about 1100 lines and mixes multiple adapter responsibilities
that should be easier to maintain as focused modules.

## User Request Summary

Create a local `.specs` structure inside the X32 adapter folder following
`docs/skills/tlc-spec-driven`, then create a feature plan to improve
`X32Adapter.ts` by breaking it into more files inside a folder named after the
file.

Requested target shape:

```txt
src/shared/console/adapters/x32/
  X32Adapter.ts
  X32Adapter/
    ...
```

The goal is maintainability. Runtime behavior must stay the same.

## Current Code Observations

`X32Adapter.ts` currently includes:

- exported `isChannelInDca`;
- OSC value helpers:
  - `asString`;
  - `asNumber`;
  - `getBlobArg`;
  - `parseBusColor`;
- `/node` parsing helpers:
  - `sanitizeNodeValue`;
  - `splitNodeValueString`;
  - `oscArgToNodeValue`;
  - `normalizeNodePath`;
  - `parseNodeResponseValues`;
  - `parseNodeFloat01`;
  - `parseNodeInt`;
- lifecycle state:
  - `OscClient`;
  - `SharedOscClientLease`;
  - shared lease toggle;
  - connected IP;
- BusMix state:
  - node response mode;
  - node request chain;
  - channel link map cache;
  - channel structure cache writes;
- meter state:
  - meter listener map;
  - intervals;
  - OSC unsubscribers;
  - throttled request timestamps;
- public `IConsoleAdapter` methods across:
  - connection;
  - buses;
  - BusGroups;
  - BusMix;
  - fader/on/pan writes;
  - scalar subscriptions;
  - meter subscriptions.

`X32SourceDefinitions.ts` already separates source metadata and should remain a
reused building block.

## Existing Tests To Preserve

- `__tests__/shared/console/ConsoleAdapterFactory.test.ts`
- `__tests__/shared/console/X32SourceDefinitions.test.ts`
- `__tests__/shared/console/adapterBoundaryGuard.test.ts`
- `__tests__/features/busMix/hooks/useMeterSubscription.test.ts`
- `__tests__/features/busGroups/services/X32BusGroupsService.test.ts`
- Existing BusMix, BusGroups, shared OSC, and shared network suites.

## Non-Regression Constraints

- Keep the public import stable:
  - `@shared/console/adapters/x32/X32Adapter`
- Preserve `ConsoleAdapterFactory` behavior.
- Preserve exported `isChannelInDca` or provide a compatible export.
- Preserve `IConsoleAdapter` behavior exactly.
- Preserve current X32/M32 default port `10023`.
- Preserve shared OSC lease behavior and `/xremote` ref counting.
- Preserve `/node` bulk loading/fallback behavior.
- Preserve exact-address fader/on/pan subscriptions.
- Preserve meter stream ownership:
  - `/meters/1` for input channels;
  - `/meters/13` for AUX/FX;
  - `/meters/2` for Bus Master.
- Preserve channel structure cache keys.
- Do not add WING runtime code.
- Do not change feature service facades.

## Open Questions For Implementation Time

- Should `X32Adapter.ts` become only a barrel export, or a tiny class facade
  that re-exports `X32Adapter/X32Adapter`?
- Should modules be pure functions that receive a context object, or small
  classes with explicit dependencies?
- Should `/node` parsing helpers get standalone unit tests before moving the
  code, or during the move?
- What line-count target should be enforced for each file? Planned default:
  keep each module near or below 200 lines where practical, and keep the public
  `X32Adapter.ts` under 100 lines.

