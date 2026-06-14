# App Internationalization Context

Date: 2026-06-05

## Scope

Global feature: app-wide internationalization for Tacimix.

Reason for global placement:

- The change crosses all mobile features, shared components, shared errors,
  native metadata, and release validation.
- It is not owned by a single `src/features/*` folder.
- Per `docs/skills/tlc-spec-driven/SKILL.md`, standalone/default specs live
  under `.specs/features/[feature-name]/`.

## User Request Summary

The app must localize its user-facing text according to the device or per-app
language setting:

- English device/app language: show English.
- Brazilian Portuguese device/app language: show Brazilian Portuguese.
- Spanish device/app language: show Spanish.
- Do not create an in-app language setting in this planning scope.
- Do not translate proprietary or reserved terms that are already domain terms
  in this product context, such as `Presets`.
- Do not translate user-authored or console-provided content, such as saved
  preset names, custom MCA names, channel names, bus names, IP addresses, or
  firmware strings.
- Do not implement yet. Create planning/tasks only.

## External Research Notes

Sources consulted:

- Apple Localization overview:
  https://developer.apple.com/localization/
- Android per-app language preferences:
  https://developer.android.com/guide/topics/resources/app-languages
- Android localization guide:
  https://developer.android.com/guide/topics/resources/localization
- `react-native-localize`:
  https://github.com/zoontek/react-native-localize
- `react-i18next`:
  https://react.i18next.com/
- i18next best practices:
  https://www.i18next.com/principles/best-practices
- React Native `I18nManager`:
  https://reactnative.dev/docs/i18nmanager

Industry-standard conclusions for this app:

- Separate user-visible strings from code and keep translations in structured
  resources.
- Let OS language or OS per-app language drive app language. Avoid an in-app
  language selector unless product explicitly needs one.
- Declare supported app languages natively so iOS and Android can expose app
  language choices in system settings where supported.
- Use a React Native locale detector for runtime JS selection.
- Use a translation framework that supports React Native, namespaces,
  interpolation, and plurals.
- Keep interpolated strings self-contained and avoid building sentences from
  fragments; this matters for Spanish and Portuguese grammar.
- Localize native purpose strings and app metadata where platform surfaces show
  them.
- Test for clipping, truncation, and overlap in each supported language.
- RTL layout work is not required for English, Brazilian Portuguese, or
  Spanish, but the architecture should not make future RTL support harder.

## Current Code Observations

The app currently has user-facing strings spread across:

- `src/features/consoleDiscovery/*`
- `src/features/busSelection/*`
- `src/features/busGroups/*`
- `src/features/busMix/*`
- `src/features/about/*`
- `src/shared/components/*`
- `src/shared/errors/*`
- `src/shared/network/*`
- `src/shared/osc/*`
- `ios/Tacimix/Info.plist`
- Android resources/manifests, if app name or permissions are surfaced.

Examples observed:

- Discovery copy: "Conecte o celular...", "Buscar mesas na rede".
- Loading/error copy: "Lendo nomes dos BUS...", "Recarregar".
- BusGroups copy: "Personal Mix Grupos", "Falha no controle de grupos",
  "Lendo DCA, mute e master da mesa...", "canal vinculado".
- BusMix copy: "Carregando canais, cores e niveis...", preset success/error
  messages, restore overlay copy.
- Shared/native errors: invalid IP, UDP failures, local network permission.
- Shared component errors: `Dialog.Actions aceita apenas componentes Button.`

## Reserved Terms And Non-Localized Data

Initial protected glossary:

- Product/brand/protocol: `Tacimix`, `Behringer`, `Midas`, `X32`, `M32`,
  `OSC`, `UDP`, `Bonjour`, `IP`, `Wi-Fi`, `iOS`, `Android`.
- Console/domain abbreviations: `BUS`, `CH`, `AUX`, `FX`, `DCA`, `MCA`,
  `VU`, `dB`, `dBFS`, `ON`, `MUTE`.
- Product/domain labels: `Presets`, `Demo`, `Personal Mix`, `BusMix`,
  `BusGroups`.
- Protocol paths and values: `/info`, `/status`, `/xremote`, `/meters`,
  `/renew`, `/ch`, `/auxin`, `/fxrtn`, `/bus`, `/dca`.
- User or console data: preset names, MCA names, channel labels, bus names,
  console names, model names, firmware values, IP addresses.

Rules:

- Protected terms may appear inside localized sentences, but the term itself
  remains unchanged.
- If a protected term is currently mixed with Portuguese grammar, translate the
  surrounding grammar only.
- Some terms may need final product review before implementation. In this spec,
  `Presets` is explicitly protected by user instruction.

## Open Questions For Implementation Time

- Should unsupported Portuguese variants such as `pt-PT` fall back to `pt-BR`
  or to English? The planned default is `pt-* -> pt-BR` because the user asked
  for Portuguese behavior as Brazilian Portuguese.
- Should `Personal Mix` remain an English product label in all locales? The
  planned default is yes, because it behaves as a product/domain label today.
- Should App Store and Play Store metadata also be localized in this same
  feature, or handled in release hardening? Planned default: include native app
  metadata tasks, defer store listing copy to release hardening.

