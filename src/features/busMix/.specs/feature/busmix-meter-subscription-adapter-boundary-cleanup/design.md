# Design - BusMix Meter Subscription Adapter Boundary Cleanup

Date: 2026-06-14
Status: planned

## Current Test Shape

```txt
useMeterSubscription.test
  -> mocks SharedOscClient
  -> imports X32Protocol
  -> asserts /meters/1 and /meters/13 requests
```

This is now the wrong layer. `useMeterSubscription` no longer owns those
protocol details in runtime code.

## Target Test Shape

Feature hook test:

```txt
useMeterSubscription.test
  -> mocks BusMixService
  -> validates hook lifecycle and delegation
```

Adapter test:

```txt
X32AdapterChannelMeters.test
  -> constructs X32Adapter with injected client
  -> validates /meters/1 and /meters/13 protocol behavior
```

## Proposed Files

Update:

```txt
__tests__/features/busMix/hooks/useMeterSubscription.test.ts
__tests__/shared/console/adapterBoundaryGuard.test.ts
src/features/busMix/.specs/STATE.md
```

Add:

```txt
__tests__/shared/console/X32AdapterChannelMeters.test.ts
```

## Feature Test Coverage

The feature hook test should prove:

- `BusMixService.connect(consoleIp)` is called when enabled.
- registering a listener after connection delegates to
  `BusMixService.subscribeMeter(channelId, listener)`;
- unregistering a listener calls the returned unsubscribe;
- unmount disconnects the service and cleans active unsubscribers;
- disabled mode does not connect or subscribe;
- connection failure is swallowed as current behavior documents.

## Adapter Test Coverage

The X32 adapter test should prove:

- channel IDs owned by `/meters/1` request and subscribe to
  `X32Protocol.getMeters1Path()`;
- AUX/FX IDs owned by `/meters/13` request and subscribe to
  `X32Protocol.getMeters13Path()`;
- the request shape remains `client.send('/meters', [meterPath])`;
- duplicate stream activation does not duplicate subscriptions unnecessarily;
- returned cleanup removes the listener from adapter state.

## Guardrail

Extend or add a guard to scan `__tests__/features` for protocol/adapter imports:

- `@shared/osc/SharedOscClient`
- `@shared/osc/X32Protocol`
- `@shared/osc/OscClient`
- `@shared/network/UdpTransport`
- `@shared/console/adapters/`

Adapter/shared tests remain allowed to import those details.

## Risk

The current protocol assertions should not simply be deleted. They need to move
to adapter-level tests before the feature hook test is rewritten, otherwise the
`/meters/1` and `/meters/13` regression coverage gets weaker.
