# App Internationalization Design

Date: 2026-06-05
Status: planned

## Overview

Introduce a shared i18n layer for React Native UI and configure native iOS and
Android localization metadata. The active language is selected from platform
locale/app-language settings, not from app state chosen inside Tacimix.

Recommended implementation stack:

- `react-native-localize` for device/app locale detection and locale change
  events.
- `i18next` plus `react-i18next` for translation resources, React hooks,
  interpolation, and pluralization.

This matches the current app architecture because shared services/components
already sit behind `src/shared/*`, and feature screens already use hooks and
props for UI text.

## Existing Patterns Reused

- Shared code under `src/shared`.
- Feature-owned UI stays in `src/features/[feature]`.
- Route contracts stay in `RootNavigator`.
- Error conversion continues through `AppError` and `getErrorMessage`.
- Modal, dialog, toast, loading, and error states remain the shared UI surface.
- Tests stay under `__tests__/**/*.test.ts`.

## Proposed Modules

```txt
src/shared/i18n/
  index.ts
  i18n.ts
  locales.ts
  reservedTerms.ts
  resources/
    en.ts
    pt-BR.ts
    es.ts
  __tests__ candidates under existing __tests__/shared/i18n/
```

Potential namespaces inside resources:

- `common`
- `errors`
- `consoleDiscovery`
- `busSelection`
- `busGroups`
- `busMix`
- `about`
- `accessibility`

The exact file shape can be adjusted during implementation, but keys should be
stable, semantic, and grouped enough to keep reviews manageable.

## Locale Resolution

Resolution order:

1. Platform app language if exposed by OS/app settings.
2. Device preferred locales in priority order.
3. English fallback.

Mapping:

- `en`, `en-*` -> `en`
- `pt`, `pt-BR`, `pt-*` -> `pt-BR`
- `es`, `es-*` -> `es`
- anything else -> `en`

The implementation should keep the resolver pure and unit-tested.

## Native Configuration

iOS:

- Declare known/supported regions for `en`, `pt-BR`, and `es`.
- Localize `CFBundleDisplayName` only if product decides app name should vary;
  default is keep `Tacimix`.
- Localize user-facing purpose strings, especially Local Network permission
  copy.
- Preserve existing networking entitlements and Local Network preflight.

Android:

- Add locale configuration for supported app languages where required for
  Android app language settings.
- Add localized string resources for app name and visible permission/system
  strings as needed.
- Preserve existing application id, flavors, signing, permissions, and network
  behavior.

## Text Migration Rules

1. Translate app-owned UI copy.
2. Keep reserved terms unchanged.
3. Keep user and console data unchanged.
4. Keep protocol paths, storage keys, route names, test ids, color tokens, and
   internal enum values unchanged.
5. Replace dynamic singular/plural text with plural-aware translation keys.
6. Replace accessibility labels alongside visible copy.
7. Avoid translating debug-only console log prefixes unless they are surfaced
   to users.

## Reserved Terms Handling

Create a documented glossary before migrating feature copy. The glossary is
used in code review and tests. It should include at least:

- `Tacimix`
- `Presets`
- `Personal Mix`
- `BUS`, `CH`, `AUX`, `FX`, `DCA`, `MCA`
- `ON`, `MUTE`, `VU`, `dB`, `dBFS`
- `X32`, `M32`, `OSC`, `UDP`, `IP`, `Wi-Fi`
- protocol paths such as `/meters` and `/xremote`

Implementation should not blindly replace every string. Some strings are:

- internal constants;
- style values;
- protocol values;
- route names;
- native identifiers;
- storage keys;
- user or console data.

These must remain outside translation resources unless they are also visible
copy.

## Data Flow

```txt
OS/device app language
  -> react-native-localize
    -> locale resolver
      -> i18next active language
        -> useTranslation()/t()
          -> feature screens and shared components
```

Locale changes from OS settings should update the i18n language on next app
activation or emitted locale-change event, depending on platform support. It is
acceptable if some platform-level RTL settings require app restart; RTL is out
of initial locale scope.

## State And Persistence

- No app-level language preference is persisted by Tacimix in this feature.
- Existing presets and MCA storage keys must not be changed.
- Stored preset names and MCA names are treated as user data and not
  translated.
- Translation resources are static app assets.

## Error Handling

- `AppError` should eventually carry stable error codes and localized messages
  should be selected at the UI boundary when practical.
- During migration, app-owned error message literals can move to translation
  keys in the source module if the error is directly user-facing.
- Unknown native/runtime errors may still display raw details when they are the
  only available diagnostic, but surrounding UI copy must be localized.

## Testing Strategy

Unit tests:

- Locale resolver mapping.
- Translation resource completeness across `en`, `pt-BR`, `es`.
- Pluralization for channel count and preset count examples.
- Reserved-term preservation for protected keys.
- No missing-key fallback in supported locales.

Static/search checks:

- Scan for Portuguese user-facing literals in `src/**/*.{ts,tsx}` after
  migration.
- Allowlist technical comments, test fixtures, internal enum values, and docs.

Existing non-regression gates:

- `yarn tsc`
- `yarn jest __tests__/features/busMix --runInBand`
- `yarn jest __tests__/features/busGroups --runInBand`
- `yarn jest __tests__/shared/osc --runInBand`
- `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`

Native validation:

- `plutil -lint ios/Tacimix/Info.plist`
- iOS build sanity after native localization files change.
- Android Gradle resource sanity after locale resources change.

Manual UAT:

- iOS: app/device language English, Brazilian Portuguese, Spanish.
- Android: app language English, Brazilian Portuguese, Spanish where Android
  app-language settings are available; device language fallback otherwise.
- Portrait and landscape checks for Discovery, BusSelection, BusGroups, BusMix,
  Presets modal, Pan modal, About, toasts, dialogs, loading, and errors.

## Risks And Trade-Offs

- Some current strings have missing accents (`niveis`, `invalido`) and should
  be corrected in localized resources rather than preserved exactly.
- A broad string migration can accidentally touch protocol values or storage
  keys; tasks must separate UI copy from internal constants.
- Spanish strings may be longer than Portuguese or English, so compact fader
  layouts and modal buttons need visual checks.
- Native per-app language support differs by OS version; fallback behavior must
  be explicit.
- Machine translation alone is risky for audio-console terminology; the
  glossary must constrain translations.

