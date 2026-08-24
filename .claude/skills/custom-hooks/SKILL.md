---
name: custom-hooks
description: "Documents conventions for custom React hooks, lifecycle helpers, async hooks, style memoization, pagination, dimensions, and integration hooks. Use when creating or refactoring hooks and keeping hook APIs focused and reusable."
---

# Custom Hooks Catalog

## Summary

Hooks are small, focused utilities with a clear naming convention. Most hooks are pure helpers for style memoization, lifecycle, pagination, or integrations.

## Reference Implementation

- Styles: [src/hooks/useStyles/index.ts](src/hooks/useStyles/index.ts)
- Async: [src/hooks/useAsync/index.ts](src/hooks/useAsync/index.ts)
- Mount guard: [src/hooks/useIsMountedRef/index.ts](src/hooks/useIsMountedRef/index.ts)
- Pagination: [src/hooks/usePagination/index.ts](src/hooks/usePagination/index.ts)
- Lifecycle: [src/hooks/useDidMount/index.ts](src/hooks/useDidMount/index.ts), [src/hooks/useDidMountAndUpdate/index.ts](src/hooks/useDidMountAndUpdate/index.ts)
- Dimensions: [src/hooks/useDimensions/index.ts](src/hooks/useDimensions/index.ts)
- Prevent navigation: [src/hooks/usePreventNavigation/index.ts](src/hooks/usePreventNavigation/index.ts)
- Notifications: [src/hooks/useNotificationManager/index.ts](src/hooks/useNotificationManager/index.ts)
- RevenueCat: [src/hooks/useRevenueCat/index.ts](src/hooks/useRevenueCat/index.ts)

## Hook Patterns

- `useStyles` wraps `StyleSheet.flatten` with `useMemo` for memoized styles.
- `useAsync` manages loading and avoids state updates after unmount.
- `usePagination` centralizes infinite list logic.
- Integration hooks encapsulate native SDK setup (notifications, purchases).

## Implementation Steps

1. Keep hooks in `src/hooks/<hook-name>/index.ts`.
2. Ensure hooks are deterministic and testable.
3. For async work, combine `useAsync` + `useIsMountedRef` to avoid stale state.
4. For styles, use `useViewStyles`, `useTextStyles`, `useImageStyles`.

## Pitfalls

- Forgetting dependency arrays in `useStyles` invalidates memoization.
- `useAsync` should use the same dependency array as the wrapped callback.

## Checklist

- Hook name starts with `use`
- File is under `src/hooks` with its own folder
- Dependencies are explicit

## Prompt Seed

Create a set of small React hooks for styles, async handling, pagination, and lifecycle helpers. Follow the file naming and dependency patterns in this skill.
