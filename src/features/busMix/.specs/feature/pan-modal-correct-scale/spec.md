# Spec - BusMix Pan Modal Correct Scale And Display

Last updated: 2026-05-24

## Context

The BusMix pan control modal currently has incorrect behavior and display for pan values.

Observed/desired problem statement from user:

- When the pan value is 100% to the left, the modal positions the control button/knob in the middle.
- The correct behavior is for total left pan to place the knob at the extreme left of the slider.
- The extra text beside the primary value must be removed.
- The modal should show only one value:
  - `-100` for total left;
  - `0` for center;
  - `+100` for total right.

Current code involved:

- `src/features/busMix/components/PanControlModal.tsx`
- `src/features/busMix/hooks/useBusMix.ts`
- `src/shared/x32/pan.ts`

Current modal display:

```tsx
<Text style={styles.panValueLabel}>{formatPanLabel(localValue)}</Text>
<Text style={styles.panValueNumber}>{localValue}</Text>
```

This creates a dual-value display such as directional label plus raw number. The requested UI is a single numeric display only.

## Source Of Truth

Implementation must follow:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/tlc-spec-driven/references/implement.md`
- `docs/skills/components-and-shared-ui/SKILL.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`

## Requirements

REQ-001: The pan modal must represent pan in a user-facing numeric scale from `-100` to `+100`.

REQ-002: `-100` must mean total left and must position the slider thumb at the extreme left.

REQ-003: `0` must mean center and must position the slider thumb exactly at the center.

REQ-004: `+100` must mean total right and must position the slider thumb at the extreme right.

REQ-005: The modal must display only one pan value, not a directional label plus a second numeric value.

REQ-006: The single displayed value must include a plus sign for positive values, no plus sign for zero, and a minus sign for negative values:

```txt
-100
0
+100
```

REQ-007: The Center button must continue to set the value to `0`.

REQ-008: Existing pan writes to the X32/M32 must continue to use the normalized OSC scale expected by the service (`0..1`) after conversion.

REQ-009: The fix must be scoped to BusMix pan behavior and must not alter fader, mute, preset, meter, or BusGroups behavior.

REQ-010: The implementation must handle numeric input defensively so out-of-range or fractional values are clamped/rounded to the display/control range before rendering.

## Acceptance Criteria

- Opening the pan modal for a channel whose pan is hard left shows the slider thumb at the left edge and displays `-100`.
- Opening the pan modal for a centered channel shows the slider thumb at center and displays `0`.
- Opening the pan modal for a channel whose pan is hard right shows the slider thumb at the right edge and displays `+100`.
- Dragging the slider left decreases the displayed value toward `-100`.
- Dragging the slider right increases the displayed value toward `+100`.
- Pressing Center sets the slider to center and displays `0`.
- The previous extra text beside the main value is gone.
- The modal no longer displays `L 100`, `R 100`, `C`, or a second adjacent raw number as the primary pan readout.
- Existing `setPan` conversion continues to send normalized values to `BusMixService.setChannelPan`.
- TypeScript passes.

## Out Of Scope

- Redesigning the whole modal.
- Changing the pan OSC path.
- Changing X32 normalized pan storage.
- Changing pan behavior outside BusMix.
- Adding saved pan presets.
- Changing channel badge behavior.
- Changing faders or meters.

## Implementation Risk Notes

The most likely root causes to verify during implementation:

1. The modal receives `value` from `getPanPercent(channel.pan)`, where `channel.pan` should be normalized `0..1`.
2. If a source stores pan as `-100..100` somewhere unexpectedly, `x32PanToPercent` clamps it to `0..1`, which can collapse invalid values to center/right-like outcomes.
3. The modal itself should not depend on `formatPanLabel` for the requested display.
4. A small pure formatting helper may make this easier to test.

