---
name: feature-structure
description: "Documents feature-folder architecture, standard subfolders, route/service/type placement, and boundaries between feature-local and shared code. Use when adding a feature or reorganizing feature modules."
---

# Feature Folder Structure

## Summary

Features are organized into folders with predictable substructure: `components`, `http`, `navigation`, `screens`, and optional `context` or `types`.

## Reference Implementation

- Feature example: [src/features/home/navigation/index.tsx](src/features/home/navigation/index.tsx)
- Feature HTTP example: [src/features/home/http/HomeHttpService/index.ts](src/features/home/http/HomeHttpService/index.ts)
- Feature context example: [src/features/home/context/FiltersContext/index.ts](src/features/home/context/FiltersContext/index.ts)
- Feature example (alerts): [src/features/alerts/http/AlertsHttpService/index.ts](src/features/alerts/http/AlertsHttpService/index.ts)
- Feature example (signature): [src/features/signature/navigation/index.tsx](src/features/signature/navigation/index.tsx)

## Standard Layout

- `components/` feature-local UI widgets
- `http/` service classes and endpoint types
- `navigation/` stack navigator and param types
- `screens/` screen components
- `context/` (optional) feature-local state
- `types/` (optional) shared feature types

## Implementation Steps

1. Create the feature folder with standard subfolders.
2. Add a stack navigator and param types.
3. Add HTTP services with typed responses.
4. Keep reusable UI either in `components/` or `shared/`.

## Pitfalls

- Putting HTTP logic inside screens makes tests harder.
- Skipping `types.ts` leads to repeated inline types.

## Checklist

- Navigation and types created
- HTTP service created
- Screens kept thin and focused

## Prompt Seed

Create a new feature folder with components, http, navigation, and screens. Use a typed navigation params file and a dedicated HTTP service class per feature.
