# Spec - BusMix Remote Fader Fluidity Performance

Last updated: 2026-05-25

## Context

`remote-fader-subscription-sync` fixed the correctness problem: BusMix now receives remote same-BUS send-level changes while the screen stays open.

The remaining problem is perceived fluidity and performance. Real-console validation shows the feature works, but remote fader transitions can arrive with perceptible delay. After sustained movement, the fader can become visually frantic, appearing to chase several delayed values before settling after roughly 2 seconds.

This feature optimizes the receive-to-render path. It must preserve the current correct behavior while making remote fader motion feel native, calm, and low-latency on modest mobile devices.

## Source Of Truth

Implementation and planning must follow:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/design.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/tlc-spec-driven/references/implement.md`
- `docs/skills/custom-hooks/SKILL.md`
- `docs/skills/services-and-auth/SKILL.md`
- `docs/skills/components-and-shared-ui/SKILL.md`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`
- Existing feature docs under `src/features/busMix/.specs/feature/remote-fader-subscription-sync/`

## External Research Summary

Research performed on 2026-05-25:

- Mixing Station documentation distinguishes X32 `/subscribe` polling from `/xremote` events. It reports that X32-Mix uses `/subscribe` and receives visible values every ~50 ms for 10 seconds, while Mixing Station uses `/xremote` event-style updates and background sync to reduce traffic. It also identifies lag as a result of Wi-Fi carrying many small packets in both directions and apps displaying the last network value instead of a local cached/optimistic value.
  Source: https://dev-core.org/ms-docs/mixers/behringer/x32/
- The unofficial X32/M32 OSC protocol confirms that `/ch/[01...32]/mix/fader` and `/ch/[01...32]/mix/[01...16]/level` are different parameters. It also warns that UDP/buffer overflow situations must be considered.
  Source: https://x32ram.com/wp-content/uploads/download-files/X32-OSC.pdf
- A field report on X32 OSC behavior notes that `/xremote` must be renewed at least every 10 seconds and that the console may not echo fader updates caused by OSC commands, which supports local reflection plus receive-side reconciliation rather than rendering every received value as authoritative during local interaction.
  Source: https://janis-streib.de/post/behringer-x32-osc-is-quirky/
- The `x32-proxy` project exposes a subscription-pool option to combine upstream subscriptions and reduce mixer load for simultaneous clients. This reinforces the design direction of pooling/coalescing receive traffic rather than multiplying subscriptions and callbacks.
  Source: https://github.com/audiopump/x32-proxy
- React Native performance docs explain that business logic and touch handling run on the JavaScript thread, and native-backed view updates are batched before the frame deadline. A blocked JS thread means dropped frames.
  Source: https://reactnative.dev/docs/performance.html
- React Native timer docs distinguish `requestAnimationFrame` from `setTimeout(0)`: frame callbacks run after frames have flushed, while zero-timeout can fire extremely fast. This supports frame-aligned coalescing for high-frequency fader packets.
  Source: https://reactnative.dev/docs/timers
- React docs document `useRef` as appropriate for mutable information that should not trigger renders, and `Profiler` as the supported way to measure render cost. This supports ref-based packet buffering plus explicit instrumentation.
  Sources: https://react.dev/reference/react/useRef and https://react.dev/reference/react/Profiler

## Current Code Observations

- `X32Protocol.defaultScalarSubscriptionTimeFactor` is currently `5`.
- `OscClient.subscribeScalarValue(...)` sends one `/subscribe` per visible fader path and renews each path with its own interval.
- The current managed subscription key is only `address`; if different callers ever request the same address with different time factors, the first one wins silently.
- `useBusMixRemoteFaderSubscription` calls `onRemoteLevel(channel.number, level)` for every incoming subscribed value.
- `onRemoteLevel` is currently `reconcileRemoteFader`.
- `reconcileRemoteFader` immediately calls `busMixChannelStore.updateChannels(...)`.
- Every subscribed packet can therefore trigger a store update, linked-channel reducer work, subscriber notification, and React state update cascade.
- Local drag protection exists, but it is time-window based (`LOCAL_PROTECTION_WINDOW_MS = 250`) and does not explicitly discard out-of-order, duplicate, or stale remote packets after the window.
- `onOn` and `onPan` are still registered for every loaded channel, while fader level subscriptions are visible-scoped.
- `BusMixScreen` visible channels drive subscriptions, but there is no overscan/hysteresis/debounce around visibility churn.
- Diagnostics count events but do not currently expose packet rate, dropped/coalesced packet count, frame flush latency, duplicate value count, or remote-to-render delay.

## Requirements

REQ-001: Preserve correctness from `remote-fader-subscription-sync`; same-BUS remote send-level changes must still update visible BusMix faders without leaving the screen.

REQ-002: Preserve the app-to-console fader send path: optimistic UI, 30 ms send throttle, final send on release, local protection, presets, meters, and BusGroups integration.

REQ-003: Reduce perceptible remote fader lag and prevent the fader from chasing delayed values for seconds after remote movement stops.

REQ-004: Treat `/subscribe` as a high-frequency network stream that must be tuned, coalesced, and frame-aligned before touching React-visible state.

REQ-005: Default subscription rate must be conservative enough for simple mobile devices and ordinary Wi-Fi, while still feeling responsive.

REQ-006: Remote fader packets must be deduplicated by channel/path and numeric tolerance before store updates.

REQ-007: Multiple remote values arriving within one JS frame must collapse to the latest value per fader path, not replay every historical value.

REQ-008: Remote values that are likely stale echoes of recent local writes must not cause visible oscillation.

REQ-009: Remote values must continue to feed the single existing reconciliation path after coalescing so linked-channel visual reflection and shared state remain centralized.

REQ-010: The system must avoid React state updates per packet. High-frequency counters, timing, and queues should live in refs or non-rendering structures.

REQ-011: Subscription lifecycle must remain visibility-scoped and must not subscribe all 48 faders by default.

REQ-012: Visibility changes must not create subscription churn that causes network bursts while scrolling.

REQ-013: `/xremote` must remain active because it is event-style and complements `/subscribe`.

REQ-014: Meters must remain separate; no meter interval, stream, decoder, or visual meter behavior changes are allowed for this feature.

REQ-015: Diagnostics must expose enough data to tune the implementation on real hardware: incoming packet rate, applied update rate, coalesced/drop count, duplicate count, last flush duration, max remote settle time, and subscription path count.

REQ-016: Performance gates must include focused fake-timer/unit tests and manual real-console UAT on a modest device or emulator profile.

REQ-017: Any user-facing smoothing must be bounded and must never hide the final console value. Final convergence must be deterministic.

REQ-018: The implementation must explicitly document chosen subscription time factor, frame coalescing interval, duplicate tolerance, and local echo suppression window.

## Acceptance Criteria

- Remote same-BUS fader movement still updates Tacimix without leaving BusMix.
- During continuous remote fader movement, Tacimix applies at most one visible fader update per frame per channel.
- The fader does not visibly replay a backlog after remote movement stops.
- Duplicate or near-identical packets do not trigger store updates.
- Stale remote values inside the configured local echo protection window are ignored or coalesced without visual thrash.
- Subscription traffic is no more aggressive than the previous implementation unless real-console measurement proves a higher rate is necessary.
- The app remains responsive while several visible faders are subscribed.
- Existing BusMix, BusGroups, shared OSC, meter routing, and TypeScript gates pass.
- A UAT log records observed latency and settle behavior before and after optimization.

## Out Of Scope

- Replacing OSC/UDP transport.
- Moving fader animation to a native/Reanimated pipeline.
- Polling all 48 faders.
- Changing meter behavior.
- Changing fader visual design.
- Mirroring `/ch/XX/mix/fader` into BusMix send-level faders.
- Adding a user-facing diagnostics screen unless requested later.
- Solving router/Wi-Fi quality outside app-level backpressure, coalescing, and diagnostics.

## Working Hypothesis

The feature is currently correct but too eager. The X32 `/subscribe` stream can send frequent values for every visible path. The app then processes every packet as a store update, including delayed and duplicate values. Under Wi-Fi jitter or JS thread pressure, this creates a backlog. When the backlog drains, the fader visually chases old values before settling.

The likely fix is a receive pipeline with explicit backpressure:

```txt
UDP packets
  -> exact OSC listener
  -> per-path packet buffer in refs
  -> duplicate/stale echo filter
  -> requestAnimationFrame flush
  -> latest value per channel only
  -> existing reconcileRemoteFader(...)
```

The subscription rate should also be re-tuned. The previous planning suggested a conservative time factor, but the implementation default is `5`, which should be measured against the X32's real behavior and adjusted if it is causing unnecessary packet pressure.
