# Local State - consoleDiscovery

Last updated: 2026-06-19

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
- `useConsoleDiscovery.scan()` still owns spinner teardown through `finally`;
  the transport/scanner layer must settle rather than keeping the promise open.
- Found devices are appended before Demo unless Demo is already present.
- If no real consoles respond, UI keeps Demo and shows an error toast.
- Android discovery bind is now bounded: broadcast confirmation no longer keeps
  `scan()` unresolved forever.
- Android and iOS can both provide native interface/broadcast data to the
  shared scanner, enabling directed-broadcast and subnet-unicast fallback on
  both platforms when data is available.
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
- Android broadcast enablement is treated as a transport concern, not a UI
  concern: bind is time-bounded and falls back to async `socket.setBroadcast`
  instead of blocking the screen indefinitely.
- Native interface/broadcast enumeration now lives in `TacimixNetworkInfo` on
  both iOS and Android and remains discovery-scoped only.
- Network error copy specifically mentions iPhone same Wi-Fi and Local Network permission.

## Known Concerns

- `validateManualIp(ip)` exists in `ConsoleDiscoveryService` but current screen does not provide manual IP entry.
- Real-device Android and iOS discovery UAT is still pending for the new
  Android bind timeout + async broadcast fallback + native interface parity.
- Error copy is still iPhone/Local Network focused even when the failure
  occurs on Android.
- Discovery hardening spec lives under global
  `.specs/features/android-console-discovery-hardening/`; there is still no
  feature-local discovery spec under `src/features/consoleDiscovery/.specs/feature/`.

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

