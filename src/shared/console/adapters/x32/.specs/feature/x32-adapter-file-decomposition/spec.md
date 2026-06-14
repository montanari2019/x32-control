# X32 Adapter File Decomposition Spec

Date: 2026-06-14
Status: planned
Scope: local X32 adapter refactor

## Problem

`src/shared/console/adapters/x32/X32Adapter.ts` currently contains about 1100
lines and owns many unrelated responsibilities in one class/file. This makes the
adapter hard to review, risky to change, and difficult to extend safely for
future console-specific behavior.

## Goal

Split the current X32 adapter implementation into focused files under an
`X32Adapter/` folder while preserving the public import and all runtime
behavior.

Target high-level structure:

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

Exact filenames may change during implementation if the final split is cleaner,
but the responsibility boundaries must remain clear.

## Requirements

REQ-001: Preserve public imports

- Existing imports from `@shared/console/adapters/x32/X32Adapter` must continue
  to work.
- The exported `X32Adapter` class and `isChannelInDca` helper must remain
  available from the same public path.

REQ-002: Keep behavior unchanged

- This refactor must not intentionally change X32/M32 OSC behavior, timings,
  paths, subscriptions, caches, or normalized return shapes.

REQ-003: Split by responsibility

- Connection/shared lease lifecycle must be separated from BUS loading,
  BusMix loading/control, BusGroups loading/control, meter subscriptions,
  `/node` handling, and low-level parsing helpers.

REQ-004: Keep `X32Adapter.ts` small

- The root `X32Adapter.ts` file must become a thin public facade/barrel.
- The root file should stay under 100 lines after the split.

REQ-005: Keep modules testable

- Pure parsing and mapping helpers should move into files that can be tested
  directly.
- Existing tests must continue to pass.
- Add focused tests for newly extracted helpers when they are not already
  covered.

REQ-006: Preserve adapter boundary

- Feature code must continue consuming adapter behavior only through feature
  services and `IConsoleAdapter`.
- No feature code should start importing new X32 implementation internals.

REQ-007: No WING runtime

- This refactor must not add, register, or activate WING runtime support.

REQ-008: Safe migration path

- The implementation should move code in small steps, running focused tests
  after each major responsibility extraction.
- Large code moves must avoid formatting churn unrelated to the split.

## Acceptance Criteria

- `src/shared/console/adapters/x32/X32Adapter.ts` is under 100 lines.
- X32 implementation files live under
  `src/shared/console/adapters/x32/X32Adapter/`.
- Public imports of `X32Adapter` and `isChannelInDca` still compile.
- `ConsoleAdapterFactory` tests pass.
- X32 source definition tests pass.
- BusMix tests pass.
- BusGroups tests pass.
- Shared OSC tests pass.
- Shared network tests pass.
- Adapter boundary guard still passes.
- `git diff --check` passes.
- No WING runtime registration exists.

## Out Of Scope

- Behavior changes to X32/M32 protocol.
- New feature functionality.
- WING implementation.
- UI changes.
- Route changes.
- Storage key migration.
- Meter smoothing or subscription strategy changes.
- Renaming feature services.

