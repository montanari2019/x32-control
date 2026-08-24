---
name: scrute-store
description: "Documents Scrute Store state-management conventions for global stores, selectors, actions, side effects, and persistence. Use when introducing or maintaining a central store pattern."
---

# Scrute Store

## Summary

Scrute Store centralizes global state, selectors, and side effects in a single store. Keep feature state segmented by domain and expose typed hooks for access.

## Core Pattern

- A single store with domain slices.
- Typed selectors and actions as the public API.
- Optional persistence for stable, serializable state.

## Reference Implementation

No in-repo implementation yet. When added, prefer `src/store` and wire it in the app providers.

## Implementation Steps

1. Install the Scrute Store package and only required addons.
2. Create a `src/store` folder and a single store entry point.
3. Split state into slices by domain (auth, user, features).
4. Export typed selectors and actions for each slice.
5. Wrap the app with the Store provider in `Providers`.

## Conventions to Follow

- Keep state serializable when using persistence.
- Use selectors in components to avoid unnecessary re-renders.
- Keep complex logic in actions/effects, not in components.

## Pitfalls

- Mixing local and global state without a clear rule increases coupling.
- Persisting sensitive data without encryption is unsafe.
- Mutating state outside store actions breaks traceability.

## Checklist

- Store entry created
- Slices and selectors defined
- Provider wired in app root
- Persistence configured (if needed)

## Prompt Seed

Implement Scrute Store with a single store entry, domain slices, typed selectors, and a provider wired into the app root. Keep state serializable and move side effects into actions.
