# Spec - BusMix Fader Thumb-Only Interaction

Last updated: 2026-05-24

## Context

The BusMix vertical fader currently allows the user to change a channel volume by interacting with more than the fader thumb. In `src/features/busMix/components/VerticalFader.tsx`, the gesture activation logic treats both the thumb and the central visual track as interactive areas.

Current behavior:

- Dragging the fader thumb changes channel volume.
- Touching/dragging the central track also captures the gesture and changes channel volume.
- The central track is both a visual volume rail and an interaction target.

Desired behavior:

- Only the fader thumb should control volume.
- The central track should become visual-only.
- The dB scale and zero mark should remain visual-only.
- The fader should keep its current look, dimensions, animation behavior, and integration with BusMix state.

## Source Of Truth

Implementation must follow these project docs/skills as source of truth:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/implement.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/components-and-shared-ui/SKILL.md`
- `docs/skills/custom-hooks/SKILL.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`

## Requirements

REQ-001: The BusMix central fader track must not start a volume-changing gesture.

REQ-002: The BusMix fader thumb must remain the only touch/drag area that starts and controls channel volume changes.

REQ-003: The central fader track, zero mark, and dB ruler must remain visually unchanged unless a tiny implementation-only hit-area adjustment is strictly necessary.

REQ-004: Existing fader behavior after a thumb gesture starts must be preserved, including drag sensitivity, optimistic UI update, `onChange`, `onChangeEnd`, and interaction start/end callbacks.

REQ-005: The change must be scoped to the BusMix vertical fader behavior and must not alter BusGroups master/MCA fader behavior unless the same component is intentionally shared and the implementation confirms the effect is desired.

REQ-006: The change must preserve list-scroll ergonomics: touching the non-interactive track area should not unnecessarily lock the BusMix horizontal list as an active fader drag.

## Acceptance Criteria

- Touching or dragging directly on the central vertical track outside the thumb does not call BusMix level change handlers.
- Touching or dragging the fader thumb still changes the channel volume.
- Releasing the thumb still commits the final level through the existing `onChangeEnd` path.
- The visual track remains visible and continues to show fader position context.
- The zero mark and dB scale remain visible and aligned.
- BusMix horizontal scrolling is not disabled when the user starts a gesture on the visual-only track outside the thumb.
- TypeScript passes after implementation.

## Out Of Scope

- Redesigning the fader visual style.
- Changing the fader value scale.
- Changing meter behavior.
- Changing pan/mute behavior.
- Changing preset behavior.
- Adding a new fader library.
- Reworking BusGroups faders unless implementation confirms the exact same shared component is used and the product wants the same behavior there.

