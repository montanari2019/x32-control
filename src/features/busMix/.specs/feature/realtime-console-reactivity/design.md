# Design - BusMix Realtime Console Reactivity

Last updated: 2026-05-24

## Design Goal

Create a low-latency receive/reactivity layer for BusMix that complements the existing send pipeline instead of replacing it.

The design should follow a hybrid model:

1. Event receive through existing `/xremote` + `OscClient.subscribe`.
2. Immediate local reflection for linked peers when the app itself sends level/on.
3. Lightweight background reconciliation for lost UDP packets.
4. No changes to meter stream mechanics.

## Proposed Architecture

```txt
BusMixScreen
  -> useBusMix(consoleIp, busNumber)
      -> BusMixService.connect()
          -> acquireSharedOscClient()
          -> startXRemoteKeepAlive()
      -> useBusMix realtime receive path
          -> subscribe level/on/pan as needed
          -> apply linked peer policy
          -> update BusMixChannelStore
      -> existing send path
          -> sendLevelOnly / setLevel / toggleOn / setPan
          -> optimistic local state
          -> service writes normalized OSC values

useMeterSubscription remains separate
  -> /meters request/renew logic
  -> meter blob decode
  -> no linked-control semantics
```

## Recommended Implementation Shape

Introduce pure helpers before adding hook complexity:

- `src/features/busMix/utils/linkedChannelSync.ts`
  - `getLinkedPeerNumber(channelNumber, linkMap)`
  - `applyLinkedLevelUpdate(channels, channelNumber, level, options)`
  - `applyLinkedOnUpdate(channels, channelNumber, on, options)`
  - `applyPanUpdate(channels, channelNumber, pan)` with no peer mirroring
  - helpers must be deterministic and unit-tested.

Then integrate into `useBusMix`:

- Keep current `setLevel`, `sendLevelOnly`, `toggleOn`, `setPan` public API shape unless implementation proves a split is required.
- In local fader/on update paths, update both linked peers visually for level/on but send only the selected channel command to the console.
- In remote event handlers, apply the same linked peer visual policy for level/on.
- Keep the existing `LOCAL_PROTECTION_WINDOW_MS` concept for stale remote echo.
- Add pan subscription only if useful for console-originated pan updates, but never mirror it across linked peers.

If hook extraction makes the code clearer:

- Create `src/features/busMix/hooks/useBusMixRealtimeSync.ts`.
- Inputs:
  - `consoleIp`
  - `busNumber`
  - `service`
  - `channelsRef`
  - `channelLinkMapRef`
  - `updateSharedChannels`
  - `reconcileRemoteFader`
  - `reconcileRemoteOn`
  - optional diagnostics callbacks
- Output:
  - subscription health state or refs;
  - no UI rendering concerns.

## Link Policy

Level:

- Linked peer should visually follow the same raw level.
- Update fields consistently:
  - `faderRaw`
  - `faderDb`
  - `localFaderRaw`
  - `remoteFaderRaw` when update is remote-confirmed
  - `level`
  - `isDirty`
  - `lastLocalChangeAt`

Mute/on:

- Linked peer should visually follow the same `on` boolean.
- Existing code already mirrors on local toggle; this must be centralized and reused for remote updates too.

Pan:

- Never mirror.
- Stereo-linked channels commonly use independent left/right pan values.
- The pan modal remains per channel.

## Receive Strategy

Current app already starts `/xremote` every 5000 ms while connected. Keep that.

Add or harden:

- subscription health:
  - last event timestamp;
  - last level/on event timestamp;
  - optional dev-only counters for received messages per path;
  - disconnected/stale threshold around 15 seconds, inspired by public integration patterns.
- path-level subscriptions:
  - continue direct `client.subscribe(path, listener)` for level/on;
  - evaluate pan subscriptions through existing source path helpers;
  - do not subscribe meters here.

## Background Reconciliation

Keep the existing 30-second background fader sync as a safety net.

If real-console testing still shows visible drift:

- Add a focused linked-pair reconciliation loop while BusMix is visible:
  - only active BUS;
  - only level/on for currently loaded channels;
  - interval should be conservative and configurable, e.g. 1000-2000 ms for linked pairs only, not all parameters;
  - stop on unmount;
  - do not run for mock console unless tests require it.

This is a fallback, not the first solution.

## Performance Constraints

- Avoid one React state update per incoming OSC packet when multiple messages arrive close together. If needed, batch updates through `BusMixChannelStore.updateChannels`.
- Do not create a new `OscClient` per hook/component.
- Do not start duplicate `/xremote` intervals per visible channel.
- Do not touch meter subscription intervals.
- Do not send level commands to both linked peers by default.
- Keep pure helper tests fast and independent of React Native rendering.

## Testing Strategy

Unit tests:

- pure linked sync helpers:
  - local level update mirrors peer;
  - remote level update mirrors peer;
  - local on update mirrors peer;
  - remote on update mirrors peer;
  - pan update does not mirror;
  - unlinked channel only updates itself;
  - linked event for both channels is idempotent.

Existing suites:

- `yarn jest __tests__/features/busMix --runInBand`
- `yarn jest __tests__/features/busGroups --runInBand`
- `yarn tsc`

Manual hardware UAT:

- Required later with physical X32/M32.
- Must include linked channel pair controlled from:
  - app fader left side;
  - app fader right side;
  - app mute left side;
  - app mute right side;
  - console surface fader;
  - console surface mute;
  - another OSC client if available.
