# Design - BusMix Remote Fader Fluidity Performance

Last updated: 2026-05-25

## Design Goal

Keep remote fader sync correct while making the receive-to-render pipeline bounded, frame-aligned, and resilient to Wi-Fi jitter. The app should render the latest useful console state, not replay every packet the network delivered.

## Current Hot Path

```txt
X32 /subscribe response
  -> OscClient.handlePacket
  -> local exact-address listener
  -> BusMixService.subscribeChannelLevelUpdates listener
  -> useBusMixRemoteFaderSubscription onRemoteLevel
  -> useBusMix.reconcileRemoteFader
  -> busMixChannelStore.updateChannels
  -> BusMixScreen state/subscribers
  -> fader props update
```

This is simple and correct, but it has no backpressure. With frequent packets, every packet can become a render-relevant update.

## Proposed Hot Path

```txt
X32 /subscribe response
  -> OscClient.handlePacket
  -> BusMixService clamps and tags value with receivedAt
  -> useBusMixRemoteFaderSubscription records latest value by channel/path in refs
  -> duplicate and stale echo filters run before scheduling UI work
  -> one requestAnimationFrame flush applies latest value per channel
  -> useBusMix.reconcileRemoteFaderBatch or repeated reconcile inside one batched store update
  -> busMixChannelStore.updateChannels once per frame
```

## Subscription Rate Policy

The current default time factor is `5`. The first optimization must measure and likely relax it.

Recommended initial production profile:

- `timeFactor = 20` as the conservative default for visible fader subscriptions.
- `renewIntervalMs = 5000` or `8000` only after confirming firmware behavior.
- Keep `/xremote` every 5000 ms.
- Keep background sync as broad safety net.

Reasoning:

- Mixing Station documentation states X32-Mix-style `/subscribe` can provide visible values every ~50 ms. That is useful but expensive when multiplied across visible faders.
- Mixing Station's event-driven model reduces traffic and accepts background sync for eventual correction.
- Tacimix already has optimistic local UI and `/xremote`; `/subscribe` should fill receive gaps, not become an unbounded UI clock.

Final values must be confirmed with real-console measurements. The task should record actual packet rate for time factors `5`, `10`, and `20` before finalizing.

## Receive Backpressure

Create a small hook-level buffering helper, likely pure-testable:

```ts
type RemoteFaderPacket = {
  channelNumber: number;
  level: number;
  path: string;
  receivedAt: number;
};

type RemoteFaderCoalescer = {
  push(packet: RemoteFaderPacket): void;
  flush(now: number): RemoteFaderPacket[];
  getStats(): RemoteFaderStats;
};
```

Rules:

- Store only the latest packet per `channelNumber` or exact OSC path.
- Drop duplicate values within `REMOTE_FADER_LEVEL_EPSILON`, for example `0.001`.
- Drop stale local echoes while `pendingLocalChangeAt` indicates an active local protection window.
- Schedule one `requestAnimationFrame` while pending values exist.
- On flush, apply only the latest values.
- Do not update React state for counters or queue contents.

## Store Update Strategy

Preferred implementation:

1. Add `reconcileRemoteFadersBatch(updates)` in `useBusMix`.
2. Inside one `updateSharedChannels(...)`, apply `applyLinkedRemoteLevelUpdate` for each latest channel update.
3. Keep linked-channel behavior centralized.
4. Preserve `pendingLocalChangeAtRef` and `LOCAL_PROTECTION_WINDOW_MS`.

Fallback implementation:

- If batch logic becomes risky, keep `reconcileRemoteFader(channel, level)` but call it only once per channel per frame. This is less optimal but still removes backlog replay.

## Echo And Out-Of-Order Guard

Track per-channel receive state in refs:

```ts
type RemoteFaderReceiveState = {
  lastReceivedLevel?: number;
  lastReceivedAt?: number;
  lastAppliedLevel?: number;
  lastAppliedAt?: number;
  lastLocalWriteAt?: number;
};
```

Rules:

- Remote packet older than the latest applied packet for the same channel is ignored.
- Remote packet matching the last local write during the local protection window is ignored.
- Remote packet with material difference after protection window is accepted.
- The final accepted value must always converge to console value through `/subscribe`, `/xremote`, or background sync.

## Visibility Hysteresis

Current visible IDs can churn while scrolling. That churn can create subscribe/unsubscribe bursts.

Add a small subscription scope manager:

- Keep currently visible channels subscribed immediately.
- Keep recently visible channels alive for a short grace period, for example 750-1500 ms.
- Cap total retained subscriptions to a small number, for example visible count plus 4.
- When over cap, evict the least-recently-visible subscriptions first.
- Do not retain subscriptions after bus/console/screen unmount.

This keeps scrolling smooth without subscribing all 48 faders.

## Diagnostics

Extend `getRealtimeSubscriptionHealth()` with ref-backed fields:

```ts
type RemoteFaderPerformanceHealth = {
  incomingFaderPacketCount: number;
  appliedFaderUpdateCount: number;
  coalescedFaderPacketCount: number;
  duplicateFaderPacketCount: number;
  staleEchoFaderPacketCount: number;
  droppedOutOfOrderFaderPacketCount: number;
  lastFrameFlushAt?: number;
  lastFrameFlushDurationMs?: number;
  maxPendingFaderPacketAgeMs?: number;
  lastIncomingFaderPacketsPerSecond?: number;
  lastAppliedFaderUpdatesPerSecond?: number;
  scalarSubscriptionTimeFactor: number;
};
```

Keep diagnostics invisible by default. A dev-only `console.debug` sample can be temporarily enabled for UAT but must not ship as noisy logging.

## Testing Strategy

Unit tests:

- Coalescer keeps only latest packet per channel.
- Duplicate packets within epsilon are dropped.
- Multiple packets in one frame produce one applied update per channel.
- Local echo packets inside protection window are ignored.
- Out-of-order packets do not overwrite newer applied values.
- Visibility hysteresis retains recent channels briefly and caps subscription count.
- Subscription config uses the conservative time factor by default.

Integration-style hook/service tests:

- Remote packets do not call `onRemoteLevel` immediately for each packet; they flush frame-aligned.
- Cleanup cancels pending frame and subscriptions.
- Local send path still calls service writes exactly as before.

Manual UAT:

- Test time factors `5`, `10`, and `20` on the real X32/M32.
- Record packet rate, perceived latency, fader settle time, and UI responsiveness.
- Pick the slowest traffic profile that still feels responsive.

Gate commands:

```sh
yarn jest __tests__/features/busMix --runInBand
yarn jest __tests__/shared/osc --runInBand
yarn jest __tests__/features/busGroups --runInBand
yarn tsc
```

If `NetworkScanner` appears in a full test run, use the documented 10000 ms timeout for those specific tests.

## Non-Goals

- Do not increase global polling frequency.
- Do not use meter streams for fader sync.
- Do not render every subscribed network value.
- Do not add visible debug UI in this pass.
- Do not remove `/xremote`.
