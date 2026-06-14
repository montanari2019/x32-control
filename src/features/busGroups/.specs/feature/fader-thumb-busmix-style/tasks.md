# Tasks - BusGroups Fader Thumb BusMix Style

Last updated: 2026-06-01

## Task List

- [x] T-001: Confirm current BusMix and BusGroups fader thumb baselines
  Reqs: REQ-001 through REQ-014
  What: Re-read the current BusMix thumb implementation and BusGroups fader implementation immediately before runtime edits so the shared component is copied from the actual source and no unrelated behavior is changed.
  Where:
  - `src/features/busMix/components/VerticalFader.tsx`
  - `src/features/busGroups/components/VerticalGroupFader.tsx`
  - `src/features/busGroups/components/GroupStrip.tsx`
  - `src/features/busGroups/components/MasterStrip.tsx`
  - `src/features/busGroups/components/McaStrip.tsx`
  - `src/theme/tokens.colors.ts`
  Depends on: none
  Reuses:
  - BusMix thumb visual layer names, dimensions, shadows, and pressed style.
  - BusGroups existing color inputs: `colors.master.thumb`, `colors.master.label`, and `accentColor`.
  - BusGroups existing fader math: `clampFader`, `positionToFader`, `faderToPosition`.
  Done when:
  - Confirmed BusMix thumb dimensions are width `32`, height `52`, radius `14`.
  - Confirmed BusMix neutral palette values are `#C1BFBF`, `#CFCFC8`, `#C8C8C2`, and `#8A8A84`.
  - Confirmed BusGroups thumb height, hit test, available height, and track margins all depend on `THUMB_HEIGHT`.
  - Confirmed BusGroups master meter fill is inside `styles.track` and must not be moved.
  - Current `git status --short` is reviewed and unrelated user changes are left untouched.
  Tests:
  ```sh
  git status --short
  rg -n "THUMB_WIDTH|THUMB_HEIGHT|THUMB_RADIUS|thumbSurface|thumbGroove|thumbCenterLine|thumbPressed|isLinkedInteractionActive" src/features/busMix/components/VerticalFader.tsx
  rg -n "THUMB_HEIGHT|TRACK_EDGE_PADDING|TRACK_TOUCH_WIDTH|thumbLine|masterThumb|mcaThumb|renderMasterMeterFill|meterFill" src/features/busGroups/components/VerticalGroupFader.tsx
  ```
  Gate:
  - Do not start runtime edits until the exact BusMix thumb baseline and BusGroups fader math dependencies are known.
  Result:
  - Confirmed BusMix thumb source uses width `32`, height `52`, radius `14`, physical shade/groove/center-line layers, and linked pressed feedback.
  - Confirmed BusGroups previous thumb height was `34` and that fader travel/hit testing depended on `THUMB_HEIGHT`.
  - Confirmed BusGroups master meter fill stays inside the track and was not moved by this feature.
  Verification:
  - `git status --short`: reviewed before runtime edits.
  - `rg` baseline checks: reviewed.

- [x] T-002: Add a deterministic colored fader thumb palette helper
  Reqs: REQ-003, REQ-004, REQ-013, REQ-014
  What: Create a small pure helper that turns a base color into the palette needed by the shared physical thumb, keeping BusMix neutral values exact and BusGroups colored thumbs visually coherent.
  Where:
  - `src/shared/utils/faderThumbPalette.ts`
  - `__tests__/shared/utils/faderThumbPalette.test.ts`
  Depends on: T-001
  Reuses:
  - Existing project pattern for pure utility tests under `__tests__/shared/utils`.
  - Existing hex color usage from `ChannelStrip` and `BusCard`, but do not copy UI-specific code from those components.
  Implementation detail:
  - Export `FaderThumbPalette` from the shared component or define the type in one place and import it here.
  - Add `getColoredFaderThumbPalette(surfaceColor: string, borderColor?: string): FaderThumbPalette`.
  - Support only `#RRGGBB` input initially.
  - Return the neutral BusMix palette for invalid, empty, alpha, named, or non-hex input.
  - Keep `surface` exactly equal to `surfaceColor` for valid input.
  - Use explicit `borderColor` when provided and valid.
  - Derive default `border` by mixing `surfaceColor` toward white.
  - Derive `groove` by mixing `surfaceColor` toward white with a smaller ratio than border.
  - Derive `centerLine` by mixing `surfaceColor` toward black.
  - Keep all output strings uppercase or lowercase consistently; tests should assert the chosen convention.
  - Keep helper independent from React Native and feature modules.
  Done when:
  - Valid MCA colors produce a palette whose `surface` is unchanged and whose derived fields are deterministic.
  - Master color plus explicit master border returns the exact provided master border.
  - Invalid color input falls back to the neutral BusMix palette.
  - The helper has no dependency on BusMix or BusGroups.
  Tests:
  ```sh
  yarn jest __tests__/shared/utils/faderThumbPalette.test.ts --runInBand
  yarn tsc
  ```
  Gate:
  - Helper tests pass before using the palette in UI components.
  Result:
  - Added `src/shared/utils/faderThumbPalette.ts`.
  - Added `FADER_THUMB_NEUTRAL_PALETTE`, `FaderThumbPalette`, and `getColoredFaderThumbPalette`.
  - Added deterministic palette tests for invalid fallback, MCA color derivation, and explicit master border behavior.
  Verification:
  - `yarn jest __tests__/shared/utils/faderThumbPalette.test.ts --runInBand`: passed.
  - `yarn tsc --noEmit`: passed.

- [x] T-003: Extract the BusMix thumb visual into a shared component
  Reqs: REQ-001, REQ-005, REQ-006, REQ-007, REQ-012, REQ-013
  What: Create a reusable visual-only fader thumb component from the existing BusMix thumb JSX/styles and migrate BusMix `VerticalFader` to use it without changing BusMix behavior or appearance.
  Where:
  - `src/shared/components/FaderThumb.tsx`
  - `src/features/busMix/components/VerticalFader.tsx`
  - Optional barrel update only if existing shared components use one; otherwise import by direct file path.
  Depends on: T-001, T-002
  Reuses:
  - Current BusMix internal JSX layer order and style values.
  - `FADER_THUMB_NEUTRAL_PALETTE`.
  - `FADER_THUMB_METRICS`.
  Implementation detail:
  - Export `FADER_THUMB_METRICS = { width: 32, height: 52, radius: 14 } as const`.
  - Export `FADER_THUMB_NEUTRAL_PALETTE` with the exact current BusMix neutral values.
  - Render the same layers as BusMix:
    - surface
    - left shade
    - right shade
    - top light
    - bottom shade
    - two top grooves
    - center line
    - two bottom grooves
  - Keep visual layer positions identical to BusMix.
  - Keep base container shadow/elevation identical to BusMix.
  - Keep pressed style identical to BusMix.
  - Do not include `Animated.Value`, `PanResponder`, gesture callbacks, fader level props, meter props, or disabled logic in `FaderThumb`.
  - In `VerticalFader`, replace only the inner thumb visual with the shared component.
  - Keep `Animated.View` as the owner of `transform`, absolute positioning, and `panResponder.panHandlers`.
  - Replace local thumb metric constants in BusMix with `FADER_THUMB_METRICS` or verify they remain exactly aligned if local aliases are kept.
  - Remove now-unused BusMix thumb visual styles after migration.
  Done when:
  - BusMix fader renders the shared neutral thumb.
  - BusMix fader math, pan responder, custom rail, zero mark, dB scale, and linked pressed feedback are unchanged.
  - No duplicate copy of the physical thumb layer JSX remains in BusMix.
  Tests:
  ```sh
  yarn tsc
  yarn jest __tests__/features/busMix --runInBand
  git diff --check
  ```
  Gate:
  - BusMix focused suite and TypeScript pass before adopting the component in BusGroups.
  Result:
  - Added `src/shared/components/FaderThumb.tsx` as a visual-only shared thumb component.
  - Exported `FADER_THUMB_METRICS` with BusMix dimensions and reused the exact neutral BusMix palette.
  - Migrated `src/features/busMix/components/VerticalFader.tsx` to render `FaderThumb` while keeping `Animated.View`, `PanResponder`, fader math, custom rail behavior, zero mark, and linked pressed feedback in place.
  Verification:
  - `yarn tsc --noEmit`: passed.
  - `yarn jest __tests__/features/busMix --runInBand`: passed.

- [x] T-004: Adopt the shared BusMix-style thumb in `VerticalGroupFader`
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, REQ-008, REQ-009, REQ-010, REQ-012
  What: Replace the simple BusGroups fader rectangle with the shared physical fader thumb for both Bus Master and MCAs, using a colored palette for each strip.
  Where:
  - `src/features/busGroups/components/VerticalGroupFader.tsx`
  Depends on: T-003
  Reuses:
  - `FADER_THUMB_METRICS`
  - `FaderThumb`
  - `getColoredFaderThumbPalette`
  - `colors.master.thumb`
  - `colors.master.label`
  - existing `accentColor`
  - existing `renderMasterMeterFill`
  Implementation detail:
  - Replace local `THUMB_HEIGHT = 34` with `FADER_THUMB_METRICS.height`.
  - Keep `TRACK_EDGE_PADDING = THUMB_HEIGHT / 2` so the taller thumb remains inside the measured fader area.
  - Keep `THUMB_BOTTOM_GUARD = 8` initially.
  - Keep `TRACK_TOUCH_WIDTH = 24` initially.
  - Add `isThumbPressed` state with `useState(false)`.
  - In `onPanResponderGrant`, set `isThumbPressed` true after confirming the gesture is valid and before calling `onInteractionStartRef`.
  - In `onPanResponderRelease` and `onPanResponderTerminate`, set `isThumbPressed` false before/with interaction end cleanup.
  - Compute the palette with:
    - master: `getColoredFaderThumbPalette(colors.master.thumb, colors.master.label)`
    - MCA: `getColoredFaderThumbPalette(accentColor)`
  - Render an `Animated.View` wrapper centered over the rail:
    - `left: '50%'`
    - `marginLeft: -FADER_THUMB_METRICS.width / 2`
    - `width: FADER_THUMB_METRICS.width`
    - `height: FADER_THUMB_METRICS.height`
    - `transform: [{ translateY: animatedY }]`
  - Render `<FaderThumb palette={palette} pressed={isThumbPressed} />` inside the wrapper.
  - Remove old `thumbLine`, `masterThumb`, and `mcaThumb` styles when unused.
  - Do not move or restyle the track, meter fill, dB scale, or container.
  - Do not change `positionToFader`, `faderToPosition`, `clampFader`, or external callbacks.
  Done when:
  - Master and MCA thumbs use the physical BusMix shape.
  - Master remains visually master-colored.
  - MCA 1..8 remain visually matched to their existing MCA colors.
  - Bus Master meter remains visible inside the existing rail.
  - Disabled MCA faders remain dimmed and non-interactive.
  Tests:
  ```sh
  yarn tsc
  yarn jest __tests__/features/busGroups --runInBand
  ```
  Gate:
  - BusGroups focused suite and TypeScript pass.
  Result:
  - Updated `VerticalGroupFader` to use `FADER_THUMB_METRICS.height` for fader travel and hit testing.
  - Replaced the simple BusGroups thumb rectangle with the shared physical thumb.
  - Added pressed-state feedback for BusGroups faders.
  - Applied master and MCA color palettes through `getColoredFaderThumbPalette`.
  - Left the master meter rail/fill and dB scale placement in the same component structure.
  Verification:
  - `yarn tsc --noEmit`: passed.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed.

- [x] T-005: Verify BusGroups fader geometry, hit testing, and compact layout after taller thumb
  Reqs: REQ-008, REQ-009, REQ-010, REQ-011
  What: Audit and adjust only the necessary BusGroups geometry after changing from a 34 px thumb to the 52 px BusMix thumb.
  Where:
  - `src/features/busGroups/components/VerticalGroupFader.tsx`
  - `src/features/busGroups/components/GroupStrip.tsx` only if visual alignment requires a small fader slot adjustment.
  Depends on: T-004
  Reuses:
  - Existing `measuredFaderHeight` from `GroupStrip`.
  - Existing `getInitialFaderHeight` and `getMinimumFaderHeight`.
  - Existing compact layout styles.
  Implementation detail:
  - Confirm `availableHeight = trackHeight - THUMB_HEIGHT - THUMB_BOTTOM_GUARD` still clamps to at least 1.
  - Confirm `isInsideInteractiveArea` still detects:
    - direct thumb press across the full 52 px thumb height.
    - rail press within `TRACK_TOUCH_WIDTH`.
  - Confirm `track` margins still place the rail between the thumb top and bottom travel limits.
  - Confirm dB scale height equals the same `availableHeight` used for fader travel.
  - Keep strip widths unchanged unless the new thumb visibly clips.
  - If any spacing adjustment is required, prefer changing fader slot internal spacing rather than card width.
  Done when:
  - The thumb does not clip at top or bottom in portrait.
  - The thumb does not overlap bottom dB label/assignment text.
  - The thumb does not overlap header/name text.
  - Compact landscape still allows useful drag area.
  - Pressing/dragging on the thumb and on the rail works as before.
  Tests:
  ```sh
  yarn tsc
  yarn jest __tests__/features/busGroups --runInBand
  ```
  Manual checks:
  - Demo Console BusGroups portrait.
  - Demo Console BusGroups compact landscape.
  - Drag Bus Master and one assigned MCA.
  - Try dragging an unassigned/disabled MCA and confirm it does not move.
  Gate:
  - No alignment fix is accepted if it changes BusMix or meter behavior.
  Result:
  - Confirmed the taller `52` px thumb feeds `availableHeight`, `TRACK_EDGE_PADDING`, track margins, hit testing, and animation sync.
  - Kept strip widths and `GroupStrip` layout unchanged because no code-level clipping or type regression was introduced.
  - Manual simulator/device visual UAT remains tracked separately in T-007.
  Verification:
  - `yarn tsc --noEmit`: passed.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed.

- [x] T-006: Run cross-feature non-regression gates
  Reqs: REQ-007, REQ-009, REQ-010, REQ-014
  What: Verify the visual refactor did not regress BusMix or BusGroups behavior.
  Where:
  - Changed files and test suite
  Depends on: T-002 through T-005
  Reuses:
  - Existing recommended gates from `.specs/codebase/TESTING.md`.
  Done when:
  - TypeScript passes.
  - New helper tests pass.
  - BusGroups focused tests pass.
  - BusMix focused tests pass.
  - Diff has no whitespace errors.
  Tests:
  ```sh
  yarn jest __tests__/shared/utils/faderThumbPalette.test.ts --runInBand
  yarn jest __tests__/features/busGroups --runInBand
  yarn jest __tests__/features/busMix --runInBand
  yarn tsc
  git diff --check
  ```
  Gate:
  - No new automated regression is accepted. If a command fails for a pre-existing reason, record the exact failing test/command and why it is unrelated.
  Result:
  - Cross-feature automated gates passed.
  Verification:
  - `yarn jest __tests__/shared/utils/faderThumbPalette.test.ts --runInBand`: passed.
  - `yarn jest __tests__/features/busGroups --runInBand`: passed.
  - `yarn jest __tests__/features/busMix --runInBand`: passed.
  - `yarn tsc --noEmit`: passed.
  - `git diff --check`: passed.

- [ ] T-007: Manual visual UAT for BusGroups and BusMix thumbs
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-007, REQ-011
  What: Manually validate the final visual result because the requested change is primarily visual and the current repo does not have a screenshot test setup for these components.
  Where:
  - Demo Console in simulator/device
  - BusGroups screen
  - BusMix screen
  Depends on: T-006
  Reuses:
  - Existing Demo Console flow.
  Manual checks:
  - BusGroups portrait:
    - Bus Master thumb has BusMix physical shape and master color.
    - MCA 1..8 thumbs have BusMix physical shape and their MCA colors.
    - Master meter remains visible behind/under the fader rail area and does not interfere with the thumb.
    - dB label and assignment text are readable.
    - mute buttons remain aligned.
  - BusGroups compact landscape:
    - no clipping at top or bottom.
    - horizontal scroll disables during fader drag and returns after release.
    - assigned MCA fader drag remains usable.
  - BusMix portrait:
    - channel fader thumbs look unchanged from the pre-refactor BusMix style.
    - linked pressed feedback still dims both linked peers.
  - Disabled MCA:
    - unassigned MCA fader remains dimmed and cannot be dragged.
  Gate:
  - Record any visual mismatch with exact screen/orientation and do not mark feature done until it is either fixed or explicitly deferred.
  Status:
  - Pending. No simulator/device visual UAT was run in this execution context.
  Verification:
  - Automated gates passed, but portrait/compact landscape visual confirmation remains required.

- [x] T-008: Update docs, state, and implementation log after implementation
  Reqs: REQ-014
  What: Record the implementation result, tests, manual UAT status, and any visual follow-up after the feature is built.
  Where:
  - `src/features/busGroups/.specs/STATE.md`
  - `.specs/project/STATE.md`
  - `src/features/busGroups/.specs/feature/fader-thumb-busmix-style/tasks.md`
  - `logs/YYYY-MM-DD_HH-MM-SS-busgroups-fader-thumb-busmix-style-implementation.txt`
  Depends on: T-006, T-007 when UAT is available
  Reuses:
  - Existing `/logs` compact session format.
  Done when:
  - Completed tasks have `Result` and `Verification` notes.
  - Local state mentions the shared BusMix-style fader thumb and current UAT status.
  - Global state mentions the cross-feature shared thumb only if BusMix is touched.
  - Implementation log lists files changed and gates run.
  Tests:
  ```sh
  git diff --check
  ```
  Gate:
  - Documentation must match the actual implementation and validation status.
  Result:
  - Updated local and global state with implementation status and pending manual visual UAT.
  - Added implementation log for the shared BusMix-style fader thumb feature.
  Verification:
  - `git diff --check`: passed.
