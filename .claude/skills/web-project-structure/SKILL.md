---
name: web-project-structure
description: Web Template project structure, feature modules organization, path aliases and environment setup. Use when creating new features, understanding project layout, or configuring modules.
---

# Web Template - Project Structure

## Project Structure Overview

The project follows a **feature-based architecture** where each domain has its own folder inside `src/features/`, alongside shared components, services, and utilities:

```
src/
├── ability/           # CASL ability types
├── assets/            # Static assets (images, binary files)
├── components/        # Reusable UI component library (wrapping Ant Design)
├── config/            # Global configurations (e.g., date-fns locale)
├── context/           # Context factory and app-level contexts
├── features/          # Feature modules (domain-specific pages, routes, http)
├── hoc/               # Higher-Order Components (e.g., withPropsInjection)
├── hooks/             # Custom hooks (useAsync, useDidMount, usePagination, etc.)
├── http/              # HTTP layer (adapters, services, interceptors)
├── layouts/           # App layout components (AppLayout, AppHeaderBar, AppSideBar)
├── providers/         # App-level providers (AntdProvider, AppProviders)
├── routes/            # Route definitions (public, private, utils)
├── services/          # Business logic services (UserAuthenticationService, etc.)
├── shared/            # Shared page-level components (ListPage, ContentPage, etc.)
├── storage/           # Browser storage abstraction layer
├── theme/             # Theming system (tokens, CSS variables, defaultTheme)
├── utils/             # Utility functions (validators, masks, parsers, helpers)
```

## Path Aliases

- **CRITICAL**: Always use the `~/` alias for imports from `src/`. Never use relative paths to go above the current feature directory.

## Feature Modules (`src/features/`)

Your feature folder should contain:
- `pages/`: React components for each page of the feature.
- `routes/`: Route definitions for the feature.
- `http/`: HTTP service for API calls related to the feature.
- `types.ts`: TypeScript types specific to the feature.
- `utils/`: Utility functions specific to the feature.
- `components/`: Sub-components used only within the feature.

## Environment Variables

- Access environment variables via the `Environment` object from `~/Environment`:
  ```ts
  import Environment from '~/Environment';

  const apiUrl = Environment.apiBaseUrl;
  const cdnUrl = Environment.cdnImageBaseUrl;
  ```
- All Vite env variables are prefixed with `VITE_` and accessed via `import.meta.env`.
