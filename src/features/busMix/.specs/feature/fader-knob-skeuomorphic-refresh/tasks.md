# Tasks - BusMix Fader Knob Skeuomorphic Refresh

Last updated: 2026-05-25

## Task List

- [x] T-001: Restyle the BusMix vertical fader cap as an off-white skeuomorphic knob
  Reqs: REQ-001 through REQ-013
  What: Replace the current simple `VerticalFader` thumb styling with a realistic physical fader cap matching the user-provided reference. The new cap should be a centered orthogonal/front-facing vertical rounded rectangle, slightly taller than wide, with matte off-white industrial plastic color, smooth squircle/capsule corners, four recessed horizontal grip grooves, a thin continuous horizontal center calibration line, subtle top/bottom bevels, lateral occlusion shadows, and a projected shadow that makes the cap feel slightly raised above the panel.
  Where:
  - Primary: `src/features/busMix/components/VerticalFader.tsx`
  - Possible theme tokens if useful: `src/shared/theme/colors.ts`
  - Tests only if existing coverage needs updates; otherwise rely on TypeScript plus manual visual validation.
  Depends on: none
  Reuses:
  - Existing `VerticalFader` `PanResponder` attached directly to the thumb.
  - Existing `THUMB_HEIGHT`, `VERTICAL_INSET`, `animatedY`, and fader raw/dB conversion logic.
  - Existing BusMix `ChannelStrip` layout and meter placement.
  Done when:
  - The thumb/cap dimensions are stable and intentionally defined, for example approximately `64x80` scaled down if needed to fit the current strip, while preserving the “slightly taller than wide” physical-cap proportion.
  - The cap uses layered React Native views/styles to approximate:
    - matte off-white base;
    - lateral convex shading;
    - top highlight and bottom shadow;
    - four recessed grooves;
    - center calibration line;
    - realistic drop shadow/elevation.
  - The pressed/dragging state shortens or darkens the projected shadow without changing layout dimensions.
  - Drag handlers remain attached to the cap only, not to the track.
  - No fader value math, callbacks, throttling, meter code, or remote receive/sync code is changed.
  Tests:
  ```sh
  yarn jest __tests__/features/busMix --runInBand
  yarn tsc
  ```
  Manual checks:
  - Open BusMix in Demo or real-console flow.
  - Confirm the new cap appears centered on the vertical track.
  - Confirm the cap has four horizontal grooves and one central calibration line.
  - Confirm the cap does not overlap the meter or dB scale in portrait.
  - Confirm the cap does not clip in landscape/compact BusMix.
  - Drag directly on the cap: fader must move normally.
  - Drag the track outside the cap: fader must not move.
  - Confirm scroll behavior is not blocked when touching outside the cap.
  Gate:
  - BusMix tests pass.
  - TypeScript passes.
  - Manual visual/touch validation passes or is explicitly logged as pending.
  Result:
  - Implemented in `src/features/busMix/components/VerticalFader.tsx` with a stable `36x52` centered cap scaled to the current `ChannelStrip` footprint.
  - Added layered React Native views for matte off-white surface, side occlusion, top highlight, bottom shade, four recessed grooves, and a continuous center calibration line.
  - Added a pressed visual state that changes only shadow/elevation, without changing fader layout or value math.
  - Preserved the existing `PanResponder` ownership on the cap itself; no gesture handlers were added to the track.
  - Did not change meters, OSC, BusMix service receive paths, fader conversion, throttling, or rollback/performance code.
  Verification:
  - `yarn tsc`: passed.
  - `yarn jest __tests__/features/busMix --runInBand`: passed, 6 suites / 32 tests.
  - Manual simulator/device visual and touch validation remains pending.

## Visual Implementation Guidance

Target style tokens from the user request:

```txt
Fader cap:
- width/height ratio: slightly taller than wide
- border radius: strong, squircle/capsule-like
- base color: matte off-white / light industrial gray
- surface: satin plastic, no strong glossy glare
- grooves: four horizontal recessed rectangular grooves
- center line: thin continuous horizontal calibration mark
- lighting: soft zenith/top light, subtle darker lower base
- side volume: left/right occlusion to simulate convex curvature
- projected shadow: darker, diffused, concentrated under/lateral edges
```

React Native styling notes:

- Use nested `View`s for grooves and center line instead of bitmap assets unless styling cannot achieve the look.
- Prefer `linear-gradient` only if an existing RN gradient dependency exists; otherwise approximate volume using layered views, background colors, borders, and shadows.
- Keep decorative layers `pointerEvents="none"` if needed so the thumb remains the single touch target.
- Avoid changing parent strip dimensions unless the cap cannot fit professionally.
- Avoid touching `useMeterSubscription`, `BusMixService`, remote fader receive hooks, or OSC code.
