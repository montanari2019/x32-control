# Tasks - BusMix Fader Meter Single Rail

Last updated: 2026-05-31

## Task List

- [x] T-001: Capture current fader/meter layout baseline
  Reqs: REQ-001 through REQ-014
  What: Document the current two-bar structure and the exact geometry constants before editing runtime code. Confirm the side meter is owned by `ChannelStrip`, the center fader track is owned by `VerticalFader`, and `BusMixScreen` depends on fixed item width for `getItemLayout`.
  Where:
  - `src/features/busMix/components/ChannelStrip.tsx`
  - `src/features/busMix/components/VerticalFader.tsx`
  - `src/features/busMix/components/ChannelVuMeter.tsx`
  - `src/features/busMix/screens/BusMixScreen.tsx`
  Depends on: none
  Reuses:
  - Existing `METER_WIDTH = 8`.
  - Existing `VerticalFader` `VERTICAL_INSET = 8`.
  - Existing `CHANNEL_STRIP_WIDTH = 86`.
  Done when:
  - The implementer has confirmed current bar ownership, dimensions, and fixed-list assumptions.
  - Any pre-existing local worktree changes are identified and preserved.
  Tests:
  ```sh
  git status --short
  rg -n "METER_WIDTH|faderRow|meterPlaceholder|styles\\.track|CHANNEL_STRIP_WIDTH|CHANNEL_ITEM_LENGTH" src/features/busMix
  ```
  Gate:
  - Scope is limited to BusMix fader/meter composition and docs/log updates.
  Result:
  - Confirmed baseline: `ChannelStrip` owned the side `ChannelVuMeter` column and `VerticalFader` owned the central fader track.
  - Confirmed fixed layout assumptions: `METER_WIDTH = 8`, `VerticalFader` rail width `8`, `VERTICAL_INSET = 8`, and `BusMixScreen.CHANNEL_STRIP_WIDTH = 86`.
  - Confirmed pre-existing worktree changes existed in specs/iOS/log files and were preserved.
  Verification:
  - `git status --short`: reviewed before implementation.
  - `rg -n "METER_WIDTH|faderRow|meterPlaceholder|styles\\.track|CHANNEL_STRIP_WIDTH|CHANNEL_ITEM_LENGTH" src/features/busMix`: reviewed before implementation.

- [x] T-002: Add a custom rail slot to `VerticalFader`
  Reqs: REQ-001, REQ-003, REQ-004, REQ-005, REQ-006, REQ-009, REQ-012, REQ-013
  What: Refactor `VerticalFader` so its central visual rail can be supplied by the caller. Preserve all fader travel calculations, refs, animation, pressed state, linked pressed feedback, and callbacks. The existing fader track should remain only as the default fallback when no custom rail is supplied.
  Where:
  - Primary: `src/features/busMix/components/VerticalFader.tsx`
  Depends on: T-001
  Reuses:
  - `trackHeight`, `available`, `zeroMarkTop`, `animatedY`, `currentY`, `startY`, and `updateFromY`.
  - Existing `PanResponder` attached to `styles.thumb`.
  - Existing `FaderDbScale`.
  Implementation detail:
  - Add optional props such as `rail?: React.ReactNode` and `railWidth?: number`.
  - Use a rail wrapper centered where `styles.track` currently renders.
  - Keep the wrapper and rail content `pointerEvents="none"`.
  - Preserve default rendering with the old `styles.track` for any future `VerticalFader` consumer that does not pass a rail.
  - Avoid changing `THUMB_WIDTH`, `THUMB_HEIGHT`, `THUMB_RADIUS`, `FADER_MIN_DB`, `FADER_MAX_DB`, `RAW_MIN`, or `RAW_MAX`.
  Done when:
  - `VerticalFader` can render either the old default track or a caller-provided rail.
  - The fader cap stays centered over the rail.
  - Thumb-only drag ownership is unchanged.
  - Linked interaction visual state still applies to the cap.
  Tests:
  ```sh
  yarn tsc
  ```
  Gate:
  - TypeScript passes after the prop/interface change.
  Result:
  - Added optional `rail?: React.ReactNode` and `railWidth?: number` props to `VerticalFader`.
  - Added a centered passive custom rail layer that occupies the full fader height while preserving the existing fader travel area.
  - Preserved the old `styles.track` as the fallback when no custom rail is supplied.
  - Kept `PanResponder` ownership on the animated thumb only.
  - Preserved fader constants, raw/dB math, animation refs, pressed state, linked pressed feedback, and callbacks.
  Verification:
  - `yarn tsc`: passed.

- [x] T-003: Move `ChannelVuMeter` into the fader rail position
  Reqs: REQ-001, REQ-002, REQ-004, REQ-008, REQ-010, REQ-011, REQ-013
  What: Update `ChannelStrip` so it no longer renders a side meter beside `VerticalFader`. Instead, build a meter rail node and pass it into `VerticalFader`. The rail must use `ChannelVuMeter` when `channel.meterChannelId` exists, and a same-sized placeholder when it does not.
  Where:
  - Primary: `src/features/busMix/components/ChannelStrip.tsx`
  - Reads unchanged: `src/features/busMix/components/ChannelVuMeter.tsx`
  Depends on: T-002
  Reuses:
  - `ChannelVuMeter` props: `channelId`, `height`, `width`, `isVisible`, `registerMeterListener`.
  - Existing `METER_WIDTH = 8`.
  - Existing `meterPlaceholder` visual token values if still useful.
  Implementation detail:
  - Remove the two-child `styles.faderRow` arrangement or simplify it to a centered single `VerticalFader`.
  - Remove the side `ChannelVuMeter` sibling.
  - Pass `height={faderHeight}` and `width={METER_WIDTH}` to the rail meter exactly as before.
  - Ensure the placeholder rail has the same `height` and `width` as `ChannelVuMeter`.
  - Do not change `registerMeterListener` lifecycle or `isVisible` logic.
  - Do not alter `displayLevel`, `isDraggingRef`, or fader callbacks.
  Done when:
  - There is no separate side meter column in `ChannelStrip`.
  - A live meter appears at the old center fader track position.
  - A no-meter channel has stable geometry and does not shift the thumb or footer.
  Tests:
  ```sh
  yarn tsc
  yarn jest __tests__/features/busMix --runInBand
  ```
  Gate:
  - BusMix tests and TypeScript pass.
  Result:
  - Removed the side meter/fader row composition from `ChannelStrip`.
  - Built a meter rail node in `ChannelStrip` and passed it to `VerticalFader`.
  - `ChannelVuMeter` now renders in the old central fader track position.
  - No-meter channels render a same-sized passive placeholder rail with the same vertical inset.
  - Preserved `displayLevel`, dragging protection, `isVisible`, `registerMeterListener`, and fader callbacks.
  Verification:
  - `yarn tsc`: passed.
  - `yarn jest __tests__/features/busMix --runInBand`: passed, 7 suites / 37 tests.

- [x] T-004: Remove the visible second bar without breaking scale/zero alignment
  Reqs: REQ-001, REQ-003, REQ-004, REQ-009, REQ-010, REQ-014
  What: Tune `VerticalFader` styles after the rail move so the old fader track is not visible when a meter rail is supplied, the zero mark remains aligned to the fader's 0 dB position, and the dB scale remains readable without making the UI look like it has a second vertical bar.
  Where:
  - `src/features/busMix/components/VerticalFader.tsx`
  - `src/features/busMix/components/ChannelStrip.tsx`
  - Possibly `src/features/busMix/screens/BusMixScreen.tsx` if strip width must be adjusted.
  Depends on: T-003
  Reuses:
  - Existing `FaderDbScale` component.
  - Existing `zeroMarkTop` calculation.
  - Existing `colors.fader.zeroMark`, `colors.fader.scaleText`, and meter colors.
  Implementation detail:
  - Keep the zero mark as a horizontal overlay, not a vertical rail.
  - Check whether `zeroMark` `left/right` offsets still look correct with the meter rail.
  - Keep `dbScale` to the side of the rail unless it causes overlap.
  - Only adjust `ChannelStrip.container.width`, `BusMixScreen.CHANNEL_STRIP_WIDTH`, and `CHANNEL_ITEM_LENGTH` together if visual validation shows the old 86 px width is now unbalanced.
  - Do not change `faderHeight` calculation unless the fader/meter clips in compact layout.
  Done when:
  - Only one vertical bar is visible in the fader area.
  - The cap, meter rail, zero mark, and dB scale are visually aligned.
  - No text/footer/name plate overlap is introduced.
  Tests:
  ```sh
  yarn tsc
  git diff --check
  ```
  Manual checks:
  - Portrait BusMix: no second vertical bar.
  - Landscape/compact BusMix: no clipping and no overlap.
  - Low/mid/high fader values: cap remains centered over rail.
  Gate:
  - TypeScript and diff whitespace checks pass; manual visual checks pass or are logged as pending.
  Result:
  - The old central fader track is no longer rendered when `ChannelStrip` supplies the meter rail.
  - The single visible rail is the meter or placeholder rail.
  - The zero mark remains a horizontal overlay using the existing `zeroMarkTop` calculation.
  - The dB scale remains in `VerticalFader` and no BusMix strip width or list item length change was needed.
  Follow-up:
  - Reduced BusMix channel strip width from `86` to `71` and kept the FlatList item length aligned at `CHANNEL_STRIP_WIDTH + CHANNEL_STRIP_GAP`.
  - This yields an item length of `72`, targeting about 5.5 visible channels on wider portrait phones while keeping the existing screen padding.
  - Added single-line, font-shrink protection to the dB label so it does not wrap in the narrower strip.
  Verification:
  - `yarn tsc`: passed.
  - `git diff --check`: passed.
  Manual:
  - Manual portrait/landscape visual runtime validation was not executed in this terminal session and remains pending.

- [ ] T-005: Verify gesture ownership and horizontal scroll behavior
  Reqs: REQ-005, REQ-006, REQ-007, REQ-012
  What: Confirm the meter rail did not become a fader touch target and did not block list scroll. The only interactive fader surface must remain the thumb/cap.
  Where:
  - `src/features/busMix/components/VerticalFader.tsx`
  - `src/features/busMix/components/ChannelStrip.tsx`
  - Manual Demo BusMix runtime.
  Depends on: T-004
  Reuses:
  - Existing thumb-only `PanResponder` from `fader-thumb-only-interaction`.
  - Existing `onFaderInteractionStart` / `onFaderInteractionEnd` scroll lock callbacks.
  Done when:
  - Starting a gesture on the cap moves the fader.
  - Starting a gesture on the meter rail outside the cap does not move the fader.
  - Starting a horizontal drag outside the cap scrolls the BusMix list.
  - Dragging one linked fader still dims/presses the linked peer cap.
  Tests:
  ```sh
  yarn jest __tests__/features/busMix --runInBand
  yarn tsc
  ```
  Manual checks:
  - Demo BusMix fader drag on cap.
  - Demo BusMix rail touch outside cap.
  - Demo BusMix horizontal scroll from fader area outside cap.
  - Linked channel pressed visual check if a linked pair is available.
  Gate:
  - Automated gates pass and manual gesture result is recorded.
  Result:
  - Static code verification confirms `panResponder.panHandlers` remain attached only to the animated thumb.
  - The custom rail wrapper, `ChannelVuMeter`, and placeholder rail use passive/pointer-safe rendering.
  - No fader gesture handlers were added to `ChannelStrip`, the rail, or the strip body.
  - Automated gates passed.
  Pending:
  - Manual Demo/runtime gesture validation remains pending: cap drag, rail touch outside cap, horizontal scroll from fader area outside cap, and linked peer pressed visual.
  Verification:
  - `yarn jest __tests__/features/busMix --runInBand`: passed, 7 suites / 37 tests.
  - `yarn tsc`: passed.

- [x] T-006: Verify meter lifecycle and non-regression boundaries
  Reqs: REQ-002, REQ-008, REQ-011, REQ-013
  What: Prove the change did not alter meter subscriptions, meter decoding, stream routing, BusMix service behavior, OSC receive behavior, presets, pan, or mute/on. This is primarily a static and focused-test non-regression task.
  Where:
  - `src/features/busMix/hooks/useMeterSubscription.ts`
  - `src/features/busMix/utils/meterStreamRouting.ts`
  - `src/features/busMix/utils/meterDecoder.ts`
  - `src/features/busMix/hooks/useBusMix.ts`
  - `src/features/busMix/services/BusMixService.ts`
  - `src/features/busMix/components`
  Depends on: T-003
  Reuses:
  - Existing BusMix meter tests.
  - Existing BusMix service/store/preset tests.
  Done when:
  - `git diff` shows no unintended edits to meter runtime, BusMix service, OSC, presets, or pan.
  - Existing BusMix tests pass.
  - `ChannelVuMeter` still registers only when visible and resets when invisible/unmounted.
  Tests:
  ```sh
  git diff -- src/features/busMix/hooks src/features/busMix/services src/features/busMix/utils src/shared/osc
  yarn jest __tests__/features/busMix --runInBand
  yarn tsc
  ```
  Gate:
  - No unintended runtime files changed; BusMix tests and TypeScript pass.
  Result:
  - No hooks, services, meter decoder/routing utilities, or shared OSC files were edited.
  - `ChannelVuMeter` still owns meter listener registration and visibility reset behavior.
  - Preserved BusMix service behavior, OSC receive behavior, presets, pan, mute/on, AUX/FX meter isolation, and remote fader rollback state.
  Verification:
  - `git diff -- src/features/busMix/hooks src/features/busMix/services src/features/busMix/utils src/shared/osc`: no diff.
  - `yarn jest __tests__/features/busMix --runInBand`: passed, 7 suites / 37 tests.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed, 2 suites / 10 tests.
  - `yarn tsc`: passed.

- [x] T-007: Update state docs and create implementation log
  Reqs: REQ-010, REQ-011, REQ-014
  What: After implementation, update the BusMix local state and global project state with the actual result, verification commands, and any manual-validation gaps. Create a compact log entry following the `/logs` convention.
  Where:
  - `src/features/busMix/.specs/STATE.md`
  - `.specs/project/STATE.md`
  - `logs/YYYY-MM-DD_HH-MM-SS-busmix-fader-meter-single-rail-implementation.txt`
  Depends on: T-002 through T-006
  Reuses:
  - Existing BusMix state format.
  - Existing concise log style in `/logs`.
  Done when:
  - State docs identify `fader-meter-single-rail` as implemented or partially implemented.
  - Log records files changed, preserved behavior, tests run, and pending manual checks.
  Tests:
  ```sh
  git diff --check
  ```
  Gate:
  - Documentation matches the runtime result and does not describe unverified manual UAT as complete.
  Result:
  - Updated `src/features/busMix/.specs/STATE.md`.
  - Updated `.specs/project/STATE.md`.
  - Created implementation log at `logs/2026-05-31_14-29-13-busmix-fader-meter-single-rail-implementation.txt`.
  - Created follow-up density log at `logs/2026-05-31_14-38-33-busmix-channel-strip-density-followup.txt`.
  - Documented automated verification as complete and manual visual/gesture validation as pending.
  Verification:
  - `git diff --check`: passed.

## Implementation Notes

- This is a visual/composition refactor, not a meter protocol refactor.
- Keep the meter rail passive with `pointerEvents="none"`.
- Keep the fader cap as the only drag target.
- Keep fader math in `VerticalFader`; do not duplicate it in `ChannelStrip`.
- Keep meter listener registration in `ChannelStrip` through `ChannelVuMeter`.
- Prefer preserving `ChannelStrip` width initially. Only reduce/update fixed item width after visual verification.
- Do not touch the remote fader `/subscribe` rollback state.
- Do not touch Local Network permission preflight.
- Do not touch AUX/FX meter stream isolation.
