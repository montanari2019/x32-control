---
title: Testing and Jest Setup
type: skill
version: 1.0
scope: testing
tags: [jest, testing-library]
---

## Summary

Testing uses `jest-expo` with `@testing-library/react-native`. Global setup configures timezone, mocks native modules, and standardizes test environment behavior.

## Reference Implementation

- Jest config: [jest.config.js](jest.config.js)
- Jest setup: [jest.setup.js](jest.setup.js)
- Jest global setup: [jest.global-setup.js](jest.global-setup.js)
- Example hook test: [src/hooks/useAsync/useAsync.spec.ts](src/hooks/useAsync/useAsync.spec.ts)
- Example component test: [src/components/InputText/InputText.spec.tsx](src/components/InputText/InputText.spec.tsx)

## Core Pattern

- Snapshot tests are common for UI components.
- Use `@testing-library/react-native` for interactions.
- Mocks are centralized in `jest.setup.js`.

## Implementation Steps

1. Add a new spec file next to the component or hook.
2. Use `render` or `renderHook` from testing-library.
3. Add `testID` to interactive elements for selection.
4. Use fake timers when testing timers and animations.

## Pitfalls

- Avoid using real network services in tests; inject mocks.
- Remember to clean fake timers in `afterEach`.

## Checklist

- Test file uses `*.spec.ts(x)` naming
- Uses testing-library render helpers
- Mocks configured in setup file

## Prompt Seed

Create unit tests with jest-expo and testing-library. Use snapshot tests for UI components and renderHook for hooks. Mock native modules in a shared setup file.
