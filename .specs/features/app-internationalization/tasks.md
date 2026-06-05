# App Internationalization Tasks

Date: 2026-06-05
Status: implemented; manual UAT pending

## Task List

- [x] T-001: Audit translatable text and classify literals
  Reqs: REQ-003, REQ-005, REQ-006, REQ-008
  What: Build an inventory of app-owned user-facing strings, reserved terms,
  internal constants, protocol values, storage keys, and user/console data.
  Where: `src/**/*.{ts,tsx}`, `ios/Tacimix/Info.plist`, Android resources and
  manifests.
  Depends on: none
  Reuses: `context.md` initial observations and reserved glossary.
  Done when: The audit identifies every migration target and every protected
  non-target needed for implementation review.
  Tests: `rg` inventory commands documented in the implementation log.
  Gate: No implementation begins until protected terms and translatable copy
  are separated.

- [x] T-002: Finalize reserved glossary and copy policy
  Reqs: REQ-005, REQ-006, REQ-007
  What: Convert the initial glossary into an implementation-ready source of
  truth, including examples for `Presets`, `BUS`, `MCA`, `CH`, `AUX`, `FX`,
  `ON`, `MUTE`, product labels, and user/console data.
  Where: `src/shared/i18n/reservedTerms.ts` or equivalent, plus docs if needed.
  Depends on: T-001
  Reuses: `context.md` protected glossary.
  Done when: Reviewers can tell whether a word belongs in translation
  resources or must remain literal.
  Tests: Reserved-term unit tests after the i18n module exists.
  Gate: `Presets` is explicitly protected in all locales.

- [x] T-003: Choose and install i18n dependencies
  Reqs: REQ-001, REQ-002, REQ-007
  What: Add the selected React Native i18n stack and native dependencies.
  Recommended: `react-native-localize`, `i18next`, `react-i18next`.
  Where: `package.json`, lockfile, iOS pods.
  Depends on: T-002
  Reuses: current RN 0.78 autolinking and `pod-install.sh`.
  Done when: dependencies install cleanly and are compatible with React Native
  0.78.1.
  Tests: `yarn install`, `yarn pod`, `yarn tsc`.
  Gate: No native build setting or existing dependency is regressed.

- [x] T-004: Implement locale resolver
  Reqs: REQ-001, REQ-002, REQ-010
  What: Create a pure locale resolver that maps platform locale candidates to
  `en`, `pt-BR`, or `es`, with English fallback.
  Where: `src/shared/i18n/locales.ts` and tests.
  Depends on: T-003
  Reuses: shared utility/test style from `src/shared/utils`.
  Done when: `en-*`, `pt-*`, `es-*`, unsupported, empty, and malformed inputs
  are covered.
  Tests: focused shared i18n locale tests.
  Gate: Locale mapping matches `design.md`.

- [x] T-005: Create i18n bootstrap and React binding
  Reqs: REQ-001, REQ-002, REQ-003
  What: Initialize i18next, register resources, connect React, and wire active
  language from platform locale detection.
  Where: `src/shared/i18n/*`, `src/app/App.tsx` if provider/wiring is needed.
  Depends on: T-004
  Reuses: existing shared bootstrap patterns in `src/app/App.tsx`.
  Done when: components can call `t()` or a typed wrapper and get deterministic
  strings for all supported locales.
  Tests: shared i18n initialization tests or focused unit tests for wrappers.
  Gate: App starts in Demo flow with default locale.

- [x] T-006: Create base translation resources
  Reqs: REQ-002, REQ-003, REQ-005, REQ-007
  What: Create `en`, `pt-BR`, and `es` translation resources with namespaces
  for common UI, errors, Discovery, BusSelection, BusGroups, BusMix, About, and
  accessibility.
  Where: `src/shared/i18n/resources/*`.
  Depends on: T-005
  Reuses: audit from T-001 and glossary from T-002.
  Done when: all initial keys exist in all three locales and dynamic strings
  use full-sentence interpolation/pluralization.
  Tests: resource completeness tests and pluralization tests.
  Gate: no missing keys for supported locales.

- [x] T-007: Localize shared components and shared errors
  Reqs: REQ-003, REQ-007, REQ-009
  What: Replace app-owned literals in shared components, modal/dialog/toast
  surfaces, loading/error states, common error helpers, network diagnostics,
  OSC errors that are user-facing, and accessibility copy.
  Where: `src/shared/components/*`, `src/shared/errors/*`,
  `src/shared/network/*`, `src/shared/osc/*`, `src/shared/utils/helpers/*`.
  Depends on: T-006
  Reuses: existing `AppError`, `Toast`, `Dialog`, `ErrorState`,
  `LoadingState`.
  Done when: shared UI can render localized common actions and errors without
  changing public component behavior.
  Tests: focused shared i18n tests, existing shared OSC/network tests.
  Gate: `yarn jest __tests__/shared/osc --runInBand` and
  `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`.

- [x] T-008: Localize ConsoleDiscovery and BusSelection
  Reqs: REQ-001, REQ-003, REQ-005, REQ-009
  What: Replace user-facing copy in console discovery and bus selection while
  preserving console/model names and `X32/M32`, `BUS`, `Demo`, `Wi-Fi`, and IP
  terms.
  Where: `src/features/consoleDiscovery/*`, `src/features/busSelection/*`.
  Depends on: T-007
  Reuses: shared `Button`, `ErrorState`, `LoadingState`, route contracts.
  Done when: Discovery and BusSelection render localized copy in all supported
  locales and still navigate with unchanged params.
  Tests: focused locale rendering tests if practical, plus `yarn tsc`.
  Gate: Demo console still appears and real scan code remains behaviorally
  unchanged.

- [x] T-009: Localize BusGroups
  Reqs: REQ-003, REQ-005, REQ-006, REQ-007, REQ-009
  What: Replace user-facing copy in BusGroups screens, strips, MCA modal,
  loading/errors, accessibility labels, singular/plural channel counts, and
  edit/save/clear actions.
  Where: `src/features/busGroups/*`.
  Depends on: T-007
  Reuses: `useBusGroups`, `McaChannelSelectionModal`, `GroupStrip`,
  `BusGroupsHeader`, `MasterStrip`.
  Done when: UI copy localizes while MCA names, channel labels, bus labels,
  `MCA`, `BUS`, `DCA`, `CH`, `AUX`, `FX`, `ON`, and `MUTE` remain protected.
  Tests: BusGroups tests plus pluralization/resource tests.
  Gate: `yarn jest __tests__/features/busGroups --runInBand`.

- [x] T-010: Localize BusMix, Presets, and Pan surfaces
  Reqs: REQ-003, REQ-005, REQ-006, REQ-007, REQ-009
  What: Replace user-facing copy in BusMix screen, header, restore overlay,
  Presets modal, pan modal, empty states, toasts, placeholders, and accessibility
  labels.
  Where: `src/features/busMix/*`.
  Depends on: T-007
  Reuses: `BusMixPresetsModal`, `PanControlModal`, `BusMixPresetService`,
  `useBusMix`.
  Done when: surrounding copy localizes while `Presets`, preset names, bus
  names, channel names, `Bus Mix`, `CH`, `AUX`, `FX`, `ON`, `MUTE`, `Pan`, and
  dB labels remain correct per glossary.
  Tests: BusMix tests plus focused tests for Presets copy and plural/count
  strings.
  Gate: `yarn jest __tests__/features/busMix --runInBand`.

- [x] T-011: Localize About and static product copy
  Reqs: REQ-003, REQ-005, REQ-009
  What: Replace About screen static text and any remaining app-owned static
  product copy while preserving `Tacimix`, version values, credits, and product
  identifiers.
  Where: `src/features/about/*`.
  Depends on: T-007
  Reuses: current About layout and version display.
  Done when: About renders correctly in all supported locales.
  Tests: `yarn tsc`; focused render test if UI test support is added.
  Gate: no change to version calculation.

- [x] T-012: Configure native iOS localization
  Reqs: REQ-001, REQ-004, REQ-008, REQ-010
  What: Declare supported locales and localize user-visible native strings,
  especially Local Network permission text, without changing network
  entitlements or discovery preflight behavior.
  Where: `ios/Tacimix.xcodeproj/project.pbxproj`,
  `ios/Tacimix/Info.plist`, localized `.lproj` resources or equivalent.
  Depends on: T-006
  Reuses: existing iOS Local Network permission setup.
  Done when: iOS exposes supported app languages where supported and native
  permission copy exists for `en`, `pt-BR`, and `es`.
  Tests: `plutil -lint ios/Tacimix/Info.plist`, iOS build sanity.
  Gate: Local Network permission/preflight remains preserved.

- [x] T-013: Configure native Android localization
  Reqs: REQ-001, REQ-004, REQ-008, REQ-010
  What: Add Android supported locale configuration and localized visible
  resources without changing application id, flavors, signing, or permissions.
  Where: Android `res/values*`, locale config XML, Android manifest/Gradle as
  needed.
  Depends on: T-006
  Reuses: existing Android flavors and build scripts.
  Done when: Android 13+ can expose app language settings for supported
  locales and older Android uses device locale fallback.
  Tests: Gradle resource/build sanity, `yarn tsc`.
  Gate: develop/homolog/production flavor configuration remains intact.

- [x] T-014: Add hardcoded-copy guardrails
  Reqs: REQ-003, REQ-005, REQ-010
  What: Add tests or scripts that detect new Portuguese user-facing literals
  and missing translation keys, with allowlists for reserved terms, comments,
  protocol values, route names, storage keys, and tests.
  Where: `__tests__/shared/i18n/*` and/or `scripts/*`.
  Depends on: T-010, T-011
  Reuses: current Jest pattern and `rg` inventory.
  Done when: future hardcoded UI copy is easy to catch in CI or local checks.
  Tests: focused guardrail tests/script.
  Gate: guardrails do not false-positive on protected technical strings.

- [x] T-015: Run full automated regression gates
  Reqs: REQ-008, REQ-010
  What: Run the appropriate project gates after all migration tasks.
  Where: whole repo.
  Depends on: T-014
  Reuses: `.specs/codebase/TESTING.md`.
  Done when: TypeScript and focused suites pass, or failures are documented as
  pre-existing with evidence.
  Tests: `yarn tsc`, `yarn jest __tests__/features/busMix --runInBand`,
  `yarn jest __tests__/features/busGroups --runInBand`,
  `yarn jest __tests__/shared/osc --runInBand`,
  `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`.
  Gate: no regression in BusMix, BusGroups, OSC, or network behavior.

- [ ] T-016: Manual locale UAT on iOS and Android
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004, REQ-009, REQ-010
  What: Validate the app manually in English, Brazilian Portuguese, and Spanish
  through OS app/device language settings.
  Where: iOS simulator/device and Android emulator/device.
  Depends on: T-015
  Reuses: existing Demo console flow and real-device UAT checklist style.
  Done when: Discovery, BusSelection, BusGroups, BusMix, Presets modal, Pan
  modal, About, toasts, dialogs, loading states, and error states are checked in
  each supported locale.
  Tests: manual UAT notes with screenshots or written observations.
  Gate: no clipped/overlapping critical text in portrait or landscape.

- [x] T-017: Update documentation after implementation
  Reqs: REQ-002, REQ-004, REQ-005, REQ-010
  What: Update README and `.specs` docs to describe supported locales, fallback
  behavior, reserved glossary, and validation commands.
  Where: `README.md`, `.specs/project/STATE.md`, `.specs/codebase/*` if
  architecture/testing/integrations changed.
  Depends on: T-016
  Reuses: current docs structure.
  Done when: future maintainers can understand how to add a locale or a new
  translation key.
  Tests: documentation review.
  Gate: docs match final implementation behavior.

## Implementation Notes

- Implemented 2026-06-05 with `i18next`, `react-i18next`, and
  `react-native-localize`.
- Supported runtime locales: `en`, `pt-BR`, `es`; unsupported locales fall back
  to English.
- Native locale resources were added for iOS `InfoPlist.strings` and Android
  `localeConfig`/localized `strings.xml`.
- Automated gates passed for TypeScript, shared i18n, BusMix, BusGroups, OSC,
  network, iOS plist lint, and CocoaPods install.
- Android develop debug resource processing could not run in this environment
  because no Java Runtime is installed.
- Manual locale UAT across iOS and Android remains pending.
