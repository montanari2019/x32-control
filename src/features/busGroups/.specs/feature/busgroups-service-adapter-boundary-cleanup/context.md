# Context - BusGroups Service Adapter Boundary Cleanup

Date: 2026-06-14
Status: implemented; manual demo/X32 UAT pending

## Problem

`src/features/busGroups/services/X32BusGroupsService.ts` was originally a
protocol-specific service. After console adapter normalization, it now mostly
delegates to `IConsoleAdapter`, but the feature still exposes X32 naming and a
duplicated DCA helper at the BusGroups service boundary.

This makes the code read as if BusGroups still owns X32 protocol behavior even
though the real protocol work now lives under:

```txt
src/shared/console/adapters/x32/
```

## Current Findings

- `BusGroupsService` imports `ConsoleAdapterFactory` and `IConsoleAdapter`.
- `BusGroupsService` does not import `X32Protocol`, `@shared/osc/*`, or X32
  adapter internals in runtime code.
- `X32BusGroupsService` remains only as a one-line compatibility alias.
- `useBusGroups` and `useOscSubscription` depend on the neutral service type.
- BusGroups tests mock and instantiate `BusGroupsService`.
- Real X32 protocol details should remain inside the X32 adapter modules.

## Intent

Introduce a neutral BusGroups service facade that consumes `IConsoleAdapter` and
is named for the feature capability rather than the current console model.

The cleanup must be compatibility-first:

- no behavior changes for real X32/M32 users;
- no behavior changes for demo/mock consoles;
- no Bus Master meter lifecycle regression;
- no MCA persistence or proportional fader regression;
- no broad migration of UI terms like MCA/DCA unless required by the service
  boundary cleanup.

## Non-Issues For This Spec

These names still exist and are not automatically wrong:

- `x32RawToDb`, `x32DbToRaw`, and `X32FaderDb` are the app's current fader scale
  utilities and are used by UI/business math.
- `mapX32ColorToUiColor` is the current color palette mapper for normalized
  color values produced by adapters.
- Tests under `__tests__/shared/console` may import X32 adapter internals
  directly because they validate adapter behavior.

Those can be revisited later if the normalized domain model gets new names.

## Related Specs

- `.specs/features/console-adapter-normalization/`
- `src/shared/console/adapters/x32/.specs/feature/x32-adapter-file-decomposition/`
- `src/features/busGroups/.specs/feature/bus-master-meter-rail/`

## Verification Surface

Focused automated checks:

```sh
npx tsc --noEmit --pretty false
npx jest __tests__/features/busGroups --runInBand
npx jest __tests__/shared/console --runInBand
git diff --check
```

Manual/UAT follow-up:

- Open BusGroups on demo and real X32/M32.
- Confirm initial state, Bus Master fader/on, Bus Master meter, MCA assignment,
  MCA proportional fader, and transition to/from BusMix still behave as before.
