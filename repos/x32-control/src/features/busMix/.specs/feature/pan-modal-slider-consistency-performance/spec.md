# Spec - BusMix Pan Modal Slider Consistency Performance

Last updated: 2026-05-25

## Context

The BusMix pan modal can display an inconsistent state when a pan value arrives from the console at the far-left position: the numeric value shows `-100`, but the slider thumb can remain visually centered. During manual movement, the pan control also feels stiff/unstable, likely because every native slider value tick immediately updates shared BusMix state and sends OSC to the console.

External reference notes:

- `@react-native-community/slider` documents `value` as a write-only/programmatic value and states that the component is not controlled; `onValueChange` is continuously called while dragging and `onSlidingComplete` is called when the user releases the slider.
- The X32/M32 OSC protocol represents binary float pan values in `[0.0, 1.0]`, where `0.5` is center and `0.75` is half-right. X32node-style text ranges describe pan as `-100.0..+100.0` in steps of `2.0`.

## Requirements

REQ-001: The pan modal visual control must always match the displayed signed pan value.

REQ-002: A value of `-100` must render the thumb at the left end, `0` at center, and `+100` at the right end.

REQ-003: The modal must preserve the existing signed numeric display format from `-100` through `+100`.

REQ-004: Dragging the pan control must update the modal-local value immediately without sending OSC continuously for every move event.

REQ-005: The app must commit/send the pan value when the user releases the pan control, and commit immediately when pressing Center.

REQ-006: Existing X32 normalized pan conversion must be preserved: UI percent `-100..+100` maps to console float `0..1`.

REQ-007: The change must avoid touching BusMix faders, meters, OSC receive rollback behavior, or AUX/FX meter stability code.

REQ-008: The implementation must remain lightweight and deterministic on modest devices.

## Acceptance Criteria

- Opening a channel with console pan hard-left shows `-100` and the thumb at the left edge.
- Opening a centered channel shows `0` and the thumb centered.
- Opening a hard-right channel shows `+100` and the thumb at the right edge.
- Dragging the pan thumb feels smooth and updates only the local modal label during the gesture.
- Releasing the pan thumb sends one committed pan value to the existing `setPan` path.
- Pressing Center moves the thumb to center and sends one committed center value.
- TypeScript and focused pan/BusMix tests pass.

## Out Of Scope

- Changing channel fader behavior.
- Changing X32 pan path construction.
- Changing meter subscriptions.
- Adding remote pan `/subscribe` polling.
- Reworking the whole BusMix layout.
