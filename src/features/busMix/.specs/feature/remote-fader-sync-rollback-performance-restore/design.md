# Design - BusMix Remote Fader Sync Rollback Performance Restore

Last updated: 2026-05-25

## Overview

Rollback should remove only the remote fader receive features that introduced extra `/subscribe` traffic and JS/store work. The app should return to the lighter BusMix receive model while preserving unrelated fixes and iOS Local Network permission behavior.

This should be a surgical edit, not a broad reset.

## Existing Patterns Reused

- `BusMixService.onLevel(...)` already registers exact-address local listeners.
- `/xremote` keepalive already exists and should remain available through `BusMixService.connect(...)`.
- `syncRemoteFaders()` background sync already exists as a broad safety net.
- `BusMixChannelStore.updateChannels(...)` remains the shared BusMix/BusGroups state bridge.
- `useMeterSubscription` remains the dedicated meter stream owner.

## Modules To Remove Or Revert

Remove `remote-fader-fluidity-performance` runtime additions:

- `src/features/busMix/utils/remoteFaderCoalescing.ts`
- `src/features/busMix/utils/faderSubscriptionScope.ts`
- their tests under `__tests__/features/busMix/utils/`
- performance diagnostics fields added only for coalesced subscribed faders
- BusMix-specific `defaultBusMixFaderSubscriptionTimeFactor`

Remove `remote-fader-subscription-sync` runtime additions:

- `src/features/busMix/hooks/useBusMixRemoteFaderSubscription.ts`
- its tests under `__tests__/features/busMix/hooks/`
- `BusMixService.subscribeChannelLevelUpdates(...)`
- managed scalar subscription usage for BusMix fader receive
- `BusMixScreen -> useBusMix(..., { realtimeVisibleChannelIds })` wiring if it only exists for remote fader subscriptions

Potentially remove managed scalar subscription infrastructure if unused elsewhere:

- `OscClient.subscribeScalarValue(...)`
- scalar subscription timer/ref-count state
- X32 `/subscribe`, `/renew`, `/unsubscribe` helpers
- tests that only cover that deleted API

If another feature still needs this API, keep it but ensure BusMix does not use it. Current inspection suggests it exists only for `remote-fader-subscription-sync`.

## Modules To Preserve

Preserve Local Network permission behavior:

- `src/shared/network/UdpTransport.ts`
- `src/shared/network/LocalNetworkPermission.ts`
- `src/shared/network/UdpDiagnostics.ts`
- `ios/Tacimix/LocalNetworkPermission.m`
- `ios/Tacimix/Info.plist`
- `ios/Tacimix.xcodeproj/project.pbxproj` entries for `LocalNetworkPermission.m`

Preserve meter stability:

- `src/features/busMix/hooks/useMeterSubscription.ts`
- `src/features/busMix/utils/meterStreamRouting.ts`
- `src/features/busMix/utils/meterDecoder.ts`
- meter tests

Preserve unrelated UX fixes:

- fader thumb-only interaction;
- pan modal signed value;
- AUX/FX meter stream isolation;
- presets;
- BusGroups shared store behavior.

## Restored Data Flow

Target restored flow:

```txt
BusMixService.connect(consoleIp)
  -> acquire shared OSC client
  -> start /xremote keepalive

useBusMix loaded channels
  -> service.onLevel(channel, bus, listener)
  -> service.onOn(channel, bus, listener)
  -> service.onPan(channel, bus, listener)

Incoming exact-address OSC event
  -> lightweight listener
  -> existing remote reconciliation
  -> BusMixChannelStore update

Background sync
  -> loadChannelFaders every ~30s with jitter
```

No visible-fader managed `/subscribe` loop should remain in BusMix.

## State And Documentation

After implementation:

- Mark `remote-fader-subscription-sync` as reverted/undone in `src/features/busMix/.specs/STATE.md`.
- Mark `remote-fader-fluidity-performance` as reverted/undone in `src/features/busMix/.specs/STATE.md`.
- Mirror the same status in `.specs/project/STATE.md`.
- Update both feature `tasks.md` files with rollback notes, not by erasing their history.
- Add a rollback log under `/logs`.

## Testing Strategy

Run focused gates:

```sh
yarn jest __tests__/features/busMix --runInBand
yarn jest __tests__/features/busGroups --runInBand
yarn jest __tests__/shared/osc --runInBand
yarn jest __tests__/shared/network --runInBand --testTimeout=10000
yarn tsc
```

Static permission checks:

```sh
rg -n "ensureLocalNetworkPermission|LocalNetworkPermission|NSLocalNetworkUsageDescription|NSBonjourServices" src ios
plutil -lint ios/Tacimix/Info.plist
```

Manual UAT:

- Fresh install or first launch with Local Network prompt.
- Discover real console.
- Open BusMix and watch CH/AUX/FX meters for smoothness.
- Move Tacimix faders and confirm app-to-console control stays responsive.
- Leave BusMix open for at least 2 minutes and confirm no progressive UI slowdown.

## Risks And Trade-Offs

- Removing `remote-fader-subscription-sync` may reintroduce the original limitation where changes made from the X32 official app may not mirror immediately until `/xremote` emits, background sync runs, or the screen reloads.
- This trade-off is currently acceptable because the user reports the subscription path degrades overall app and meter smoothness.
- A future solution should be feature-flagged and benchmarked against the restored baseline before shipping.
