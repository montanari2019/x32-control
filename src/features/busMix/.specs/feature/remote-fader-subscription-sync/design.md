# Design - BusMix Remote Fader Subscription Sync

Last updated: 2026-05-24

## Design Goal

Make BusMix faders listen to real-time console-side changes with minimal latency while preserving the current app-to-console send path. The primary fix is not a UI change: it is adding explicit X32 fader value subscriptions for visible BusMix send-level paths.

## Current Receive Flow

```txt
BusMixService.connect(consoleIp)
  -> acquireSharedOscClient(consoleIp)
  -> OscClient.startXRemoteKeepAlive()

useBusMix loaded channels
  -> service.onLevel(channel, bus, listener)
      -> OscClient.subscribe(source.getLevelPath(channel.sourceNumber, bus), listener)

Incoming UDP packet
  -> OscClient.handlePacket()
  -> dispatch to exact local listeners by message.address
```

Important limitation:

```txt
OscClient.subscribe(...)
  registers a local callback only.
  It does not send X32 /subscribe.
```

So the current app receives a fader update only when the console happens to emit that exact path because of `/xremote`, a request response, or another mechanism. If the event is not emitted or is dropped, the app stays visually stale until the 30-second background sync or a full screen reload.

## Desired Receive Flow

```txt
BusMixScreen visibleChannelIds
  -> useBusMix receives visible source IDs
  -> useBusMixRemoteFaderSubscription computes visible send-level paths
  -> BusMixService starts managed scalar subscriptions
  -> OscClient sends /subscribe for each visible fader path
  -> OscClient renews subscriptions before 10s timeout
  -> incoming values feed reconcileRemoteFader(...)
  -> linked-channel visual sync and local-protection logic stay centralized
```

## Path Decision

For selected BUS `busNumber`, BusMix source fader paths are:

```txt
CH 17, BUS 01: /ch/17/mix/01/level
AUX 01, BUS 01: /auxin/01/mix/01/level
FX Return 01, BUS 01: /fxrtn/01/mix/01/level
```

The main channel fader is different:

```txt
CH 17 main fader: /ch/17/mix/fader
```

The implementation must never conflate those paths. A diagnostic task should verify what the X32 official app sends during the user's reproduction.

## Subscription Strategy

Use `/subscribe` first for individual visible send-level paths because:

- it returns normal OSC messages on the requested address;
- it is simpler to feed into the existing exact-address dispatcher;
- it avoids implementing blob decoding for `/formatsubscribe`;
- it can be scoped to only visible faders;
- it complements `/xremote` rather than replacing it.

Recommended initial command:

```txt
/subscribe ,si <fader-path> <time-factor>
```

Time-factor should be conservative. Start with a value that targets about 10-20 reports per 10-second window per visible fader, then tune with hardware:

- `20`: about 10 reports over 10 seconds according to the unofficial protocol's time-factor scale examples.
- `10`: about 20 reports over 10 seconds.
- `1` or `0`: too aggressive for multiple visible faders unless testing proves it is safe.

The target UX is near-real-time, but not at the cost of saturating Wi-Fi. If hardware testing proves 10-20 reports per 10 seconds is too slow, adjust only after measuring the subscribed visible path count and observed latency.

Renewal:

```txt
/renew ,s <fader-path>
```

If `/renew` for a plain `/subscribe` path is unreliable on target firmware, re-send the original `/subscribe` command before the 10-second timeout. Keep this behavior inside `OscClient` or a small subscription manager so BusMix does not duplicate protocol details.

Unsubscribe:

```txt
/unsubscribe ,s <fader-path>
```

Send unsubscribe when the last local listener for that managed subscription is removed, but treat failure as non-fatal.

## Component And Hook Integration

Preferred integration:

1. Move `visibleChannelIds` state above the `useBusMix(...)` call in `BusMixScreen`.
2. Pass it into `useBusMix(consoleIp, busNumber, { realtimeVisibleChannelIds: visibleChannelIds })`.
3. Inside `useBusMix`, derive visible `Channel` objects from loaded channels and subscribe only their fader send-level paths.
4. On channel list reload, bus change, console change, or visible set change, cleanly stop old subscriptions and start new ones.

Alternative if hook ordering becomes awkward:

1. Keep `useBusMix(consoleIp, busNumber)` unchanged.
2. Return `setRealtimeVisibleChannelIds(ids)` from the hook.
3. Call that setter from `BusMixScreen` when `visibleChannelIds` changes.

Preferred file:

```txt
src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts
```

This hook should be small and receive:

- `service`;
- `busNumber`;
- `channels`;
- `visibleChannelIds`;
- `onRemoteLevel(channelNumber, level)`;
- optional diagnostic callbacks.

## OscClient Design

Add a managed scalar subscription API without changing existing `subscribe(address, listener)` semantics.

Possible shape:

```ts
type ScalarSubscriptionOptions = {
  address: string;
  timeFactor?: number;
  renewIntervalMs?: number;
  listener: (message: OscMessage) => void;
};

subscribeScalarValue(options: ScalarSubscriptionOptions): () => void;
```

Implementation principles:

- Register the local listener first.
- Send `/subscribe` through the same UDP client.
- Ref-count by `address + timeFactor`.
- Avoid duplicate `/subscribe` sends when multiple listeners request the same path.
- Renew before 10 seconds, default around 8000 ms.
- Remove only the listener on local unsubscribe.
- Stop the renewal timer and send `/unsubscribe` when the last listener for a key is removed.
- Clear all managed subscriptions on `disconnect()`/transport close.
- Do not create `request()` pending promises for subscription packets; subscription responses are streaming messages.

## Service Design

`BusMixService` should expose a BusMix-specific method that hides source path details:

```ts
subscribeChannelLevelUpdates(
  channel: Channel,
  bus: number,
  listener: (level: number) => void,
): () => void
```

This method should:

- use `SOURCE_DEFINITIONS` to build the source send-level path;
- use managed `/subscribe` in real-console mode;
- fall back to mock provider subscriptions in mock mode;
- clamp incoming values to `0..1`;
- not send any fader write.

Existing `onLevel(...)` can remain as the local exact-address listener used by `/xremote`. The new method may compose it if the managed subscription API also registers the local listener. Avoid double-calling listeners if both paths share the same local subscription.

## Reconciliation Design

All remote fader values must enter through the existing `reconcileRemoteFader(channelNumber, level)` path in `useBusMix`.

That preserves:

- local protection window;
- linked-peer visual reflection;
- `BusMixChannelStore.updateChannels`;
- `localFaderRaw` / `remoteFaderRaw` consistency;
- background sync behavior.

Do not add a second store updater inside the subscription hook.

## Diagnostics

Extend current realtime health with fader-specific fields:

```ts
type RealtimeSubscriptionHealth = {
  subscribedAt?: number;
  lastEventAt?: number;
  lastLevelEventAt?: number;
  lastOnEventAt?: number;
  lastPanEventAt?: number;
  lastSubscribedFaderEventAt?: number;
  lastFaderSubscribeRenewAt?: number;
  subscribedFaderPathCount?: number;
  isFaderSubscriptionStale?: boolean;
};
```

Do not update React state for every packet. Store these values in refs and expose them through `getRealtimeSubscriptionHealth()` or a dev-only logger.

## Fallback Design

Only add fallback polling if real-console testing proves `/subscribe` is unavailable or still too stale.

Fallback rules:

- poll only visible BusMix send-level paths;
- prefer 250-500 ms while the affected faders are visible;
- stop on unmount and when the app is not connected;
- avoid polling all 48 sources unless the user explicitly requests that behavior later;
- keep background 30000 ms sync as the broad safety net.

## Testing Strategy

Unit tests:

- X32 protocol helper tests for `/subscribe`, `/renew`, and `/unsubscribe` packet construction.
- `OscClient` tests with fake timers:
  - sends `/subscribe` once for first listener;
  - does not duplicate command for second same-path listener;
  - renews before 10 seconds;
  - sends `/unsubscribe` when last listener unsubscribes;
  - clears timers on disconnect.
- BusMix service tests:
  - CH 17 BUS 01 path uses `/ch/17/mix/01/level`;
  - AUX 01 BUS 01 path uses `/auxin/01/mix/01/level`;
  - FX Return 01 BUS 01 path uses `/fxrtn/01/mix/01/level`;
  - main fader path is not used.
- Hook tests:
  - visible CH 17 starts a managed subscription;
  - invisible CH 17 does not;
  - changing visible set cleans up old subscriptions;
  - incoming subscribed value calls `reconcileRemoteFader`;
  - local fader send functions are not called by remote values.

Gate commands:

```sh
yarn jest __tests__/shared/osc --runInBand
yarn jest __tests__/features/busMix --runInBand
yarn jest __tests__/features/busGroups --runInBand
yarn tsc
```

Manual UAT:

- Required with the real X32/M32 and the emulator on the same network.
- Must validate CH 17 specifically.
- Must record whether the X32 official app was changing the main fader or the send level for the same BUS.

## Performance Constraints

- Keep `/xremote` renewal at the existing interval unless evidence requires change.
- Do not increase fader write frequency.
- Do not subscribe all 48 faders by default.
- Do not update React state per packet.
- Do not touch meter subscriptions.
- Prefer exact fader paths before considering wildcard/blob subscriptions.
