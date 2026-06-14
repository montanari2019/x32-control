# Tasks - BusMix Meter Subscription Adapter Boundary Cleanup

Date: 2026-06-14
Status: planned

## Validation Result

Runtime features already consume the console adapter facade for console
communication:

- `BusService` -> `ConsoleAdapterFactory` / `IConsoleAdapter`
- `BusMixService` -> `ConsoleAdapterFactory` / `IConsoleAdapter`
- `BusGroupsService` -> `ConsoleAdapterFactory` / `IConsoleAdapter`

Remaining migration target:

- `__tests__/features/busMix/hooks/useMeterSubscription.test.ts` still imports
  `@shared/osc/SharedOscClient` and `@shared/osc/X32Protocol`.

## Task List

- [ ] T-001: Reconfirm feature boundary inventory
  Reqs: REQ-001, REQ-002, REQ-006
  What: Re-run the boundary audit before edits and record every runtime/test
  feature import of protocol, adapter internals, and console facades.
  Where:
  - `src/features`
  - `__tests__/features`
  Depends on: none
  Reuses: `context.md` audit commands.
  Done when:
  - Runtime feature code has no direct protocol/adapter-internal imports.
  - The only protocol import gap is confirmed to be the BusMix meter hook test,
    or any new gap is added to this task list before implementation.
  Tests:
  ```sh
  rg -n "@shared/console/adapters|@shared/osc|X32Protocol|OscClient|UdpTransport|X32Adapter" src/features __tests__/features
  npx jest __tests__/shared/console/adapterBoundaryGuard.test.ts --runInBand
  ```
  Gate: Do not rewrite tests until protocol assertions that must move are
  identified.

- [ ] T-002: Add X32 adapter channel meter protocol tests
  Reqs: REQ-004, REQ-005
  What: Move `/meters/1` and `/meters/13` request/subscribe assertions from
  the BusMix feature hook test to adapter-level coverage.
  Where:
  - `__tests__/shared/console/X32AdapterChannelMeters.test.ts`
  Depends on: T-001
  Reuses:
  - `X32Adapter` injected-client test pattern.
  - `X32Protocol.getMetersSubscribePath()`.
  - `X32Protocol.getMeters1Path()`.
  - `X32Protocol.getMeters13Path()`.
  Done when:
  - Subscribing to a CH meter ID requests/subscribes `/meters/1`.
  - Subscribing to an AUX or FX meter ID requests/subscribes `/meters/13`.
  - Request shape remains `/meters` with the meter id as a string argument.
  - Duplicate same-stream listeners do not create unnecessary duplicate stream
    subscriptions.
  Tests:
  ```sh
  npx jest __tests__/shared/console/X32AdapterChannelMeters.test.ts --runInBand
  npx jest __tests__/shared/console --runInBand
  ```
  Gate: Protocol coverage exists before the feature hook test drops protocol
  imports.

- [ ] T-003: Rewrite `useMeterSubscription` test to mock `BusMixService`
  Reqs: REQ-002, REQ-003, REQ-007
  What: Replace `SharedOscClient`/`X32Protocol` mocking with a `BusMixService`
  mock that validates hook lifecycle and delegation.
  Where:
  - `__tests__/features/busMix/hooks/useMeterSubscription.test.ts`
  Depends on: T-002
  Reuses: current hook assertions for enabled lifecycle and cleanup timing.
  Done when:
  - The test imports no `@shared/osc/*` modules.
  - The test proves `connect`, `subscribeMeter`, unsubscribe, and `disconnect`
    behavior.
  - Disabled mode and connection failure behavior remain covered or are added
    as focused assertions.
  Tests:
  ```sh
  npx jest __tests__/features/busMix/hooks/useMeterSubscription.test.ts --runInBand
  ```
  Gate: Feature test asserts feature behavior only, not X32 paths.

- [ ] T-004: Extend adapter boundary guard to feature tests
  Reqs: REQ-002, REQ-006
  What: Add guardrail coverage so feature tests do not import protocol or
  adapter internals directly.
  Where:
  - `__tests__/shared/console/adapterBoundaryGuard.test.ts`
  Depends on: T-003
  Reuses: existing runtime boundary guard patterns.
  Done when:
  - Guard scans `src/features` and `__tests__/features`.
  - Shared console/adapter tests remain allowed to import protocol internals.
  - No allowlist is needed for BusMix meter subscription tests.
  Tests:
  ```sh
  npx jest __tests__/shared/console/adapterBoundaryGuard.test.ts --runInBand
  ```
  Gate: Guard does not false-positive on legitimate shared/adapter tests.

- [ ] T-005: Run focused regression gates
  Reqs: REQ-001, REQ-003, REQ-004, REQ-005, REQ-007
  What: Run the checks that protect BusMix hook behavior and console adapter
  meter behavior.
  Where: repo tests.
  Depends on: T-004
  Reuses: `.specs/codebase/TESTING.md`.
  Done when: All focused checks pass, or any unrelated/pre-existing failure is
  documented with evidence.
  Tests:
  ```sh
  npx tsc --noEmit --pretty false
  npx jest __tests__/features/busMix --runInBand
  npx jest __tests__/shared/console --runInBand
  git diff --check
  ```
  Gate: No BusMix meter subscription or X32 adapter meter regression.

- [ ] T-006: Update docs/logs after migration
  Reqs: REQ-008
  What: Record the test-boundary migration and final validation result.
  Where:
  - `src/features/busMix/.specs/STATE.md`
  - this `tasks.md`
  - `.specs/codebase/TESTING.md` if guardrail scope changes need recording
  - `logs/YYYY-MM-DD_*`
  Depends on: T-005
  Reuses: current spec/log conventions.
  Done when:
  - Future maintainers can tell that runtime features were already
    adapter-backed and this cleanup moved protocol test assertions to adapter
    tests.
  Tests:
  ```sh
  git diff --check
  ```
  Gate: Documentation matches final implementation.
