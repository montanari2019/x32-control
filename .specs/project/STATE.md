# Tacimix Global State

Last updated: 2026-05-24

## Workspace Type

- Type: standalone React Native mobile app.
- Monorepo: no evidence of monorepo structure.
- Primary app: Tacimix mobile.
- Spec placement: co-located mobile feature specs under `src/features/[feature]/.specs/`.
- Root `.specs` is reserved for global project memory, brownfield mapping, and quick tasks.
- User preference recorded 2026-05-24: create local `.specs` scaffolding inside each current feature and leave room for future feature specs.

## Preferences

- Follow `docs/skills/tlc-spec-driven/SKILL.md` for future planning.
- Keep global docs in `.specs/project` and `.specs/codebase`.
- Keep feature-local state in `src/features/[feature]/.specs/STATE.md`.
- Keep a `feature/` folder inside each feature-local `.specs` directory as empty future scaffolding.
- Use logs in `/logs` for meaningful technical changes.
- Preserve user worktree changes; do not revert existing iOS plist/project changes unless explicitly requested.

## Current Project Status

- Core app flow exists and is functional in code.
- Demo console exists and is always listed.
- Real-console UDP discovery was heavily hardened for iOS but still needs physical-network validation.
- README has been updated to reflect current app state.
- `docs/skills` has been migrated to Claude-style Agent Skills directories.
- `.specs` global and local feature scaffolding is being initialized in this session.
- BusMix fader thumb-only interaction has been implemented and corrected after user validation: the `VerticalFader` gesture handler is attached directly to the thumb, leaving the central fader track visual-only.
- BusMix pan modal display has been implemented with a single signed numeric `-100..+100` readout and focused pan conversion tests.
- BusMix realtime console reactivity has been planned as a future implementation spec. The plan is to preserve app-to-console sends while improving console-to-app updates and linked-channel visual consistency.
- BusMix AUX/FX meter stability has been planned as a future implementation spec. CH 01..32 meters are the protected baseline; AUX/FX flicker is suspected to come from receiving the wrong X32 meter stream.

## Cross-Feature Decisions

- `RootNavigator` is the source of app route contracts.
- `ConsoleDiscovery` leads to `BusSelection`; `BusSelection` leads to `BusGroups`; `BusGroups` can push `BusMix`.
- Shared OSC clients should be reused when possible via `SharedOscClient`.
- BusGroups and BusMix share channel state through `BusMixChannelStore`.
- Presets are local to device, console, and BUS.
- MCA composition is local to device and console.
- Fader writes are optimistic and protect local edits from delayed remote echo.
- Toast/Dialog/Modal interactions should use the global `ModalProvider`.

## Architectural Blockers

- iOS physical-device discovery can still be blocked by Wi-Fi/VLAN, Local Network privacy, or multicast/broadcast platform behavior.
- Manual IP validation exists in services but is not exposed in current ConsoleDiscovery UI.
- Real meter indexing for all AUX/FX combinations should be validated against physical console firmware.
- `UIBackgroundModes=audio` needs product/legal/review justification.

## Deferred Ideas

- Manual IP field or saved console profiles.
- Formal feature specs for each existing feature after current scaffolding.
- Automated version generation for About screen.
- Stronger storage naming/security story.
- Release checklist linked to iOS/Android build artifacts.
- Real-console UAT for BusMix realtime linked-channel reactivity once X32/M32 hardware is available.
- Real-console UAT for BusMix AUX/FX meter stability once X32/M32 hardware is available.

## Recent Session Notes

- 2026-05-24: README was rewritten with current Tacimix capabilities.
- 2026-05-24: `docs/skills` was migrated to Agent Skills shape.
- 2026-05-24: `tlc-spec-driven` skill was added with reference files.
- 2026-05-24: This `.specs` brownfield map was requested for the whole app.
- 2026-05-24: Implemented BusMix specs `fader-thumb-only-interaction` and `pan-modal-correct-scale`. Automated checks passed for focused pan tests, BusMix tests, and TypeScript. Lint is blocked locally because `eslint` is not installed/resolvable.
- 2026-05-24: Corrected `fader-thumb-only-interaction` after user validation showed the coordinate-based hit-test blocked normal thumb dragging. The responder now lives directly on the thumb.
- 2026-05-24: Planned BusMix spec `realtime-console-reactivity` using local code analysis and external X32/OSC research. Key decision: do not regress the existing send path; use `/xremote` and current shared OSC transport, add linked-peer visual reflection for level/on, keep pan independent, and keep meters separate.
- 2026-05-24: Planned BusMix spec `aux-fx-meter-stability` using local meter code analysis and external X32 meter docs. Key decision: protect `/meters/1` CH behavior and isolate AUX/FX to the correct meter stream before considering visual smoothing or `/meters/3`.
