# Local State - busGroups

Last updated: 2026-05-24

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

## Known Concerns

- Real-console validation remains important for MCA proportional behavior.
- MCA assignment storage is local device state; users may expect console/global persistence.
- DCA naming/color from console is mostly normalized to MCA naming/color tokens.
- No formal feature spec exists yet.
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

This directory is intentionally empty for now except for scaffolding.

## Suggested Future Specs

- `mca-assignment-persistence`.
- `mca-proportional-fader-validation`.
- `bus-master-real-console-uat`.
- `landscape-fader-usability`.

