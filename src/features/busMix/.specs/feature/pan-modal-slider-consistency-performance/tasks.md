# Tasks - BusMix Pan Modal Slider Consistency Performance

Last updated: 2026-05-25

## Task List

- [x] T-001: Replace the pan modal native slider with a deterministic local pan control
  Reqs: REQ-001 through REQ-008
  What: Remove the pan modal dependency on the uncontrolled native slider for this specific modal and render a lightweight custom horizontal pan control whose thumb position is derived directly from the local signed pan value. Keep the modal label and visual thumb in the same state source.
  Where:
  - `src/features/busMix/components/PanControlModal.tsx`
  - `src/features/busMix/utils/panSlider.ts`
  - `__tests__/features/busMix/utils/panSlider.test.ts`
  Depends on: none
  Reuses:
  - `clampPanPercent`
  - `formatSignedPanValue`
  - existing `setPan` callback from `useBusMix`
  Done when:
  - `-100`, `0`, and `+100` map to left, center, and right positions.
  - Drag movement updates local modal state only.
  - Release commits the final value through `onChange`.
  - Center commits `0` immediately.
  - No fader, meter, OSC receive rollback, or BusMix service files are changed.
  Tests:
  ```sh
  yarn jest __tests__/shared/x32/pan.test.ts __tests__/features/busMix/utils/panSlider.test.ts --runInBand
  yarn jest __tests__/features/busMix --runInBand
  yarn tsc
  ```
  Manual checks:
  - Open pan modal for a hard-left console channel and verify label `-100` plus left thumb.
  - Drag pan slowly and confirm the thumb follows the finger without snapping to center.
  - Release and confirm the console receives the final pan value.
  - Press Center and confirm visual center plus console center.
  Gate:
  - Focused pan tests pass.
  - BusMix tests pass.
  - TypeScript passes.
  - Manual real-console validation is logged as pending if not executed.
  Result:
  - Replaced `@react-native-community/slider` inside `PanControlModal` with a deterministic local React Native pan control.
  - Added `panSlider` utilities so signed pan percent maps directly to visual ratio and measured position.
  - Dragging now updates modal-local value and label only; `onChange` is called on release/terminate or Center press.
  - Preserved `setPan` conversion path from `useBusMix`, so committed UI percent still maps to normalized X32 pan through `percentToX32Pan`.
  - Did not change fader, meter, BusMix service, OSC receive rollback, or AUX/FX meter files.
  Verification:
  - `yarn jest __tests__/shared/x32/pan.test.ts __tests__/features/busMix/utils/panSlider.test.ts --runInBand`: passed, 2 suites / 11 tests.
  - `yarn jest __tests__/features/busMix --runInBand`: passed, 7 suites / 37 tests.
  - `yarn tsc`: passed.
  Follow-up fix:
  - After user validation, drag still jumped through multiple positions because move events used `nativeEvent.locationX`, which can vary with nested visual slider layers during responder movement.
  - Updated pan drag to capture the initial pan value on grant and apply `PanResponderGestureState.dx` against the measured track width, while setting decorative layers to `pointerEvents="none"`.
  - Re-ran `yarn tsc`, focused pan tests, and BusMix tests: all passed.
  - Manual real-console validation remains pending.
