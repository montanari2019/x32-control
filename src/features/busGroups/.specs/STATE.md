# Local State - busGroups

Last updated: 2026-05-31

## Scope

Feature: `busGroups`

Location:

```txt
src/features/busGroups/
```

Purpose:

- Provide macro monitor control for a selected BUS.
- Control BUS master.
- Expose 8 local MCA-style groups for assigned source control.
- Bridge to detailed BusMix.

## Current Files

```txt
components/BusGroupsFooter.tsx
components/BusGroupsHeader.tsx
components/GroupMuteButton.tsx
components/GroupStrip.tsx
components/MasterStrip.tsx
components/McaChannelSelectionModal.tsx
components/McaStrip.tsx
components/VerticalGroupFader.tsx
hooks/useBusGroups.ts
hooks/useOscSubscription.ts
screens/BusGroupsScreen.tsx
services/BusGroupsSecureStoreService.ts
services/McaChannelFaderService.ts
services/X32BusGroupsService.ts
types/busGroups.types.ts
utils/audio.ts
```

## Current Behavior

- Receives selected `consoleIp`, `busNumber`, `busName`, and optional `linkedBusNumber`.
- Loads BUS master fader and mute/on.
- Loads DCA `1..8` fader/on as MCA baseline.
- Loads available BusMix channels for MCA assignment modal.
- Restores local MCA names/assignments from storage.
- Empty local state keeps MCAs unassigned.
- MCA selection modal supports channel toggling, clear, and rename.
- MCA fader value is computed from assigned channel average.
- Moving an MCA applies proportional level changes to assigned sources.
- MCA mute applies mute/on changes to assigned sources.
- State persists with debounce.
- Screen disables horizontal scroll while fader interaction is active.
- Landscape uses compact layout and adjusted fader sensitivity.
- Bus Master controls fader/mute and now exposes a live selected BUS master meter in the existing central rail.

## Integration Points

- `X32BusGroupsService` talks to BUS master and DCA OSC paths.
- `McaChannelFaderService` applies proportional channel changes using `BusMixService`.
- `BusGroupsSecureStoreService` persists local MCA state.
- `BusMixChannelStore` provides cross-screen channel snapshot.
- `BusMixService` loads channels for assignment and remote sync.
- `McaChannelSelectionModal` shows CH/AUX/FX sources from BusMix.
- Navigation pushes `BusMix`.

## Current Decisions

- UI term is MCA even though real X32 integration uses DCA concepts.
- MCA assignments are local, not necessarily written to console DCA assignment state.
- 8 MCAs are available.
- MCAs start empty when no stored state exists.
- Demo provider is synchronized with local MCA edits.
- Fader drag uses local protection window to avoid remote recalculation overwriting recent local changes.
- Bus Master meter source is `/meters/2`, using index `busId - 1` for BUS `1..16`, requested through `/meters` with the meter id string and renewed before timeout.
- Bus Master meter visual is drawn inside the existing master fader track, preserving its current 5 px width, background color, height calculation, thumb alignment, and gesture behavior.

## Known Concerns

- Real-console validation remains important for MCA proportional behavior.
- MCA assignment storage is local device state; users may expect console/global persistence.
- DCA naming/color from console is mostly normalized to MCA naming/color tokens.
- Real-console validation remains required for the planned Bus Master meter mapping before it can be considered hardware-validated.
- UI behavior in very small landscape devices should continue to be manually checked.

## Existing Tests

```txt
__tests__/features/busGroups/hooks/useBusGroups.test.ts
__tests__/features/busGroups/services/McaChannelFaderService.test.ts
```

## Future Spec Placement

Feature specs should be created under:

```txt
src/features/busGroups/.specs/feature/[feature-name]/
```

Feature specs live under this directory.

## Active Feature Specs

- `feature/bus-master-meter-rail/`
  - Status: implemented; hardware UAT pending.
  - Scope: render a live selected BUS master meter inside the existing Bus Master central rail without changing fader/mute behavior or MCA strips.
  - Protocol decision: use `/meters/2` for the Mix Bus meters page; decode first 16 floats with `busId - 1`.
  - Validation requirement: real X32/M32 UAT on BUS 1, 8, 9, and 16.
  - Automated gates passed: `yarn tsc`, BusGroups tests, BusMix tests, shared X32Protocol test, `git diff --check`.

## Suggested Future Specs

- `mca-assignment-persistence`.
- `mca-proportional-fader-validation`.
- `landscape-fader-usability`.
