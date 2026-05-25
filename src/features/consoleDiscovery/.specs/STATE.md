# Local State - consoleDiscovery

Last updated: 2026-05-24

## Scope

Feature: `consoleDiscovery`

Location:

```txt
src/features/consoleDiscovery/
```

Purpose:

- Start the app flow.
- Show Demo console.
- Discover real X32/M32 consoles on the local network.
- Navigate to BUS selection with selected console identity.

## Current Files

```txt
components/ConsoleCard.tsx
hooks/useConsoleDiscovery.ts
routes/consoleDiscovery.routes.ts
screens/ConsoleDiscoveryScreen.tsx
services/ConsoleDiscoveryService.ts
types/ConsoleDevice.ts
```

## Current Behavior

- Initial devices list contains Demo console.
- Pressing "Buscar mesas na rede" calls `scan`.
- `scan` calls `ConsoleDiscoveryService.scan`.
- Service delegates to `NetworkScanner.scanForConsoles`.
- Found devices are appended before Demo unless Demo is already present.
- If no real consoles respond, UI keeps Demo and shows an error toast.
- Screen uses a hero card, search button, loading state, and `ConsoleCard` list.
- Errors are shown through global `Toast` via `useModal`.

## Integration Points

- Shared network scanner:
  - `src/shared/network/NetworkScanner.ts`.
- Shared mixer Demo constants:
  - `src/shared/mixer/mock/mockMixerProvider.ts`.
- Route target:
  - `BusSelection`.

## Current Decisions

- Demo console is always available.
- Discovery UI is automatic-search-first.
- Manual IP validation exists in service but is not exposed in UI.
- Network error copy specifically mentions iPhone same Wi-Fi and Local Network permission.

## Known Concerns

- `validateManualIp(ip)` exists in `ConsoleDiscoveryService` but current screen does not provide manual IP entry.
- iOS physical-device discovery is network/environment-sensitive.
- Broadcast/multicast reliability may require Apple entitlement or manual fallback strategy.
- No local feature spec exists yet.

## Future Spec Placement

Feature specs should be created under:

```txt
src/features/consoleDiscovery/.specs/feature/[feature-name]/
```

This directory is intentionally empty for now except for scaffolding.

## Suggested Future Specs

- `manual-ip-fallback`.
- `saved-consoles`.
- `network-troubleshooting-empty-state`.
- `local-network-permission-ux`.

