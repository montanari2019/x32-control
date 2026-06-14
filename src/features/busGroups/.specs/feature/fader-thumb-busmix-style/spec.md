# Spec - BusGroups Fader Thumb BusMix Style

Last updated: 2026-06-01

## Context

BusMix already has a physical, skeuomorphic fader thumb in `src/features/busMix/components/VerticalFader.tsx`. That thumb is built from a fixed visual structure: a 32 x 52 cap, radius 14, pressed opacity/elevation feedback, absolute-fill surface, left/right side shades, top/bottom shade, four grooves, and a center calibration line.

BusGroups currently renders a simpler colored rectangle in `src/features/busGroups/components/VerticalGroupFader.tsx`. The Bus Master and MCA thumbs preserve their identity through color:

- Bus Master uses `colors.master.thumb` and `colors.master.label`.
- MCAs use `accentColor`, which is supplied from `colors.mca[mca.colorToken]`.

The requested change is to make BusGroups fader buttons look like the BusMix fader button while preserving the Bus Master and MCA predominant colors. This should be planned as a visual/component refactor only. It must not change fader value math, OSC behavior, meter behavior, mute behavior, MCA assignment behavior, or navigation.

## Research Notes

Local source-of-truth references used:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/components-and-shared-ui/SKILL.md`
- `docs/skills/theme-tokens/SKILL.md`
- `docs/skills/feature-structure/SKILL.md`
- `docs/skills/testing-and-jest/SKILL.md`
- `.specs/project/STATE.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/TESTING.md`
- `src/features/busGroups/.specs/STATE.md`
- `src/features/busMix/components/VerticalFader.tsx`
- `src/features/busGroups/components/VerticalGroupFader.tsx`
- `src/features/busGroups/components/GroupStrip.tsx`
- `src/features/busGroups/components/MasterStrip.tsx`
- `src/features/busGroups/components/McaStrip.tsx`
- `src/theme/tokens.colors.ts`

External research was not needed. The source of truth for this feature is the existing BusMix thumb implementation plus the local styling and testing conventions.

Observed BusMix fader thumb baseline:

- `THUMB_WIDTH = 32`
- `THUMB_HEIGHT = 52`
- `THUMB_RADIUS = 14`
- neutral surface `#C1BFBF`
- neutral border `#CFCFC8`
- groove color `#C8C8C2`
- center line `#8A8A84`
- pressed state uses lower elevation, opacity `0.6`, shorter shadow offset, and stronger shadow opacity
- visual layers:
  - `thumbSurface`
  - `thumbLeftShade`
  - `thumbRightShade`
  - `thumbTopLight`
  - `thumbBottomShade`
  - `thumbGrooveTopFirst`
  - `thumbGrooveTopSecond`
  - `thumbCenterLine`
  - `thumbGrooveBottomFirst`
  - `thumbGrooveBottomSecond`

Observed BusGroups fader thumb baseline:

- `THUMB_HEIGHT = 34`
- master and MCA thumbs use the same simple geometry with `left: 8` and `right: 8`
- master color is `colors.master.thumb`
- MCA color is `accentColor`
- border color mirrors `colors.master.label` for master and `accentColor` for MCA
- fader travel depends on `THUMB_HEIGHT`, `TRACK_EDGE_PADDING`, `THUMB_BOTTOM_GUARD`, `availableHeight`, `positionToFader`, and `faderToPosition`
- master rail meter is already rendered inside the rail and must remain untouched by this visual change

## Requirements

REQ-001: BusGroups Bus Master fader thumb must use the same visual style and layer structure as the BusMix fader thumb.

REQ-002: BusGroups MCA fader thumbs must use the same visual style and layer structure as the BusMix fader thumb.

REQ-003: The Bus Master thumb must keep its current predominant master color identity, using `colors.master.thumb` as the base surface color and `colors.master.label` or a derived light variant as the border/highlight color.

REQ-004: Each MCA thumb must keep its current predominant MCA color identity, using the existing `accentColor` from `colors.mca[mca.colorToken]` as the base surface color.

REQ-005: The implementation must introduce a new reusable fader thumb component rather than embedding another copy of the BusMix thumb JSX/styles directly into `VerticalGroupFader`.

REQ-006: The reusable component must preserve the BusMix thumb metrics by default: width 32, height 52, radius 14, layer positions, shadow values, groove count, and center calibration line placement.

REQ-007: BusMix must not visually or behaviorally regress. If the BusMix thumb is extracted into the new component, `VerticalFader` must render the same neutral thumb and keep linked pressed feedback unchanged.

REQ-008: BusGroups fader math must remain correct after adopting the taller BusMix-style thumb. The thumb height used by `availableHeight`, `TRACK_EDGE_PADDING`, hit testing, animation, and fader travel must be kept in sync with the new component metrics.

REQ-009: BusGroups fader gestures must remain unchanged from the user's perspective: immediate local movement, drag sensitivity, scroll lock callbacks, disabled MCA handling, release behavior, and termination cleanup.

REQ-010: The Bus Master rail meter, rail width, rail background, dB scale position, and existing master meter lifecycle must not change.

REQ-011: MCA and Bus Master card widths, bottom dB labels, assignment text, mute buttons, and header text must remain visually aligned in portrait and compact landscape.

REQ-012: The new component must not own fader state, network writes, OSC subscriptions, meter subscriptions, or navigation. It is visual-only and receives all interaction state through props.

REQ-013: The implementation must use existing theme tokens and local constants where possible. Any raw color constants copied from BusMix must be isolated as the neutral BusMix thumb palette or replaced by derived palette helpers.

REQ-014: The implementation must include automated coverage for any pure color/palette helper added for colored thumbs, and must run the focused BusMix and BusGroups non-regression gates.

## Acceptance Criteria

- BusGroups Bus Master thumb looks like the BusMix physical thumb, including bevel, shades, grooves, center line, and pressed feedback.
- BusGroups MCA thumbs look like the BusMix physical thumb, including bevel, shades, grooves, center line, and pressed feedback.
- Bus Master thumb still reads visually as the current master color family.
- Each MCA thumb still reads visually as its assigned MCA color family.
- BusMix faders still look the same as before this refactor.
- BusMix linked pressed feedback still dims the linked peer thumb.
- BusGroups fader values still map to the same dB/raw range and do not jump after adopting the new thumb height.
- Disabled/unassigned MCA faders remain visibly disabled and do not respond to drag.
- Bus Master meter remains inside the same rail and continues to move.
- No text, mute button, fader thumb, dB scale, or rail overlaps in portrait or compact landscape.
- `yarn tsc` passes.
- `yarn jest __tests__/features/busGroups --runInBand` passes.
- `yarn jest __tests__/features/busMix --runInBand` passes.
- Any new helper tests pass.
- `git diff --check` passes.

## Out Of Scope

- Changing BusMix meter rail behavior.
- Changing BusGroups Bus Master meter protocol or lifecycle.
- Changing fader value conversion helpers.
- Changing fader write cadence or OSC paths.
- Changing MCA assignment, persistence, or mute behavior.
- Changing BusGroups strip widths unless a tiny alignment correction is strictly required by the taller thumb.
- Adding new UI copy, in-app help text, or a settings toggle for thumb style.
