# Conventions

Last updated: 2026-05-24

## Language

- TypeScript is the app language.
- Strict TypeScript is enabled.
- React components use `.tsx`.
- Services, hooks, types, and utilities use `.ts` unless JSX is needed.

## Imports

Use configured aliases:

```txt
@app/*
@assets
@shared/*
@features/*
```

Prefer aliases for cross-folder imports. Relative imports are acceptable within a feature subfolder.

## Feature Organization

Feature folders live under `src/features`.

Observed feature subfolders:

- `components`;
- `hooks`;
- `routes`;
- `screens`;
- `services`;
- `types`;
- `utils`.

Keep feature-specific code inside the feature. Promote to `src/shared` only when reused across features.

## Hook Conventions

- Feature orchestration lives in `use[FeatureName]` hooks.
- Hooks own loading/error state and expose UI-friendly actions.
- Hooks should memoize service instances with `useMemo`.
- Hooks should clean up timers, subscriptions, and service connections on unmount.
- Use refs when callbacks must see current channel/MCA state without recreating subscriptions too often.

Examples:

- `src/features/consoleDiscovery/hooks/useConsoleDiscovery.ts`.
- `src/features/busSelection/hooks/useBusSelection.ts`.
- `src/features/busGroups/hooks/useBusGroups.ts`.
- `src/features/busMix/hooks/useBusMix.ts`.

## Service Conventions

- Feature services wrap domain-specific behavior and speak to shared primitives.
- Shared network/OSC details should not leak into screens.
- `X32Protocol` centralizes OSC paths and range validation.
- Demo/mock behavior is selected by console IP via `isMockConsoleIp`.

Examples:

- `BusService` loads BUS metadata.
- `X32BusGroupsService` loads and writes BUS/DCA state.
- `BusMixService` loads and writes channel/AUX/FX send state.
- `NetworkScanner` owns discovery.

## State Conventions

- Screen-local state lives in React state.
- Cross-screen mixer channel state lives in `BusMixChannelStore`.
- Ref-backed state is used for drag/OSC timing-critical interactions.
- Local persistence uses scoped storage services.

## Error Conventions

- Use `AppError` for typed application errors.
- Convert unknown errors with `getErrorMessage`.
- Use `Toast` for transient errors.
- Use `ErrorState` for persistent/retryable screen errors.
- Background sync errors may be best-effort and silent when active user path has separate error reporting.

## UI Conventions

- Dark theme is the current app theme.
- Use `src/shared/theme` tokens for colors, spacing, typography, radius, and shadows.
- Use shared components:
  - `Screen`;
  - `AppHeader`;
  - `Button`;
  - `LoadingState`;
  - `ErrorState`;
  - `Dialog`;
  - `Toast`;
  - `AlertDialog`;
  - `FaderDbScale`.
- Use `ModalProvider` + `useModal` for overlays.
- Avoid native stack headers; feature screens render their own headers.

## Gesture And Fader Conventions

- Fader movement should update UI immediately.
- Writes should be throttled during drag.
- Release should flush final value immediately.
- Remote echo should not overwrite recent local interaction.
- Horizontal lists should disable scroll while fader drag is active.

## OSC Conventions

- Use `X32Protocol` for path construction.
- Use float-typed args for fader/pan writes where required.
- Keep `/xremote` alive while actively controlling a real console.
- Prefer shared OSC lease when multiple features/screens need the same endpoint.
- Treat UDP responses and send callbacks as timing-sensitive, especially on iOS.

## Testing Conventions

- Tests live under `__tests__`.
- Current Jest pattern only matches `*.test.ts`, not `*.test.tsx`.
- Prefer unit tests for protocol, pure calculations, stores, and services.
- Use hook tests for orchestration where existing setup supports it.
- Network scanner tests may need higher timeout due to broadcast + unicast path.

## Documentation Conventions

- Keep README user/developer-facing.
- Keep `.specs` as persistent planning/codebase memory.
- Keep `/logs` as compact implementation/session memory.
- Update `.specs/codebase/CONCERNS.md` when discovering cross-feature risk.

## Worktree Conventions

- The worktree may already contain user changes.
- Do not revert unrelated changes.
- When changing files touched by user, inspect and preserve current intent.

