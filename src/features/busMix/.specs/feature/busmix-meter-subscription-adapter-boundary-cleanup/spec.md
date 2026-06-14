# Spec - BusMix Meter Subscription Adapter Boundary Cleanup

Date: 2026-06-14
Status: planned

## Summary

Move X32-specific meter subscription assertions out of the BusMix feature hook
test and into X32 adapter tests.

Runtime BusMix code already consumes the adapter boundary through
`BusMixService`. This cleanup aligns tests with the architecture so feature
tests validate feature behavior, while shared console tests validate protocol
behavior.

## Requirements

REQ-001: Runtime BusMix code must continue using `BusMixService` as the feature
facade for console meter subscriptions.

REQ-002: `useMeterSubscription` tests must not import `@shared/osc/*`,
`X32Protocol`, `SharedOscClient`, or X32 adapter internals.

REQ-003: `useMeterSubscription` tests must validate feature-hook behavior:
connect through `BusMixService`, register listeners, delegate active
subscriptions to `service.subscribeMeter`, cleanup unsubscribers, and remain
silent when disabled or connection fails.

REQ-004: X32-specific meter stream behavior for `/meters/1` and `/meters/13`
must be covered under `__tests__/shared/console` or equivalent adapter-level
tests.

REQ-005: Existing BusMix meter routing behavior must not regress:
CH IDs use the input meter stream, AUX/FX IDs use the AUX/FX meter stream, and
invalid/non-meter IDs do not start protocol subscriptions.

REQ-006: The adapter boundary guardrail should protect feature tests from
direct protocol imports when practical, not just runtime source files.

REQ-007: No UI behavior, meter visuals, meter decoder math, or runtime
subscription semantics should change in this cleanup.

REQ-008: Documentation must record that runtime features are adapter-backed and
that the remaining cleanup was test-boundary migration.

## Acceptance Criteria

- `__tests__/features/busMix/hooks/useMeterSubscription.test.ts` mocks
  `BusMixService`, not `SharedOscClient`.
- Feature tests do not import `X32Protocol` or `@shared/osc/*`.
- Adapter-level tests cover the current X32 `/meters/1` and `/meters/13`
  subscription request/subscribe behavior.
- `adapterBoundaryGuard` or a companion guard fails if feature tests import
  protocol/adapter internals directly.
- BusMix focused tests pass.
- Shared console focused tests pass.
- TypeScript passes.
- `git diff --check` passes.

## Out Of Scope

- Runtime implementation changes to `useMeterSubscription`.
- Changing `BusMixService` public API.
- Changing X32 meter decoder math.
- Renaming `x32RawToDb`, `X32FaderDb`, `X32ChannelColor`, or shared X32 UI
  helper names.
- Implementing WING meter streams.
- Manual visual/UI changes.
