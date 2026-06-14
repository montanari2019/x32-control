# Spec - BusGroups Service Adapter Boundary Cleanup

Date: 2026-06-14
Status: implemented; manual demo/X32 UAT pending

## Summary

Rename and reshape the BusGroups console service boundary so the feature
depends on a neutral adapter-backed facade instead of an X32-named service.

The X32 adapter remains the owner of X32/M32 protocol details. BusGroups remains
the owner of feature behavior: local MCA assignments, secure storage,
proportional MCA fader behavior, selected BUS master state, and UI state.

## Requirements

REQ-001: BusGroups runtime code must consume a neutral service name, such as
`BusGroupsService` or `ConsoleBusGroupsService`, instead of directly depending
on `X32BusGroupsService`.

REQ-002: The neutral service must delegate console reads, writes, lifecycle, and
subscriptions through `IConsoleAdapter`.

REQ-003: Existing real X32/M32 behavior must remain unchanged, including
connect/disconnect, `/xremote` heartbeat delegation, initial BusGroups state,
DCA/MCA state, BUS master state, scalar subscriptions, and Bus Master meter
subscription.

REQ-004: Existing demo/mock behavior must remain unchanged.

REQ-005: The service must keep test injection support, but injected transport
details must be isolated as a compatibility/testing path and must not make the
main feature boundary protocol-specific.

REQ-006: `isChannelInDca` must no longer be duplicated in
`src/features/busGroups/services/X32BusGroupsService.ts`. The implementation
must either remove the feature-level export entirely or replace it with a
compatibility re-export from the X32 adapter helper only where legacy imports
still require it.

REQ-007: `useBusGroups` and `useOscSubscription` must type against the neutral
service API, not the X32-specific class name.

REQ-008: Existing tests must be renamed or updated so their subject under test
matches the neutral service boundary. X32-specific protocol assertions should
move to adapter tests when they validate protocol details.

REQ-009: Public behavior used by hooks/components must remain source-compatible
during the migration unless all call sites are updated in the same task.

REQ-010: No new WING adapter runtime behavior should be introduced by this
cleanup. The work prepares the feature for future adapters without registering
or implementing another console.

REQ-011: The feature should not import from `@shared/console/adapters/x32/*`
after cleanup, except optional short-lived compatibility exports that are
explicitly documented in the implementation notes.

REQ-012: Documentation and local state must record the new service boundary and
any intentionally retained legacy aliases.

## Acceptance Criteria

- BusGroups hooks instantiate and type against a neutral BusGroups service.
- `X32BusGroupsService` is removed, renamed, or reduced to a documented
  compatibility alias.
- Runtime BusGroups service code has no direct `X32Protocol` import.
- Runtime BusGroups service code has no direct X32 adapter import, except a
  temporary compatibility alias documented in the spec/tasks if chosen.
- DCA membership logic is not duplicated in the feature service.
- BusGroups focused tests pass.
- Shared console adapter tests pass.
- TypeScript passes.
- `git diff --check` passes.
- Manual follow-up remains limited to confirming unchanged behavior on demo and
  real X32/M32.

## Out Of Scope

- Implementing WING support.
- Renaming every existing `x32*` fader scale utility.
- Renaming X32 adapter files or tests under `src/shared/console/adapters/x32`.
- Changing BusGroups UI, layout, colors, fader behavior, or meter visuals.
- Changing MCA local persistence format.
- Changing DCA/MCA terminology shown to users.
- Changing BusMix service behavior.
