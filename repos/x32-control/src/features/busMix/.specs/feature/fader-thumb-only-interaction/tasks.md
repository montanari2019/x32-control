# Tasks - BusMix Fader Thumb-Only Interaction

Last updated: 2026-05-24

## Task List

- [x] T-001: Restrict BusMix vertical fader volume interaction to the thumb only
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006
  What: Update the BusMix vertical fader gesture hit-testing so the visual central track no longer starts or controls a volume-changing gesture. The thumb remains the only interactive fader control. A drag that starts on the thumb should behave exactly as it does today: it should call the existing change pipeline, update the displayed fader position, disable horizontal list scrolling while the drag is active, and commit the final value on release. A gesture that starts on the central track outside the thumb should be ignored by the fader and should not trigger `onInteractionStart`, `onChange`, `onChangeEnd`, or horizontal scroll locking.
  Where: Primary target is `src/features/busMix/components/VerticalFader.tsx`. Review call sites in `src/features/busMix/components/ChannelStrip.tsx` and `src/features/busMix/screens/BusMixScreen.tsx` to confirm expected callbacks and scroll-lock behavior. Do not change BusMix service, preset, meter, pan, mute, or OSC code.
  Depends on: none
  Reuses: Existing `PanResponder` flow, `currentY` thumb position tracking, `THUMB_HEIGHT`, `VERTICAL_INSET`, `dragSensitivity`, `onChangeRef`, `onChangeEndRef`, `onInteractionStartRef`, and `onInteractionEndRef`.
  Done when: `isInsideInteractiveArea` or equivalent hit-test logic accepts only touches whose adjusted Y coordinate is inside the current thumb bounds. Track-centered X hit testing must no longer make the track interactive by itself. Thumb drag remains smooth, animated, and value-accurate. The visual `styles.track`, `styles.zeroMark`, `FaderDbScale`, and `Animated.View` thumb rendering remain visually equivalent. No new state management path is introduced.
  Tests: Run `yarn tsc`. If adding or updating tests is feasible in the current test setup, add a focused test around the hit-test helper or extracted pure function. If no test is added because the current hit-test is component-internal and PanResponder/UI touch simulation is not already established for TSX components, document that limitation in the implementation summary and perform manual validation in Demo BusMix.
  Gate: Implementation is accepted only if `yarn tsc` passes and manual Demo validation confirms: dragging thumb changes volume; dragging central track outside thumb does not change volume; track visuals remain unchanged; horizontal BusMix list does not lock when the track outside thumb is touched.

  Implementation result: Completed on 2026-05-24 and corrected on 2026-05-24 after user validation showed the first coordinate-based hit-test prevented normal thumb dragging. `VerticalFader` now attaches `panResponder.panHandlers` directly to the animated thumb instead of the outer container. The visual central track has no pan handlers, while the thumb always grants the responder and keeps the original `updateFromY`, animation, dB/raw conversion, and interaction callback flow.

  Verification result: `yarn tsc` passed. `yarn jest __tests__/features/busMix --runInBand` passed. `yarn lint` could not run because `/bin/sh: eslint: command not found`; this is a local dependency/tooling issue, not a TypeScript failure. User reported the coordinate-based approach broke thumb control; implementation was adjusted to direct thumb handlers. Manual Demo validation remains recommended on simulator/device for the touch ergonomics described in the script below.

## Implementation Notes

Current code path:

```txt
VerticalFader
  -> isInsideInteractiveArea(locationX, locationY)
    -> isOnThumb OR isOnTrack
  -> PanResponder grant
  -> updateFromY
  -> onChange/onChangeEnd
```

Expected code path after the task:

```txt
VerticalFader
  -> isInsideInteractiveArea(locationX, locationY)
    -> isOnThumb only
  -> PanResponder grant only when touch starts on thumb
  -> updateFromY remains unchanged for active thumb drags
```

Important implementation detail:

- Preserve the ability to continue dragging after the user starts on the thumb, even if the finger moves outside the thumb during the drag. Only the gesture start area should be restricted.

Recommended approach:

1. Remove the `isOnTrack` branch from the fader gesture activation check.
2. Keep the existing `isOnThumb` calculation based on `currentY.current`, `THUMB_HEIGHT`, and `VERTICAL_INSET`.
3. Remove `TRACK_TOUCH_WIDTH` if it becomes unused.
4. Avoid changing `updateFromY`, animation timing, or raw/db conversion.
5. Confirm that `onPanResponderGrant` is not reached when the track alone is touched.
6. Confirm that `onInteractionStart` is still reached when the thumb is dragged.

Manual validation script:

1. Open Demo console.
2. Select any BUS.
3. Enter BusMix.
4. Pick a visible channel strip.
5. Drag the fader thumb up/down: value and dB text should change.
6. Touch/drag the central dark track above or below the thumb: value and dB text should not change.
7. Drag horizontally on/near the visual track outside the thumb: BusMix list should remain scrollable, not fader-locked.
8. Confirm meter, mute, pan, and presets are unaffected.
