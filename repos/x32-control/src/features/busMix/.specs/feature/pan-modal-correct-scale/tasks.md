# Tasks - BusMix Pan Modal Correct Scale And Display

Last updated: 2026-05-24

## Task List

- [x] T-001: Correct pan value normalization for modal opening
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-008, REQ-010
  What: Verify and correct the path that converts stored channel pan into the `-100..+100` modal value. A channel with normalized X32 pan `0` must open the modal at `-100`, normalized `0.5` must open at `0`, and normalized `1` must open at `+100`. The implementation must confirm whether incorrect center positioning comes from `x32PanToPercent`, from stored `channel.pan` values, from the modal `Slider`, or from a stale local state sync. If the conversion function is already correct for valid `0..1` input, add defensive handling for unexpected `-100..100` or out-of-range values only where appropriate, without breaking normalized OSC writes.
  Where: Review and update as needed: `src/features/busMix/screens/BusMixScreen.tsx` (`openPanModal` and `getPanPercent` usage), `src/features/busMix/hooks/useBusMix.ts` (`getPanPercent`, `setPan`), and `src/shared/x32/pan.ts` (`x32PanToPercent`, `percentToX32Pan`). Do not change `BusMixService.setChannelPan` unless a verified conversion bug requires it.
  Depends on: none
  Reuses: Existing `x32PanToPercent`, `percentToX32Pan`, `setPan`, `getPanPercent`, and normalized X32 `0..1` pan model.
  Done when: Modal initial value is correct for hard-left, center, and hard-right source pan values. Conversion remains reversible enough for UI use: `-100 -> 0`, `0 -> 0.5`, `+100 -> 1`. Out-of-range values are clamped safely. Existing OSC write path still sends normalized values in `0..1`.
  Tests: Add focused unit tests for pan conversion helpers if none exist. Suggested file: `__tests__/shared/x32/pan.test.ts`. Cover `x32PanToPercent(0) === -100`, `x32PanToPercent(0.5) === 0`, `x32PanToPercent(1) === 100`, `percentToX32Pan(-100) === 0`, `percentToX32Pan(0) === 0.5`, `percentToX32Pan(100) === 1`, plus clamp behavior. Run `yarn jest __tests__/shared/x32/pan.test.ts --runInBand` and `yarn tsc`.
  Gate: Passes the focused pan conversion tests and `yarn tsc`; manual Demo check confirms a hard-left source opens with the thumb at the extreme left, not center.

  Implementation result: Completed on 2026-05-24. Added `clampPanPercent` in `src/shared/x32/pan.ts` and reused it in `percentToX32Pan` and the modal. The X32 normalized contract remains `0..1`, while the modal receives and renders the UI contract `-100..+100`.

  Verification result: `yarn jest __tests__/shared/x32/pan.test.ts --runInBand` passed with conversion coverage for `0 -> -100`, `0.5 -> 0`, `1 -> +100`, `-100 -> 0`, `0 -> 0.5`, and `+100 -> 1`. `yarn tsc` passed. Manual Demo validation remains recommended to confirm the native slider thumb placement.

- [x] T-002: Replace pan modal dual text with a single signed numeric readout
  Reqs: REQ-001, REQ-005, REQ-006, REQ-007, REQ-010
  What: Update the pan modal value display so it renders exactly one user-facing pan value. Remove the secondary text that currently sits beside the primary value. Replace directional labels such as `L 100`, `R 100`, or `C` with a signed numeric display: negative values show `-N`, zero shows `0`, and positive values show `+N`. The displayed number must be derived from the same clamped/rounded local pan value used by the slider.
  Where: Primary target is `src/features/busMix/components/PanControlModal.tsx`. Remove the `formatPanLabel` import from `@shared/x32/pan` if no longer needed. Remove or leave unused styles only if TypeScript/lint remains clean; prefer deleting `panValueNumber` style if the second text is removed. Consider adding a small local or exported formatter for the signed pan display if needed for tests.
  Depends on: T-001
  Reuses: Existing modal layout, `Slider`, Center button, theme tokens, modal animation, close button, axis markers, and `handleValueChange`.
  Done when: The modal readout contains one text value only. Examples: hard left displays `-100`; center displays `0`; hard right displays `+100`; intermediate right value displays `+37`; intermediate left value displays `-37`. The previous adjacent raw number is removed. Center button still sets `0` and updates slider/readout immediately.
  Tests: If a pure formatter is extracted/exported, add or extend focused tests for `formatSignedPanValue(-100)`, `formatSignedPanValue(0)`, and `formatSignedPanValue(100)`. If not, verify by TypeScript and manual Demo check. Run `yarn tsc`; run the focused formatter test if created.
  Gate: `yarn tsc` passes; manual Demo check confirms only one pan value is visible and it follows `-100..0..+100` semantics.

  Implementation result: Completed on 2026-05-24. `PanControlModal` now renders a single signed numeric readout through `formatSignedPanValue`. The previous adjacent raw value text and `panValueNumber` style were removed, and modal state/slider value changes are clamped through `clampPanPercent`.

  Verification result: `yarn jest __tests__/shared/x32/pan.test.ts --runInBand` passed with formatter coverage for `-100`, `0`, `+100`, `+37`, and `-37`. `yarn tsc` passed.

- [ ] T-003: Perform BusMix pan modal manual validation and update local state
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010
  What: Validate the pan modal behavior in the Demo console or simulator after implementation. Confirm the pan slider opens in the correct position for left/center/right values, the display is a single signed numeric value, the Center button works, and pan writes still update channel state without affecting fader/mute/meter/preset behavior. Update this feature's local `STATE.md` with the implementation result, validation performed, and any remaining risk.
  Where: Manual validation through app UI; documentation update in `src/features/busMix/.specs/STATE.md`; implementation summary may also mention `logs/` if a technical log is created.
  Depends on: T-001, T-002
  Reuses: Demo console, BusSelection, BusGroups, BusMix, `PanControlModal`.
  Done when: Local state records the outcome and remaining risks. Manual validation covers left, center, right, positive/negative display, Center button, and regression checks for unrelated BusMix controls.
  Tests: Manual Demo script below plus commands from previous tasks.
  Gate: Manual validation notes are recorded, and no unrelated BusMix behavior is intentionally changed.

  Implementation result: Automated implementation and state/log updates completed on 2026-05-24. Manual Demo validation was not executed in this terminal-only pass, so this task remains open specifically for simulator/device confirmation.

  Verification result: `yarn jest __tests__/shared/x32/pan.test.ts --runInBand`, `yarn jest __tests__/features/busMix --runInBand`, and `yarn tsc` passed. `yarn lint` could not run because `/bin/sh: eslint: command not found`.

## Manual Validation Script

1. Open the app with the Demo console.
2. Select any BUS.
3. Enter BusMix.
4. Open pan modal from a channel badge.
5. Move slider fully left:
   - thumb must be at extreme left;
   - display must be `-100`;
   - no adjacent text like `L 100` should appear.
6. Press Center:
   - thumb must move to center;
   - display must be `0`.
7. Move slider fully right:
   - thumb must be at extreme right;
   - display must be `+100`;
   - no adjacent text like `R 100` should appear.
8. Move slider to an intermediate left value:
   - display must be a single negative number, for example `-37`.
9. Move slider to an intermediate right value:
   - display must be a single positive number with plus sign, for example `+37`.
10. Close and reopen modal:
   - the reopened thumb position must match the channel's current pan state.
11. Confirm unrelated BusMix behavior:
   - fader still moves;
   - mute still toggles;
   - meters still render;
   - presets button still opens.

## Developer Notes

Do not solve this as a visual-only layout issue until conversion has been checked. A centered thumb for total-left input is more likely a value normalization/state problem than a style problem. The final implementation should make the data contract explicit:

```txt
X32 stored pan: 0.0 left, 0.5 center, 1.0 right
Modal UI pan: -100 left, 0 center, +100 right
```
