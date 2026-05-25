---
name: navigation-routing
description: "Documents React Navigation routing patterns, typed route params, root stacks, feature navigation, and imperative navigation holders. Use when adding screens, changing navigation flow, wiring route params, or standardizing navigation in a React Native app."
---

# Navigation and Routing

## Summary

Navigation is composed of a root stack that switches between auth and non-auth flows, plus a bottom tab navigator for the authenticated area. Route typing is centralized in a RootParamList.

## Core Pattern

- Root stack decides which stacks to render based on auth context.
- Bottom tab navigator renders main feature stacks.
- Each feature exposes its own stack navigator and `types.ts` for params.
- `NavigationHolder` provides imperative navigation outside hooks.

## Reference Implementation

- Root navigation: [src/navigation/index.tsx](src/navigation/index.tsx)
- Root types: [src/navigation/types.ts](src/navigation/types.ts)
- Tab navigation: [src/navigation/HomeTabNavigation.tsx](src/navigation/HomeTabNavigation.tsx)
- Custom tab bar: [src/navigation/BottomTabBar/index.tsx](src/navigation/BottomTabBar/index.tsx), [src/navigation/BottomTabBar/TabItem.tsx](src/navigation/BottomTabBar/TabItem.tsx)
- Navigation holder: [src/navigation/NavigationHolder.ts](src/navigation/NavigationHolder.ts)
- Feature navigation example: [src/features/home/navigation/index.tsx](src/features/home/navigation/index.tsx), [src/features/home/navigation/types.ts](src/features/home/navigation/types.ts)

## Implementation Steps

1. Define a RootParamList that includes every stack and tab.
2. Build a root stack navigator that branches on auth state.
3. Build a tab navigator for authenticated flows.
4. Implement per-feature stack navigators with their own param types.
5. Expose a NavigationHolder for imperative calls.

## Conventions to Follow

- Each feature has a `navigation` folder with `index.tsx` and `types.ts`.
- Root types import all feature params and merge into RootParamList.
- Screen components are rendered via stacks, not directly from tab bar.
- Use `NavigationHolder` when outside navigation context (modals, tests).

## Pitfalls

- Forgetting to add a feature type to RootParamList breaks type safety.
- Hiding the tab bar should be centralized (see `hiddenScreens`).

## Checklist

- RootParamList updated
- Feature stack created
- Tab navigator updated if needed
- NavigationHolder used for non-hook navigation

## Prompt Seed

Create a typed navigation system with a root stack that branches on auth state, a bottom tab navigator for main flows, and per-feature stack navigators with their own param types. Include a NavigationHolder for imperative navigation.
