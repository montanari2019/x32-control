# Tacimix Global State

Last updated: 2026-05-25

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
- BusMix realtime console reactivity has been implemented for linked CH visual reflection, pan receive, and lightweight receive health. Real-console UAT remains pending in the connected emulator + X32 environment.
- BusMix AUX/FX meter stability has been implemented for stream isolation. CH 01..32 meters remain the protected baseline; AUX/FX listeners now consume only the `/meters/13` stream instead of also receiving `/meters/1`.
- BusMix remote fader subscription sync and remote fader fluidity/performance have been rolled back after user validation showed the app and meters were more fluid before those receive-path changes. Managed visible-fader `/subscribe` loops, scalar subscription infrastructure, and the follow-up coalescing/hysteresis layer were removed. BusMix now uses the lighter exact-address receive model plus `/xremote` and background sync again.
- iOS Local Network permission preflight must be preserved during any rollback. The permission prompt/preflight fixed first-console-discovery failures and is independent from the BusMix remote fader receive work.

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
- Real-console UAT for BusMix AUX/FX meter stability once X32/M32 hardware is available; automated stream isolation is already implemented.
- Real-console UAT for BusMix remote fader subscription sync, specifically CH 17 same-BUS send-level changes from the X32 official app versus main channel fader changes.
- Real-console UAT for BusMix remote fader fluidity/performance after receive-path optimization, measuring latency, packet rate, applied update rate, and fader settle behavior on modest device/emulator conditions.

## Recent Session Notes

- 2026-05-24: README was rewritten with current Tacimix capabilities.
- 2026-05-24: `docs/skills` was migrated to Agent Skills shape.
- 2026-05-24: `tlc-spec-driven` skill was added with reference files.
- 2026-05-24: This `.specs` brownfield map was requested for the whole app.
- 2026-05-24: Implemented BusMix specs `fader-thumb-only-interaction` and `pan-modal-correct-scale`. Automated checks passed for focused pan tests, BusMix tests, and TypeScript. Lint is blocked locally because `eslint` is not installed/resolvable.
- 2026-05-24: Corrected `fader-thumb-only-interaction` after user validation showed the coordinate-based hit-test blocked normal thumb dragging. The responder now lives directly on the thumb.
- 2026-05-24: Planned BusMix spec `realtime-console-reactivity` using local code analysis and external X32/OSC research. Key decision: do not regress the existing send path; use `/xremote` and current shared OSC transport, add linked-peer visual reflection for level/on, keep pan independent, and keep meters separate.
- 2026-05-24: Planned BusMix spec `aux-fx-meter-stability` using local meter code analysis and external X32 meter docs. Key decision: protect `/meters/1` CH behavior and isolate AUX/FX to the correct meter stream before considering visual smoothing or `/meters/3`.
- 2026-05-24: Implemented BusMix spec `aux-fx-meter-stability` stream isolation. Added `meterStreamRouting` helpers, dispatch isolation tests, AUX/FX offset tests, and preserved current meter request/renew intervals. Real-console UAT remains pending.
- 2026-05-24: Implemented BusMix spec `realtime-console-reactivity`. Added linked-channel sync helpers, local/remote level-on visual reflection for linked CH pairs, pan receive without mirroring, and realtime subscription health refs. Kept meters separate and did not add focused polling fallback without real-console drift evidence.
- 2026-05-24: Planned BusMix spec `remote-fader-subscription-sync` using local code analysis plus X32 OSC research. Key decision: current `OscClient.subscribe` is only local dispatch, so visible BusMix faders need managed X32 `/subscribe` renewal for source send-level paths. First task must distinguish `/ch/17/mix/fader` from `/ch/17/mix/{bus}/level` before implementation.
- 2026-05-24: Implemented BusMix spec `remote-fader-subscription-sync`. Added managed scalar `/subscribe` support in `OscClient`, BusMixService send-level subscription method, visible fader subscription hook, BusMixScreen visibility wiring, and fader subscription health diagnostics. Automated BusMix, BusGroups, shared OSC focused tests, and TypeScript passed. Manual CH 17 UAT remains pending.
- 2026-05-24: Full `yarn jest --runInBand` after `remote-fader-subscription-sync` failed only on 3 pre-existing/NetworkScanner timeout cases; BusMix, BusGroups, shared OSC, shared utils, and X32 suites passed in that full run.
- 2026-05-25: Planned BusMix spec `remote-fader-fluidity-performance` following `docs/skills/tlc-spec-driven`. External research focused on Mixing Station X32 network traffic guidance, X32 OSC subscription behavior, UDP/buffer pressure, and React Native frame/JS-thread performance. Key decision: optimize by bounding the receive-to-render path, not by broad polling or changing fader UI. Tasks now cover baseline measurement, conservative `/subscribe` tuning, packet coalescing, `requestAnimationFrame` flush, batched store updates, stale echo suppression, visibility hysteresis, diagnostics, non-regression gates, and real-console UAT.
- 2026-05-25: Implemented BusMix spec `remote-fader-fluidity-performance` code path. Added BusMix-specific `/subscribe` time factor 20, remote fader packet coalescer, visibility subscription hysteresis, frame-aligned flush, batched linked remote fader reducer, stale echo suppression, and extended diagnostics. Automated gates passed: BusMix, BusGroups, shared OSC, focused utility/service tests, and TypeScript. Real-console numeric baseline/UAT remains pending.
- 2026-05-25: Planned rollback spec `remote-fader-sync-rollback-performance-restore` after user reported older build/version felt more fluid overall and meters were smoother. Product decision: `remote-fader-subscription-sync` and `remote-fader-fluidity-performance` should be treated as undone targets pending implementation rollback. Preserve Local Network permission preflight, AUX/FX meter stability, local fader sends, and unrelated UX fixes.
- 2026-05-25: Created BusMix visual task/spec `fader-knob-skeuomorphic-refresh` for restyling the `VerticalFader` thumb into an off-white physical fader cap with recessed grooves, center calibration line, bevels, 3D lighting, and projected shadow. Scope is visual-only; do not touch meters, OSC, fader math, or rollback/performance work.
- 2026-05-25: Implemented rollback spec `remote-fader-sync-rollback-performance-restore`. Removed `useBusMixRemoteFaderSubscription`, `BusMixService.subscribeChannelLevelUpdates`, `OscClient.subscribeScalarValue`, X32 scalar subscription helpers/defaults, remote fader coalescing, fader subscription scope hysteresis, and associated tests. Restored BusMix lightweight `service.onLevel` receive path. Preserved Local Network permission preflight, AUX/FX meter stability, local fader sends, and linked realtime helpers. Gates passed: BusMix, BusGroups, shared OSC, shared network with timeout 10000, TypeScript, plist lint, and `git diff --check`.
