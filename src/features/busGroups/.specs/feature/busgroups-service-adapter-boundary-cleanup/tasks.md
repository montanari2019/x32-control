# Tasks - BusGroups Service Adapter Boundary Cleanup

Date: 2026-06-14
Status: implemented; manual demo/X32 UAT pending

## Task List

- [x] T-001: Capture current BusGroups service boundary
  Reqs: REQ-001, REQ-002, REQ-003, REQ-008, REQ-011
  What: Inventory every BusGroups runtime/test import that references
  `X32BusGroupsService`, `isChannelInDca`, `X32Protocol`, raw `OscClient`, or
  X32 adapter internals before edits.
  Where:
  - `src/features/busGroups`
  - `__tests__/features/busGroups`
  - `src/shared/console/adapters/x32`
  Depends on: none
  Reuses: `context.md` current findings.
  Done when: Implementation has a checklist of imports and behavior that must
  remain compatible.
  Tests:
  ```sh
  rg -n "X32BusGroupsService|isChannelInDca|X32Protocol|OscClient|adapters/x32" src/features/busGroups __tests__/features/busGroups
  npx tsc --noEmit --pretty false
  ```
  Gate: No runtime rename begins until the current dependency surface is known.

- [x] T-002: Introduce neutral `BusGroupsService`
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-009, REQ-010
  What: Create a neutral feature service that preserves the current public
  methods while delegating through `IConsoleAdapter`.
  Where:
  - `src/features/busGroups/services/BusGroupsService.ts`
  - `src/features/busGroups/services/X32BusGroupsService.ts`
  Depends on: T-001
  Reuses:
  - Current `X32BusGroupsService` adapter delegation behavior.
  - `ConsoleAdapterFactory`.
  - `IConsoleAdapter`.
  Implementation detail:
  - Move the implementation to `BusGroupsService.ts`.
  - Keep the injected `OscClient` path only as compatibility/test support.
  - If needed, make `X32BusGroupsService.ts` a temporary alias:
    `export { BusGroupsService as X32BusGroupsService } from './BusGroupsService';`.
  Done when:
  - `BusGroupsService` exposes the same feature-facing methods as the current
    service.
  - Runtime behavior is unchanged for default adapter selection.
  - Any retained X32 alias is tiny and documented.
  Tests:
  ```sh
  npx tsc --noEmit --pretty false
  ```
  Gate: No hook changes until the neutral service compiles.

- [x] T-003: Remove duplicated feature-level DCA helper
  Reqs: REQ-006, REQ-011
  What: Delete the duplicated `isChannelInDca` implementation from the
  BusGroups feature service boundary, or replace it with a documented temporary
  compatibility export only if a visible import still requires it.
  Where:
  - `src/features/busGroups/services/BusGroupsService.ts`
  - `src/features/busGroups/services/X32BusGroupsService.ts`
  - `src/shared/console/adapters/x32/X32Adapter/x32BusGroupsUtils.ts`
  Depends on: T-002
  Reuses: adapter-owned `isChannelInDca`.
  Done when:
  - Feature runtime code does not own DCA bitmask parsing.
  - `rg` shows no duplicated implementation under `src/features/busGroups`.
  Tests:
  ```sh
  rg -n "Math\\.floor\\(dcaBitmask|isChannelInDca" src/features/busGroups src/shared/console/adapters/x32
  npx tsc --noEmit --pretty false
  ```
  Gate: DCA assignment tests remain green after helper cleanup.

- [x] T-004: Rewire BusGroups hooks to neutral service
  Reqs: REQ-001, REQ-007, REQ-009
  What: Update hooks to instantiate/type against `BusGroupsService`.
  Where:
  - `src/features/busGroups/hooks/useBusGroups.ts`
  - `src/features/busGroups/hooks/useOscSubscription.ts`
  Depends on: T-002
  Reuses: existing hook state, subscription lifecycle, and cleanup behavior.
  Done when:
  - `useBusGroups` imports `BusGroupsService`.
  - `useOscSubscription` accepts `BusGroupsService` or a narrow service
    interface instead of `X32BusGroupsService`.
  - Hook behavior remains unchanged.
  Tests:
  ```sh
  npx jest __tests__/features/busGroups/hooks/useBusGroups.test.ts --runInBand
  npx tsc --noEmit --pretty false
  ```
  Gate: Bus Master meter focus/resubscribe behavior remains covered.

- [x] T-005: Rewrite service tests as adapter-boundary tests
  Reqs: REQ-002, REQ-003, REQ-004, REQ-005, REQ-008
  What: Rename/update the service test so it validates neutral service
  delegation to `IConsoleAdapter` instead of X32 OSC protocol internals.
  Where:
  - `__tests__/features/busGroups/services/BusGroupsService.test.ts`
  - `__tests__/features/busGroups/services/X32BusGroupsService.test.ts`
  - `__tests__/shared/console` if protocol-specific assertions are moved
  Depends on: T-002, T-004
  Reuses:
  - Existing service test setup.
  - `ConsoleAdapterFactory` injection pattern.
  - Existing shared console adapter tests for X32 protocol behavior.
  Implementation detail:
  - Prefer mocked `IConsoleAdapter` delegation assertions for the feature
    service.
  - Move `/meters/2` path/renewal assertions to X32 adapter tests only if they
    are not already covered after adapter decomposition.
  Done when:
  - Feature service tests no longer need to assert `X32Protocol` paths.
  - Tests prove the neutral service forwards lifecycle, initial state, writes,
    scalar subscriptions, and Bus Master meter subscription.
  Tests:
  ```sh
  npx jest __tests__/features/busGroups/services --runInBand
  npx jest __tests__/shared/console --runInBand
  ```
  Gate: Protocol-specific tests live at adapter/shared-console level, not the
  feature service boundary.

- [x] T-006: Update hook tests and Jest mocks
  Reqs: REQ-001, REQ-007, REQ-008, REQ-009
  What: Change mocks/imports in BusGroups hook tests from
  `X32BusGroupsService` to `BusGroupsService`, preserving existing assertions.
  Where:
  - `__tests__/features/busGroups/hooks/useBusGroups.test.ts`
  - any other BusGroups tests found by T-001
  Depends on: T-004, T-005
  Reuses: current hook test fixture data and meter listener mocks.
  Done when:
  - No feature test mocks the X32-named service unless validating the temporary
    compatibility alias.
  - Existing hook tests pass without behavior changes.
  Tests:
  ```sh
  npx jest __tests__/features/busGroups --runInBand
  ```
  Gate: No test-only behavior divergence from runtime service imports.

- [x] T-007: Remove or document the legacy `X32BusGroupsService` alias
  Reqs: REQ-001, REQ-008, REQ-009, REQ-011, REQ-012
  What: Decide whether the legacy service file can be deleted now or should
  remain as a tiny compatibility alias for one migration window.
  Where:
  - `src/features/busGroups/services/X32BusGroupsService.ts`
  - `src/features/busGroups/.specs/STATE.md`
  - this `tasks.md`
  Depends on: T-006
  Reuses: import inventory from T-001.
  Done when:
  - Either `X32BusGroupsService.ts` is removed and all imports are migrated, or
    it contains only a documented compatibility export.
  - `rg` output proves no BusGroups runtime code depends on the legacy name.
  Tests:
  ```sh
  rg -n "X32BusGroupsService" src/features/busGroups __tests__/features/busGroups
  npx tsc --noEmit --pretty false
  ```
  Gate: Keep compatibility only if deleting the file would create unnecessary
  churn outside the feature boundary.

- [x] T-008: Run full focused regression gates
  Reqs: REQ-003, REQ-004, REQ-007, REQ-008, REQ-012
  What: Run the automated checks that cover BusGroups and the shared console
  boundary.
  Where: repo tests.
  Depends on: T-007
  Reuses: `.specs/codebase/TESTING.md`.
  Done when: All focused checks pass, or any unrelated/pre-existing failure is
  documented with evidence.
  Tests:
  ```sh
  npx tsc --noEmit --pretty false
  npx jest __tests__/features/busGroups --runInBand
  npx jest __tests__/shared/console --runInBand
  git diff --check
  ```
  Gate: No BusGroups behavior or adapter-boundary regression.

- [x] T-009: Update docs and implementation log
  Reqs: REQ-012
  What: Record the new BusGroups service boundary, retained aliases, verification
  results, and manual UAT notes.
  Where:
  - `src/features/busGroups/.specs/STATE.md`
  - `src/features/busGroups/.specs/feature/busgroups-service-adapter-boundary-cleanup/tasks.md`
  - `.specs/codebase/STRUCTURE.md` if file names change
  - `logs/YYYY-MM-DD_*`
  Depends on: T-008
  Reuses: existing spec/log conventions.
  Done when:
  - Future maintainers can see why the service is neutral and where X32 protocol
    behavior lives.
  - Manual UAT pending/done status is explicit.
  Tests:
  ```sh
  git diff --check
  ```
  Gate: Docs reflect the actual final implementation, not the intended one.

## Implementation Notes

- Added `src/features/busGroups/services/BusGroupsService.ts` as the neutral
  feature service facade.
- Converted `src/features/busGroups/services/X32BusGroupsService.ts` into a
  one-line compatibility alias:
  `export { BusGroupsService as X32BusGroupsService } from './BusGroupsService';`.
- Migrated `useBusGroups` and `useOscSubscription` to type against
  `BusGroupsService`.
- Removed the duplicated feature-level `isChannelInDca` implementation.
- Removed feature runtime imports of `@shared/osc/*`, `X32Protocol`, and
  X32 adapter internals.
- Rewrote feature service tests to validate `IConsoleAdapter` delegation.
- Moved `/meters/2` Bus Master protocol assertions to
  `__tests__/shared/console/X32AdapterBusMasterMeter.test.ts`.

## Verification

Passed on 2026-06-14:

```sh
npx tsc --noEmit --pretty false
npx jest __tests__/features/busGroups --runInBand
npx jest __tests__/shared/console --runInBand
git diff --check
```

Inventory after implementation:

```sh
rg -n "X32BusGroupsService|isChannelInDca|X32Protocol|OscClient|adapters/x32" src/features/busGroups __tests__/features/busGroups
```

Only the documented `X32BusGroupsService` compatibility alias remains.

Manual demo/real X32/M32 UAT remains pending.
