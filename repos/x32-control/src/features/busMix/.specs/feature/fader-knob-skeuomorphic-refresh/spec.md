# Spec - BusMix Fader Knob Skeuomorphic Refresh

Last updated: 2026-05-25

## Context

The current BusMix vertical fader thumb is visually simple: a small rectangular thumb with a top highlight. The desired change is a more physical, realistic, orthogonal, off-white fader cap inspired by a real mixing-console fader knob.

The reference visual provided by the user shows a centered white fader cap viewed straight-on, with rounded rectangular geometry, four horizontal recessed grip grooves, a thin horizontal calibration line through the center, soft 3D lighting, side occlusion, and a projected shadow.

This is a visual/style task only. It must not change fader behavior, gesture ownership, OSC send/receive behavior, meter behavior, or performance-sensitive runtime flows.

## Source Of Truth

Implementation must follow:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`
- User-provided visual/reference description in the request.

## Requirements

REQ-001: Replace the current BusMix vertical fader thumb visual with a premium off-white skeuomorphic fader cap.

REQ-002: Preserve the current thumb-only interaction model. The central fader track must remain visual-only and must not start gestures.

REQ-003: Preserve fader value conversion, drag sensitivity, raw/dB mapping, throttled send behavior, final send behavior, and callbacks.

REQ-004: The fader cap must be orthogonal/front-facing, symmetrical, and slightly taller than it is wide.

REQ-005: The cap shape must be a vertical rounded rectangle with strongly rounded corners, visually close to a smooth squircle or flattened capsule.

REQ-006: The cap color must read as matte industrial off-white/light gray plastic, not bright glossy white.

REQ-007: The cap must convey tactile relief with four horizontal recessed grip grooves, split symmetrically by a thin center calibration line.

REQ-008: The center calibration line must be continuous and visually distinct from the grip grooves.

REQ-009: The cap must have realistic volume: subtle top light, darker lower base, left/right side occlusion, internal bevels, and projected shadow.

REQ-010: The active/pressed drag state should visually compress slightly by shortening/darkening the projected shadow, without causing layout shift.

REQ-011: The component must remain performant in horizontal BusMix lists with many channel strips. Avoid per-frame JS-driven decorative animation or expensive re-render patterns.

REQ-012: The implementation must fit within the current `ChannelStrip` width and fader layout, or explicitly adjust stable dimensions without text/element overlap.

REQ-013: The implementation must not modify meter runtime files or remote fader receive/sync code.

## Acceptance Criteria

- The BusMix fader thumb looks like a robust off-white physical fader cap, matching the supplied reference direction.
- The cap has four recessed horizontal grooves.
- The center calibration line is horizontal, thin, centered, and continuous.
- The cap has rounded squircle/capsule-like corners.
- The cap has a visible 3D feel through gradients, bevels, side shadows, and projected shadow.
- Dragging still starts only on the thumb/cap.
- Dragging the track outside the thumb still does not move the fader.
- Existing fader behavior and level mapping are unchanged.
- BusMix tests and TypeScript pass.
- Manual simulator/device validation confirms the cap fits in portrait and landscape BusMix without clipping or overlapping meters/db scale.

## Out Of Scope

- Changing fader physics, drag sensitivity, or raw/dB conversion.
- Changing meter visuals.
- Changing OSC send/receive behavior.
- Changing BusGroups faders unless separately requested.
- Adding bitmap/image assets for the knob unless React Native styling cannot reproduce the requested design.
- Reworking the whole channel strip layout beyond the minimum stable dimension needed for the new cap.
