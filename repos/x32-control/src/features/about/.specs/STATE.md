# Local State - about

Last updated: 2026-05-24

## Scope

Feature: `about`

Location:

```txt
src/features/about/
```

Purpose:

- Show static app/about information.
- Provide a route for product/version/credit details.

## Current Files

```txt
src/features/about/screens/AboutScreen.tsx
```

## Current Behavior

- Screen is reachable from BusSelection through the right info button.
- Uses shared `Screen` and `AppHeader`.
- Displays:
  - title `ABOUT`;
  - app version;
  - developer credit;
  - support credit;
  - current year.
- Uses theme colors, spacing, and radius from `src/shared/theme`.

## Current Decisions

- Native stack header is hidden; screen renders custom app header.
- Version display is derived from hardcoded `APP_COMMIT_VERSION`.
- Credits are static.

## Known Concerns

- `APP_COMMIT_VERSION = 44` is manual and can drift from real build/release metadata.
- No formal feature spec exists yet.
- No dedicated tests exist for this screen.

## Future Spec Placement

Feature specs should be created under:

```txt
src/features/about/.specs/feature/[feature-name]/
```

This directory is intentionally empty for now except for scaffolding.

## Open Ideas

- Automate visible version from app metadata or build script.
- Add app legal/support/contact information if product requires it.
- Decide if About should show OSC/network diagnostic version data.

