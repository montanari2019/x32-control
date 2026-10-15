# Design - BusGroups Fader Thumb BusMix Style

Last updated: 2026-06-01

## Overview

Create one reusable visual fader thumb component from the existing BusMix thumb and adopt it in BusGroups for both Bus Master and MCA faders.

Target structure:

```txt
src/shared/components/FaderThumb.tsx
  -> exports FADER_THUMB_METRICS
  -> exports neutral BusMix palette
  -> renders physical thumb layers

BusMix VerticalFader
  -> keeps Animated.View gesture/position owner
  -> renders <FaderThumb palette="neutral" pressed={...} />

BusGroups VerticalGroupFader
  -> keeps PanResponder, fader math, meter rail, dB scale
  -> renders <FaderThumb palette={master or MCA colored palette} pressed={...} />
```

The component should be visual-only. The owning fader components continue to own `Animated.Value`, `PanResponder`, drag callbacks, disabled behavior, hit testing, and fader conversion math.

## Existing Patterns Reused

- BusMix `VerticalFader` is the visual source of truth for the thumb shape, shadows, grooves, center line, pressed feedback, and default metrics.
- BusGroups `VerticalGroupFader` remains the source of truth for BusGroups fader travel, track positioning, dB scale positioning, disabled state, and the master meter rail.
- `colors.master.thumb`, `colors.master.label`, and `colors.mca[...]` remain the source of BusGroups color identity.
- Shared UI belongs in `src/shared/components` when reused across features.
- Pure helpers can live in `src/shared/utils` if they need automated `.test.ts` coverage without adding TSX render tests.
- Focused tests stay under `__tests__` and should use existing `*.test.ts` patterns.

## Component Contract

Recommended file:

```txt
src/shared/components/FaderThumb.tsx
```

Recommended exports:

```ts
export const FADER_THUMB_METRICS = {
  width: 32,
  height: 52,
  radius: 14,
} as const;

export type FaderThumbPalette = {
  surface: string;
  border: string;
  groove: string;
  centerLine: string;
};

export const FADER_THUMB_NEUTRAL_PALETTE: FaderThumbPalette = {
  surface: '#C1BFBF',
  border: '#CFCFC8',
  groove: '#C8C8C2',
  centerLine: '#8A8A84',
};

type FaderThumbProps = {
  palette?: FaderThumbPalette;
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
```

Implementation constraints:

- Render a normal `View`, not an `Animated.View`, so feature faders can keep owning animation transforms.
- Accept style for absolute positioning, but keep internal layer sizes stable.
- Use `pointerEvents="none"` internally if the thumb is rendered inside an animated responder wrapper.
- Keep the same child layer order from BusMix so highlights/shadows stack identically.
- Keep the same positions:
  - top grooves at `10` and `17`
  - center line at `25`
  - bottom grooves at `34` and `41`
  - top light height `16`
  - bottom shade height `16`
  - left shade width `7`
  - right shade width `8`
- Keep the pressed style equivalent to BusMix:
  - elevation `5`
  - opacity `0.6`
  - shadow offset `{ width: 0, height: 4 }`
  - shadow opacity `0.5`
  - shadow radius `7`

## Palette Design

BusMix neutral palette must render exactly like the current BusMix thumb.

BusGroups colored palettes should preserve the same physical structure while making the base color dominant:

- Master base: `colors.master.thumb`
- Master border/highlight: `colors.master.label`
- MCA base: `accentColor`
- MCA border/highlight: derived from `accentColor`

If a helper is introduced, prefer a small deterministic utility:

```txt
src/shared/utils/faderThumbPalette.ts
```

Suggested API:

```ts
export const getColoredFaderThumbPalette = (
  surfaceColor: string,
  borderColor?: string,
): FaderThumbPalette;
```

Suggested behavior:

- Accept `#RRGGBB` colors.
- Return neutral palette for invalid or unsupported color strings.
- Use `surfaceColor` unchanged as the dominant surface.
- Use explicit `borderColor` when provided.
- Otherwise derive:
  - `border` by mixing surface toward white.
  - `groove` by mixing surface toward white with a smaller ratio.
  - `centerLine` by mixing surface toward black.
- Keep derived colors deterministic and covered by unit tests.

Why derive colors instead of using fixed grey grooves:

- Grey grooves would visually fight saturated MCA colors.
- Derived groove/center colors keep the BusMix physical structure while preserving each MCA's color identity.

## BusMix Migration

`src/features/busMix/components/VerticalFader.tsx` should keep:

- `THUMB_WIDTH`, `THUMB_HEIGHT`, and `THUMB_RADIUS` behavior through `FADER_THUMB_METRICS`.
- `isThumbPressed`.
- `isLinkedInteractionActive`.
- `Animated.View` as the gesture owner.
- `panResponder.panHandlers` on the animated thumb wrapper.
- existing `positionToRaw`, `rawToPosition`, track math, dB scale, rail slot, zero mark, and custom rail behavior.

The inline thumb JSX should be replaced by:

```tsx
<FaderThumb pressed={isThumbPressed || isLinkedInteractionActive} />
```

or by an equivalent wrapper that keeps the existing transform and pan handlers.

The BusMix neutral visual must be unchanged. This migration is primarily to make the shared component prove parity against the current source.

## BusGroups Adoption

`src/features/busGroups/components/VerticalGroupFader.tsx` should:

- Import `FADER_THUMB_METRICS`, `FaderThumb`, and the palette helper.
- Replace `THUMB_HEIGHT = 34` with `FADER_THUMB_METRICS.height`.
- Use `FADER_THUMB_METRICS.width` and `FADER_THUMB_METRICS.radius` through the shared component rather than local thumb size styling.
- Keep `TRACK_EDGE_PADDING = THUMB_HEIGHT / 2`.
- Keep `THUMB_BOTTOM_GUARD = 8` unless visual UAT proves a small adjustment is needed.
- Keep `TRACK_TOUCH_WIDTH = 24` unless hit testing becomes too narrow after the visual change.
- Add local `isThumbPressed` state similar to BusMix:
  - set true in `onPanResponderGrant`
  - set false in `onPanResponderRelease`
  - set false in `onPanResponderTerminate`
- Pass `pressed={isThumbPressed}` to `FaderThumb`.
- Keep disabled behavior on the outer container so unassigned MCA faders remain visually muted and non-interactive.
- Center the 32 px thumb over the current 5 px rail with `left: '50%'` and `marginLeft: -FADER_THUMB_METRICS.width / 2`, matching BusMix's centering approach.
- Remove the old `thumbLine`, `masterThumb`, and `mcaThumb` styles after they are no longer used.
- Keep `renderMasterMeterFill` and all meter styles unchanged.

The BusGroups fader owner should still look like:

```txt
VerticalGroupFader
  -> track with optional master meter fill
  -> dB scale
  -> Animated.View wrapper with transform
       -> FaderThumb colored palette
```

## Layout Notes

The new thumb is taller than the current BusGroups thumb:

- current BusGroups thumb height: 34
- BusMix thumb height: 52

This means the implementation must not simply swap visuals. It must update all math that uses thumb height:

- `TRACK_EDGE_PADDING`
- `availableHeight`
- hit testing `isOnThumb`
- track top/bottom margins
- animated `translateY`
- initial animation sync on value changes

Expected visual effect:

- The rail remains 5 px wide.
- The thumb becomes a 32 px physical cap centered over the rail.
- The cap may be slightly narrower than the old left/right-filled BusGroups rectangle; that is expected because the request is to match BusMix.
- Strip widths should remain `72` for master and `70` for MCA unless manual layout check proves the cap clips or overlaps.

Compact landscape must be checked carefully because `trackHeight` can be small. The fader code already clamps available height to at least 1; this must remain.

## Test Strategy

Automated:

```sh
yarn tsc
yarn jest __tests__/features/busGroups --runInBand
yarn jest __tests__/features/busMix --runInBand
git diff --check
```

If a palette helper is added:

```sh
yarn jest __tests__/shared/utils/faderThumbPalette.test.ts --runInBand
```

Manual UAT:

- Demo Console BusGroups portrait:
  - Bus Master thumb uses BusMix physical style and master color.
  - MCA 1..8 thumbs use BusMix physical style and each MCA color.
  - dB label and assignment text are not overlapped.
  - mute buttons remain aligned.
- Demo Console BusGroups compact landscape:
  - no clipping/overlap with the taller thumb.
  - horizontal scroll lock still works while dragging.
- BusMix portrait:
  - fader thumbs look unchanged.
  - linked pressed feedback still dims both linked peers.
- Real console, when available:
  - fader movement and release still control the same values.
  - Bus Master meter still moves after the visual change.

## Risks And Mitigations

- Risk: The 52 px BusMix thumb changes BusGroups fader travel if math is not updated.
  - Mitigation: use `FADER_THUMB_METRICS.height` everywhere BusGroups currently uses local `THUMB_HEIGHT`.
- Risk: Colorized grooves may reduce contrast on yellow/amber MCAs.
  - Mitigation: derive center/groove colors toward black/white and manually check all 8 MCA colors.
- Risk: Extracting BusMix thumb could accidentally change BusMix appearance.
  - Mitigation: keep neutral palette constants identical and run BusMix focused tests plus manual visual check.
- Risk: Component render tests are not currently standard in this repo.
  - Mitigation: unit-test pure palette helpers and rely on TypeScript plus manual UI validation for the visual component.
- Risk: The shared component could become too smart.
  - Mitigation: keep it visual-only; no gesture, no state except style props, no app feature imports.
