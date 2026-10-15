# Local State - busSelection

Last updated: 2026-05-24

## Scope

Feature: `busSelection`

Location:

```txt
src/features/busSelection/
```

Purpose:

- Load BUS metadata for a selected console.
- Let the user choose the monitor destination before entering BusGroups.

## Current Files

```txt
components/BusCard.tsx
hooks/useBusSelection.ts
routes/busSelection.routes.ts
screens/BusSelectionScreen.tsx
services/BusService.ts
types/Bus.ts
```

## Current Behavior

- Receives `consoleIp` and `consoleName` from `ConsoleDiscovery`.
- `useBusSelection` connects through `BusService`.
- BUS list is loaded on mount.
- Service reads BUS names and colors for `1..16`.
- Service fetches stereo link map and collapses linked odd/even pairs.
- Grid columns adapt to viewport width:
  - 1 column below 420;
  - 2 columns from 420;
  - 3 columns from 720.
- Header shows console name and About button.
- Error state supports reload.
- Selecting a BUS navigates to `BusGroups`.

## Integration Points

- `BusService` uses `OscClient`.
- `BusService` uses `X32Protocol`.
- Stereo link helpers live in `src/shared/x32/busStereoLink.ts`.
- About route is opened from this screen.

## Current Decisions

- BUS selection is a separate screen before BusGroups.
- Stereo-linked BUS pairs are represented as one selectable BUS.
- Accent colors are inferred from BUS name keywords in the screen.
- BUS fallback names exist for missing/failed name responses.

## Known Concerns

- Accent-color keyword mapping is UI-local and Portuguese/English partial.
- BUS color from X32 is loaded, but screen also uses name-based accent logic.
- No dedicated tests currently target `BusService` or screen behavior.
- No local feature spec exists yet.

## Future Spec Placement

Feature specs should be created under:

```txt
src/features/busSelection/.specs/feature/[feature-name]/
```

This directory is intentionally empty for now except for scaffolding.

## Suggested Future Specs

- `bus-color-rendering`.
- `stereo-bus-selection-ux`.
- `bus-list-refresh-and-error-state`.

