---
name: mobile-project-structure
description: Mobile Template project structure, feature module organization, path aliases, environment setup, and provider tree. Use when creating new features, understanding project layout, or scaffolding mobile features.
---

# Mobile Template - Project Structure

## Project Structure Overview

The project follows a **feature-based architecture** where each domain has its own folder inside `src/features/`, alongside shared components, services, and utilities:

```
src/
├── @types/            # Global type declarations (assets.d.ts, png.d.ts)
├── App.tsx            # Root component (StatusBar + Navigation)
├── Providers.tsx      # Provider tree (SafeArea → UserAuth → Theme → NavigationContainer → Modal)
├── assets/            # Icons (SVG components), Images (SVG components), barrel exports
├── components/        # Reusable UI component library (wrapping React Native primitives)
├── config/            # Global configurations (Luxon locale, Intl polyfills, Expo OS)
├── context/           # Context factory + UserAuthentication context
├── environment/       # EnvironmentController (develop/homolog/production)
├── features/          # Feature modules (domain-specific screens, navigation, http)
├── hoc/               # Higher-Order Components (e.g., withPropsInjection)
├── hooks/             # Custom hooks (useAsync, useDidMount, usePagination, etc.)
├── http/              # HTTP layer (adapters, HttpService, interceptors)
├── navigation/        # Root navigation (Stack), NavigationHolder, types
├── services/          # Business logic services (logoutService, etc.)
├── theme/             # Theme system (colors, spacings, typography, borders, shadows, opacities)
├── utils/             # Utility functions (validators, masks, datetime, analytics, etc.)
```

## Path Aliases

- **CRITICAL**: Always use the `~/` alias for imports from `src/`. Never use relative paths to go above the current feature directory.

```ts
// CORRECT
import Button from '~/components/Button';
import { useTheme } from '~/theme';

// WRONG — never go up past the feature boundary
import Button from '../../../components/Button';
```

## Feature Modules (`src/features/`)

Each feature folder should contain:
- `screens/`: React components for each screen (folder-per-screen with `index.tsx`).
- `navigation/`: Stack navigator definitions (`index.tsx` + `types.ts`).
- `http/`: HTTP service for API calls related to the feature (optional).
- `types.ts`: TypeScript types specific to the feature (optional).
- `utils/`: Utility functions specific to the feature (optional).
- `components/`: Sub-components used only within the feature (optional).

Example structure:
```
feature-name/
├── components/     # Feature-specific components
├── navigation/     # Feature navigation stack
│   ├── index.tsx   # Stack.Navigator with Stack.Screens
│   └── types.ts    # Navigation params type (exported as default)
├── screens/        # Screen components
│   └── ScreenName/
│       ├── index.tsx               # Screen component
│       ├── ScreenName.spec.tsx     # Tests (co-located)
│       └── test-utils.ts           # Mock data for tests
└── http/           # Feature-specific HTTP service (optional)
    ├── index.ts
    ├── types.ts
    └── test-utils.ts
```

- **Features MUST NOT import from sibling features** — only from parent feature or `src/`.

## Environment Variables

- Access environment variables via the `EnvironmentController` from `~/environment`:
  ```ts
  import ENV from '~/environment';

  const apiUrl = ENV.getValue('apiBaseUrl');
  ```
- Environment is determined from bundle ID suffix: `.develop` → develop, `.homolog` → homolog, default → production.
- The `EnvironmentController` class accepts a config object with `develop`, `homolog`, and `production` keys, each containing the same set of environment values.

## Provider Tree (`Providers.tsx`)

Order (outer → inner):
1. `SafeAreaProvider` — safe area insets
2. `UserAuthenticationProvider` — user auth context
3. `ThemeProvider` (DefaultTheme) — theme context
4. `NavigationContainer` — React Navigation (with analytics handlers)
5. `ModalProvider` — modal/dialog/toast context

```tsx
const Providers = ({ children, navigationContainerRef, userAuthenticationInitialValue }: ProvidersPropsType) => (
  <SafeAreaProvider>
    <UserAuthenticationProvider value={userAuthenticationInitialValue}>
      <ThemeProvider theme={DefaultTheme}>
        <NavigationContainer
          ref={navigationContainerRef}
          onReady={Analytics.handleNavigationReady}
          onStateChange={Analytics.handleNavigationChange}
        >
          <ModalProvider>
            {children}
          </ModalProvider>
        </NavigationContainer>
      </ThemeProvider>
    </UserAuthenticationProvider>
  </SafeAreaProvider>
);
```

## Assets (`src/assets/`)

- **Icons**: SVG icon components in `src/assets/icons/`. Imported via `Icons` namespace:
  ```ts
  import { Icons } from '~/assets';
  // Usage: <Icons.Person color={theme.colors.primaryBase} />
  ```
- **Images**: SVG image components in `src/assets/images/`. Imported via `Images` namespace:
  ```ts
  import { Images } from '~/assets';
  ```
- Both use barrel exports through `src/assets/index.ts`.

## Key Dependencies

| Category | Packages |
|----------|----------|
| **Framework** | React 19.x, React Native 0.81.x, Expo 54 |
| **Navigation** | `@react-navigation/native` 6.x, `@react-navigation/stack` 6.x |
| **Forms** | `react-final-form` 6.x, `final-form` 4.x |
| **HTTP** | `axios` |
| **Date/Time** | `luxon`, `@formatjs/intl-datetimeformat` |
| **Masking** | `imask` |
| **Theme** | `@callstack/react-theme-provider` |
| **Push Notifications** | `@notifee/react-native`, `@react-native-firebase/messaging` |
| **Analytics** | `@react-native-firebase/analytics`, `@react-native-firebase/crashlytics` |
| **SVG** | `react-native-svg` |
| **Testing** | `@testing-library/react-native`, Jest, `jest-expo` |
