# Design - BusMix Fader Meter Single Rail

Last updated: 2026-05-31

## Overview

The change should be implemented as a local BusMix composition/layout refactor. Today `ChannelStrip` renders `ChannelVuMeter` as one child and `VerticalFader` as a separate child in `styles.faderRow`. `VerticalFader` independently renders its own `styles.track`, zero mark, dB scale, and draggable thumb.

The target design is:

```txt
ChannelStrip
  -> ChannelNamePlate
  -> VerticalFader
       -> single rail slot
            -> ChannelVuMeter or placeholder
       -> zero mark / dB scale overlays
       -> Animated thumb with PanResponder
  -> footer: MuteButton + dB value
```

This keeps `VerticalFader` as the owner of fader travel geometry and touch math, while allowing the visible rail to be supplied by BusMix-specific meter UI.

## Existing Patterns Reused

- Keep feature-specific UI under `src/features/busMix/components`.
- Keep `VerticalFader` `PanResponder` attached directly to the thumb/cap, preserving the fader-thumb-only decision.
- Keep `ChannelVuMeter` pointer-safe by rendering it with `pointerEvents="none"`.
- Keep `ChannelStrip` as the integration point for channel identity, visibility, meter listener registration, fader callbacks, and footer display.
- Keep theme usage through `@shared/theme/colors`, `spacing`, and `radius`.
- Keep BusMix list virtualization constants in `BusMixScreen` stable unless implementation proves a minor width adjustment is required.

## Components Touched

Primary:

- `src/features/busMix/components/ChannelStrip.tsx`
- `src/features/busMix/components/VerticalFader.tsx`
- `src/features/busMix/components/ChannelVuMeter.tsx`

Possible:

- `src/features/busMix/screens/BusMixScreen.tsx` only if `CHANNEL_STRIP_WIDTH`, `CHANNEL_ITEM_LENGTH`, or fader height overhead must change after visual verification.
- `src/features/busMix/.specs/STATE.md`
- `.specs/project/STATE.md`
- `logs/YYYY-MM-DD_HH-MM-SS-busmix-fader-meter-single-rail-*.txt`

Avoid touching:

- `src/features/busMix/hooks/useMeterSubscription.ts`
- `src/features/busMix/utils/meterStreamRouting.ts`
- `src/features/busMix/utils/meterDecoder.ts`
- `src/features/busMix/hooks/useBusMix.ts`
- `src/features/busMix/services/BusMixService.ts`
- shared OSC/network code

## Proposed Component Contract

Add a compositional rail prop to `VerticalFader`, for example:

```ts
type VerticalFaderProps = {
  dragSensitivity?: number;
  isLinkedInteractionActive?: boolean;
  level: number;
  height: number;
  rail?: React.ReactNode;
  railWidth?: number;
  onChange: (level: number) => void;
  onChangeEnd: (level: number) => void;
  onInteractionEnd?: () => void;
  onInteractionStart?: () => void;
};
```

Implementation intent:

- `VerticalFader` owns `trackHeight`, `available`, `zeroMarkTop`, `animatedY`, and thumb positioning exactly as it does today.
- The current `styles.track` becomes the default fallback rail when no custom `rail` is supplied.
- BusMix passes `ChannelVuMeter` as `rail`.
- The `rail` wrapper must be positioned where `styles.track` is currently rendered, centered inside `trackBounds`.
- The rail must be `pointerEvents="none"` at wrapper or child level so it cannot steal gestures from the thumb.
- `railWidth` should default to the current track width of `8`, matching the existing `METER_WIDTH`.

Alternative if prop growth feels too broad:

- Create a BusMix-only wrapper such as `FaderMeterRail` and pass it through `VerticalFader` as `rail`.
- Do not duplicate fader travel math outside `VerticalFader`.

## Data Flow

No data-flow changes are intended.

Meter flow remains:

```txt
BusMixScreen
  -> useMeterSubscription(consoleIp, !isLoading)
  -> ChannelStrip registerMeterListener
  -> ChannelVuMeter
```

Fader flow remains:

```txt
VerticalFader thumb PanResponder
  -> onChange
  -> ChannelStrip displayLevel + sendLevelOnly
  -> onChangeEnd
  -> setLevel final commit
```

The only change is visual composition: `ChannelVuMeter` moves from beside `VerticalFader` into the `VerticalFader` rail position.

## State And Persistence

No new state or persistence should be added.

Existing state preserved:

- `ChannelStrip.displayLevel`
- `ChannelStrip.isDraggingRef`
- `VerticalFader` refs for current Y, start Y, sensitivity, callbacks, and pressed state
- `BusMixScreen.activeFaderChannelNumber`
- visible-channel `Set` used by meter listener lifecycle

## Gesture And Hit Testing

The highest-risk area is gesture ownership.

Rules:

- `panResponder.panHandlers` stay only on the `Animated.View` thumb.
- The rail/meter wrapper and all decorative rail layers use `pointerEvents="none"`.
- `ChannelStrip` must not add press/gesture handlers to the fader row or rail.
- The old track outside the thumb must not become interactive again.

Expected behavior:

- Finger starts on thumb: fader moves.
- Finger starts on rail outside thumb: no fader movement, list scroll remains available.
- Finger starts on strip background: list scroll remains available.

## Layout Strategy

Current geometry:

- `ChannelStrip.container.width = 86`
- `ChannelStrip.METER_WIDTH = 8`
- `ChannelStrip.faderRow` has row layout and gap `4`
- `VerticalFader.container.width = 46`
- `VerticalFader.styles.track.width = 8`
- `ChannelVuMeter` applies vertical inset `8`, matching `VerticalFader.VERTICAL_INSET = 8`
- `BusMixScreen.CHANNEL_STRIP_WIDTH = 86`

Target geometry:

- Remove the side meter column from `ChannelStrip`.
- Keep `VerticalFader.container.width = 46` initially so the dB scale and thumb still have room.
- Render the meter rail at the old center track width/position.
- Keep `METER_WIDTH = 8` unless manual visual validation proves a different width is needed.
- Keep fader height and vertical insets unchanged so meter and fader travel still share the same top/bottom bounds.
- Revisit `ChannelStrip.container.width` and `BusMixScreen.CHANNEL_STRIP_WIDTH` only after visual verification. A width reduction is allowed only if it improves alignment and is paired with `getItemLayout` updates.

## Error Handling

No new error handling is required.

Existing behavior remains:

- If a channel has a `meterChannelId`, meter values update when the strip is visible.
- If the strip is not visible, `ChannelVuMeter` unregisters and resets to off.
- If no `meterChannelId` exists, show a placeholder rail.
- Meter subscription errors remain handled by existing best-effort meter infrastructure.

## Testing Strategy

Automated:

```sh
yarn tsc
yarn jest __tests__/features/busMix --runInBand
```

Optional focused checks if constants/helpers are extracted:

```sh
yarn jest __tests__/features/busMix/utils --runInBand
```

Static checks:

```sh
rg -n "styles\\.track|faderRow|meterPlaceholder|ChannelVuMeter" src/features/busMix/components
git diff --check
```

Manual:

- Demo BusMix portrait.
- Demo BusMix landscape/compact.
- Drag thumb at low, mid, and high fader values.
- Touch/drag rail outside thumb and confirm no level change.
- Scroll horizontally from strip/fader area outside the thumb.
- Confirm active meter values render in the single rail position.
- Confirm no visible second bar remains.

## Risks And Trade-Offs

- Risk: Moving `ChannelVuMeter` into `VerticalFader` could accidentally make the rail participate in touch handling. Mitigation: keep rail pointer-events disabled and keep pan handlers on thumb only.
- Risk: The dB scale and zero mark could visually compete with the meter rail. Mitigation: treat zero mark as an overlay aligned to 0 dB, not a second vertical rail; adjust horizontal offsets only after visual validation.
- Risk: Removing the side meter may make the strip look off-center because existing widths were tuned for two bars. Mitigation: start by preserving strip width, then adjust only if manual visual check shows real imbalance.
- Risk: TSX component behavior has limited automated coverage because Jest currently discovers `*.test.ts` only. Mitigation: rely on TypeScript, existing BusMix tests, static checks, and explicit manual validation.

## Decisions

- Do not change meter protocol, meter subscriptions, or decoder logic.
- Do not move fader math out of `VerticalFader`.
- Do not make the meter rail interactive.
- Do not reduce BusMix strip/list width in the first pass unless the implementation visually requires it.
- Treat this as a visual/composition refactor with preserved runtime behavior.
