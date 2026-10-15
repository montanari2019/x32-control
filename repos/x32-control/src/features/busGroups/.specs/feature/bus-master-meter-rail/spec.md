# Spec - BusGroups Bus Master Meter Rail

Last updated: 2026-05-31

## Context

The BusGroups screen shows one Bus Master strip for the selected BUS and eight MCA strips. The Bus Master central fader currently has a narrow vertical track rendered by `VerticalGroupFader`; that track is visual-only, while the fader thumb and existing callbacks keep controlling `/bus/[01..16]/mix/fader` and `/bus/[01..16]/mix/on`.

The requested change is to show the real audio meter for that selected BUS master inside the same central Bus Master bar, similar to the BusMix channel meter behavior. The current Bus Master bar must keep its dimensions, background color, thumb alignment, gesture behavior, scroll-lock behavior, and fader/mute integration.

This feature is scoped as Complex because it crosses UI, OSC meter protocol, mock/demo providers, and real-console validation. The implementation must be conservative and must not regress BusMix meter streams.

## Research Notes

Local source-of-truth references used:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/design.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `.specs/project/STATE.md`
- `.specs/codebase/INTEGRATIONS.md`
- `.specs/codebase/TESTING.md`
- `src/features/busGroups/.specs/STATE.md`
- `docs/global/x32-control-busmix-meter-real-x32-protocolo-fix.md`

External references checked:

- Behringer X32 user manual mirror: `https://www.manualowl.com/m/Behringer/DIGITAL-MIXER-X32/Manual/463697?page=50`
  - Confirms the console Mix Bus meters page includes level meters, fader levels, and gain reduction meters for the 16 bus masters.
- Unofficial X32/M32 OSC Remote Protocol v4.0: `https://www.z80ne.com/behringer/docs/X32-OSC%20v.4.0.pdf`
  - Confirms meter requests use `/meters`, expire after about 10 seconds, return OSC blobs with a little-endian float count header, and represent linear meter values.
  - Confirms `/meters/2` is the METERS/mix bus page and its first 16 floats are the 16 bus master level meters.
  - Confirms `/meters/5` is the console surface VU meter group and needs surface/bank parameters, so it is not the primary source for a fixed selected BUS master meter.
- Stack Overflow practical X32 meter discussion: `https://stackoverflow.com/questions/79628962/how-to-access-meters-on-behringer-x32`
  - Confirms practical clients request `/meters` with a meter id string such as `/meters/1` or `/meters/2` and renew the request.
- Mixing Station X32/M32 network notes: `https://dev-core.org/ms-docs/mixers/behringer/x32/`
  - Confirms X32 remote communication is OSC over UDP and sync flows rely on renewal-style commands rather than guaranteed delivery.
- Patrick Maillot / X32-Behringer tool repository: `https://github.com/SkippyWeb/X32-Behringer-Tools`
  - Confirms the same ecosystem of X32/M32 OSC tools uses meter data and is the practical background for the protocol docs already used by this project.

Protocol decision for implementation:

- Primary meter stream: `/meters/2`.
- Request format: `client.send('/meters', ['/meters/2'])`.
- Response listener path: `/meters/2`.
- BUS master level index: `busId - 1`, valid for BUS `1..16`.
- Value conversion: reuse the existing X32 meter linear-to-dBFS conversion and clamp range used by BusMix.
- `/meters/5` remains a possible diagnostic fallback only if real-console UAT disproves `/meters/2`; it should not be used first because it is surface/bank-oriented and parameterized.

## Requirements

REQ-001: The Bus Master strip on BusGroups must show a live audio meter for the selected BUS master.

REQ-002: On real X32/M32 consoles, the meter source must be the console-reported BUS master meter from `/meters/2`, decoded from the first 16 bus master floats using `busId - 1`.

REQ-003: The meter request must follow the existing corrected X32 meter pattern: send `/meters` with the meter id as a string argument and renew before the meter stream expires.

REQ-004: The current Bus Master central bar must keep the same width, height calculation, vertical margins, background color, and rounded visual shape.

REQ-005: The meter fill must render inside the existing Bus Master central bar, allowing the current background color to remain visible behind inactive/unfilled regions.

REQ-006: The Bus Master fader thumb must remain centered over the central bar and must preserve the current fader travel, animation, drag sensitivity, and gesture callbacks.

REQ-007: Existing Bus Master control behavior must remain unchanged: master fader writes, master mute/on writes, remote fader/on listeners, loading, error handling, and horizontal scroll lock must continue working as they do now.

REQ-008: MCA strips must not receive Bus Master meter behavior, geometry changes, or network subscriptions.

REQ-009: BusMix channel meters must not regress; `/meters/1` and `/meters/13` routing, decoding, renewal, and visible-item lifecycle must remain intact.

REQ-010: Demo/mock consoles must provide a plausible Bus Master meter so the UI can be validated without hardware.

REQ-011: Invalid, missing, late, or malformed meter blobs must fail silent and leave the visual meter at the silent floor rather than surfacing user-blocking errors.

REQ-012: The implementation must avoid new network churn: one Bus Master meter stream per mounted BusGroups screen is enough, and it must clean up timers/listeners when leaving the screen or switching console/BUS.

REQ-013: The implementation must avoid excessive React state churn; meter updates should be bounded to the Bus Master strip and should not cause MCA lists or BusMix stores to re-render unnecessarily.

REQ-014: The visual result must be aligned in portrait and compact landscape, with no overlap between the meter rail, dB scale, thumb, name area, bottom dB label, assignment text, and mute button.

REQ-015: Real-console UAT must validate BUS `1`, BUS `8`, BUS `9`, and BUS `16` to catch first-index, bank-boundary, and last-index mistakes.

## Acceptance Criteria

- Opening BusGroups for a selected BUS shows meter activity in the Bus Master central bar when that BUS has signal on the console.
- The Bus Master central bar remains the same size and position as before the feature.
- The Bus Master central bar still uses the current master track background color in inactive/unfilled portions.
- The fader thumb remains centered over the bar and controls the same fader value as before.
- Dragging the Bus Master fader still disables horizontal scroll during the interaction and restores it on release/termination.
- Muting/unmuting the Bus Master still controls the existing BUS master on/off path.
- MCA strips look and behave unchanged.
- BusMix CH/AUX/FX meters still pass their existing focused tests and continue requesting `/meters/1` and `/meters/13` only for their own visible channels.
- Demo/mock mode shows a non-static Bus Master meter that follows the selected BUS master enough for visual validation.
- Malformed `/meters/2` blobs do not crash and resolve to silent meter state.
- `yarn tsc` passes.
- Focused BusGroups tests pass.
- Focused BusMix meter tests pass.
- Real-console UAT results are recorded before the feature is considered fully done.

## Out Of Scope

- Adding MCA meters.
- Adding Matrix, Main LR, Mono, or bus send meters.
- Changing BusMix fader/meter single-rail layout.
- Changing X32 fader paths, send throttling, remote-fader rollback decisions, or `/xremote` behavior.
- Adding a new diagnostics screen for meter streams.
- Persisting meter values.
- Solving unrelated BusGroups storage, DCA assignment, or channel selection behavior.
