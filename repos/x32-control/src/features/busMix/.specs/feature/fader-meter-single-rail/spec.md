# Spec - BusMix Fader Meter Single Rail

Last updated: 2026-05-31

## Context

Each BusMix channel strip currently shows two vertical bars in the fader area:

- a meter bar rendered by `ChannelVuMeter` in `ChannelStrip`;
- a central fader track rendered inside `VerticalFader`.

The requested change is to remove the separate central fader track and use the meter bar in its place, so each BusMix channel has one single vertical bar. The fader thumb/cap must continue to move over that single bar, and all existing BusMix behavior must remain intact.

Local source-of-truth references used for this planning pass:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/design.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/components-and-shared-ui/SKILL.md`
- `docs/skills/theme-tokens/SKILL.md`
- `.specs/project/STATE.md`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/CONVENTIONS.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`
- `docs/global/x32-control-busmix-meter-real-x32-protocolo-fix.md`

External forum/repository research was not required for this planning step because the change is a local React Native composition/layout change and the existing project docs already define the meter protocol, fader behavior, and verification gates.

## Requirements

REQ-001: BusMix channel strips must render only one vertical bar in the fader area.

REQ-002: The one visible bar must be the live meter bar, using the existing `ChannelVuMeter` data path, colors, height, and visibility/subscription lifecycle.

REQ-003: The old central fader track visual inside `VerticalFader` must be removed or made non-rendering when a meter rail is supplied.

REQ-004: The fader thumb/cap must remain visually centered over the single meter bar.

REQ-005: The fader thumb/cap must remain the only touch/drag target for fader movement.

REQ-006: Dragging the thumb must preserve the existing fader math, `dragSensitivity`, throttled send path, final release commit, and local protection behavior.

REQ-007: Touching or dragging the meter bar outside the thumb must not move the fader and must not lock the horizontal BusMix list scroll.

REQ-008: If a channel has no `meterChannelId`, the fader rail must still occupy the same stable geometry with a visual placeholder in the meter position.

REQ-009: The dB scale and zero mark must remain aligned to the fader travel range and must not create a second vertical bar.

REQ-010: The channel strip width, list item length, footer, mute button, name plate, and BusMix horizontal virtualization behavior must remain visually stable unless a small width adjustment is required to preserve alignment.

REQ-011: The change must not alter meter decoding, meter stream routing, OSC receive paths, BusMix service behavior, remote fader rollback state, presets, mute/on behavior, or pan behavior.

REQ-012: The implementation must keep linked-channel pressed feedback working: dragging one linked fader should still visually press/dim its linked peer cap.

REQ-013: The implementation must remain performant with 48 BusMix strips and should not introduce per-frame React state churn beyond the existing meter and fader updates.

REQ-014: The implementation must be validated in portrait and compact landscape layouts.

## Acceptance Criteria

- In BusMix, each channel shows one vertical meter/fader rail, not a meter bar beside a separate center track.
- The meter rail occupies the old central fader track position.
- The fader cap is centered over the meter rail at every fader value.
- Dragging the fader cap changes the level exactly as before.
- Dragging the meter rail outside the cap does not change level.
- Horizontal scrolling still works when touching outside the cap.
- Meter activity still updates for CH, AUX, and FX sources through the existing visible-item listener lifecycle.
- Channels without meter IDs show a same-sized placeholder rail and do not shift layout.
- The dB scale remains readable and aligned.
- TypeScript passes.
- BusMix focused tests pass.
- Manual Demo validation confirms portrait and landscape visual alignment.

## Out Of Scope

- Changing meter protocol requests, renewal timing, stream routing, or decoding.
- Changing X32/M32 OSC fader paths or send throttling.
- Reintroducing managed `/subscribe` fader receive behavior.
- Redesigning the fader cap artwork beyond what is needed for alignment over the meter rail.
- Reworking BusMix virtualization or changing the number/order of channels.
- Adding new user-facing controls.
