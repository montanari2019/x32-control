---
name: contexts-and-holders
description: "Documents context holder patterns for sharing state inside and outside the React tree. Use when creating providers, hooks, static holders, or service-accessible state in React Native applications."
---

# Contexts and Holders

## Summary

Context state is created with a factory that returns a Provider, a Holder for static access, and a hook. This pattern allows access outside React tree (e.g., interceptors, services).

## Core Pattern

- `createContextFactory` stores a static state and exposes getters/setters.
- Provider syncs static state and cleans up on unmount.
- Holder enables usage in modules without hooks.

## Reference Implementation

- Factory: [src/context/index.tsx](src/context/index.tsx)
- Auth context: [src/context/UserAuthentication/index.ts](src/context/UserAuthentication/index.ts)
- Biometric preference: [src/context/BiometricPreference/index.ts](src/context/BiometricPreference/index.ts)
- Feature filters: [src/features/home/context/FiltersContext/index.ts](src/features/home/context/FiltersContext/index.ts)

## Implementation Steps

1. Create a default state and pass it to `createContextFactory`.
2. Export Provider, Holder, and `useContext` hook.
3. Wrap the app in the Provider (see Providers).
4. Use Holder when inside non-react code (services, interceptors).

## Conventions to Follow

- Context state is a single object or nullable type.
- Holders provide `getState`, `setState`, and `updateState`.
- Providers reset static state on unmount to avoid leaks.

## Pitfalls

- Holder state persists across tests; reset with Provider unmount.
- Avoid storing non-serializable values if you persist them.

## Checklist

- Default state defined
- Provider wrapped in app tree
- Holder used only when hooks are not possible

## Prompt Seed

Implement a context factory that returns Provider, Holder, and hook. The Holder must expose `getState`, `setState`, and `updateState` for use outside React tree, while Provider keeps static state in sync.
