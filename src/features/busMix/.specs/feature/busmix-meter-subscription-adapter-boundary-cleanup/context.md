# Context - BusMix Meter Subscription Adapter Boundary Cleanup

Date: 2026-06-14
Status: planned

## Validation Summary

Runtime feature code was audited after the BusGroups service facade cleanup.

The communication-facing feature services currently consume the console adapter
boundary:

- `src/features/busSelection/services/BusService.ts`
  - uses `ConsoleAdapterFactory` and `IConsoleAdapter`;
  - does not import X32 adapter internals or OSC protocol files.
- `src/features/busMix/services/BusMixService.ts`
  - uses `ConsoleAdapterFactory` and `IConsoleAdapter`;
  - does not import X32 adapter internals or OSC protocol files.
- `src/features/busGroups/services/BusGroupsService.ts`
  - uses `ConsoleAdapterFactory` and `IConsoleAdapter`;
  - does not import X32 adapter internals or OSC protocol files.

The remaining real boundary issue is in a feature test:

```txt
__tests__/features/busMix/hooks/useMeterSubscription.test.ts
```

It still imports:

- `@shared/osc/SharedOscClient`
- `@shared/osc/X32Protocol`

and asserts X32-specific meter requests for `/meters/1` and `/meters/13`.

Those assertions are protocol/adapter behavior and should live under
`__tests__/shared/console` with X32 adapter tests. The feature hook test should
only verify that `useMeterSubscription` coordinates `BusMixService` correctly.

## Current Runtime Shape

```txt
useMeterSubscription
  -> BusMixService
       -> ConsoleAdapterFactory
            -> IConsoleAdapter
                 -> X32Adapter | DemoConsoleAdapter
```

## Non-Issues For This Spec

Several feature files still mention X32 in utility names such as
`x32RawToDb`, `x32DbToRaw`, `X32FaderDb`, `X32ChannelColor`,
`mapX32ColorToUiColor`, and pan helpers under `@shared/x32`.

Those are current app-level scale/color/pan helpers, not direct console
transport or adapter imports. Renaming them requires a separate domain-model
normalization spec and is intentionally out of scope for this cleanup.

## Audit Commands Used

```sh
rg -n "@shared/console/adapters|@shared/osc|X32Protocol|OscClient|UdpTransport|X32Adapter|X32BusGroupsService|BusGroupsService|BusMixService|BusService|ConsoleAdapterFactory|IConsoleAdapter" src/features __tests__/features
rg -n "@shared/x32|x32RawToDb|x32DbToRaw|X32FaderDb|mapX32ColorToUiColor|X32ChannelColor|normalizeX32MeterValue|X32" src/features __tests__/features
```

## Verification Surface

Focused gates for the eventual migration:

```sh
npx tsc --noEmit --pretty false
npx jest __tests__/features/busMix/hooks/useMeterSubscription.test.ts --runInBand
npx jest __tests__/features/busMix --runInBand
npx jest __tests__/shared/console --runInBand
git diff --check
```
