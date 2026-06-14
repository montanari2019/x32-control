# App Internationalization Spec

Date: 2026-06-05
Status: planned
Scope: global app feature

## Problem

Tacimix currently mixes Portuguese UI copy with English technical/product terms.
The app needs to support users whose device or per-app language is English,
Brazilian Portuguese, or Spanish, while preserving domain terms and user data
that must not be translated.

## Goal

Internationalize the app so all user-facing app-owned text is selected from the
device/app locale, initially supporting:

- `en`
- `pt-BR`
- `es`

The feature must preserve app behavior, OSC/network behavior, fader behavior,
meter behavior, presets, local storage, and current navigation.

## Requirements

REQ-001: Locale source

- The active app language must follow the OS app language setting when the
  platform exposes one, otherwise the device preferred language.
- There must be no in-app language selector in this feature.

REQ-002: Supported locales and fallback

- The app must support English, Brazilian Portuguese, and Spanish.
- Unsupported locales must fall back predictably to English.
- Regional Spanish locales must resolve to `es`.
- Portuguese locales must resolve to `pt-BR` unless a later product decision
  adds `pt-PT`.

REQ-003: User-facing app copy

- All app-owned user-facing text in React Native UI, shared UI components,
  toasts, dialogs, error states, accessibility labels, placeholders, loading
  labels, and validation messages must be localizable.

REQ-004: Native/system-facing copy

- iOS and Android language declarations and native user-facing strings must be
  prepared so supported app languages are visible through platform settings
  where supported.
- iOS purpose strings and Android app resources that users can see must have
  localized values for supported locales.

REQ-005: Reserved terminology

- Proprietary, product, console, protocol, and audio-domain reserved terms must
  not be translated.
- `Presets` must remain `Presets` in all locales.
- The reserved glossary must be documented and used during migration.

REQ-006: User and console data

- User-authored or console-provided values must never be translated or altered:
  preset names, MCA names, channel names, bus names, console names, model names,
  firmware strings, and IP addresses.

REQ-007: Dynamic grammar

- Dynamic strings must use pluralization and complete translated sentences.
- Avoid sentence construction by concatenating translated fragments.
- Interpolation is allowed only for runtime values such as counts, names, bus
  numbers, IP addresses, and error details.

REQ-008: Runtime behavior preservation

- Internationalization must not change OSC paths, request timing, meter
  subscriptions, storage keys for existing user data, fader math, navigation
  params, or console communication.

REQ-009: Layout and accessibility

- Translated copy must not clip, overflow, or overlap in supported portrait and
  landscape layouts.
- Accessibility labels must be localized while preserving meaningful dynamic
  values.

REQ-010: Verification

- Automated checks must cover locale resolution, translation key availability,
  pluralized strings, reserved-term preservation, and absence of new hardcoded
  Portuguese user-facing strings.
- Manual UAT must cover English, Brazilian Portuguese, and Spanish on iOS and
  Android where available.

## Acceptance Criteria

- Setting iOS app/device language to English shows app-owned UI copy in
  English while preserving reserved terms.
- Setting iOS app/device language to Brazilian Portuguese shows app-owned UI
  copy in Brazilian Portuguese while preserving reserved terms.
- Setting iOS app/device language to Spanish shows app-owned UI copy in
  Spanish while preserving reserved terms.
- Equivalent Android checks pass through Android app language settings on
  Android 13+ and through device language fallback where per-app language is
  unavailable.
- Existing user-created preset names and MCA names remain exactly as saved.
- Console-provided channel, bus, console, model, and firmware strings remain
  exactly as received.
- `Presets`, `BUS`, `MCA`, `CH`, `AUX`, `FX`, `X32`, `M32`, `OSC`, and `UDP`
  remain unchanged wherever used as domain terms.
- `yarn tsc` passes.
- Focused i18n tests pass.
- Existing BusMix, BusGroups, shared OSC, and shared network tests pass.

## Out Of Scope

- In-app language picker.
- Cloud sync or migration of user data.
- Translation of preset names, MCA names, channel names, bus names, or console
  names.
- RTL-specific visual redesign.
- Store listing localization copy beyond noting release follow-up needs.
- Changing product naming or audio terminology.
- Refactoring theme or unrelated UI layout.

