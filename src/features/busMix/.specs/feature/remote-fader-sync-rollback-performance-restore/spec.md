# Spec - BusMix Remote Fader Sync Rollback Performance Restore

Last updated: 2026-05-25

## Context

The user validated that the app was more fluid before the recent remote fader receive work:

- `remote-fader-subscription-sync`
- `remote-fader-fluidity-performance`

The newer behavior made the app less fluid overall. A previous app version/build, described by the user as around version `2.0 build 3` / roughly several commits earlier, feels smoother, including meters and the general BusMix experience.

The goal is to plan a controlled rollback of those two receive-path features while preserving all unrelated improvements, especially the Local Network permission preflight shown when the app opens or first binds UDP. That permission prompt fixed an important first-console-discovery failure and must not regress.

## Source Of Truth

Implementation must follow:

- `docs/skills/tlc-spec-driven/SKILL.md`
- `docs/skills/tlc-spec-driven/references/specify.md`
- `docs/skills/tlc-spec-driven/references/design.md`
- `docs/skills/tlc-spec-driven/references/tasks.md`
- `docs/skills/tlc-spec-driven/references/implement.md`
- `.specs/codebase/ARCHITECTURE.md`
- `.specs/codebase/TESTING.md`
- `src/features/busMix/.specs/STATE.md`
- Existing feature docs:
  - `src/features/busMix/.specs/feature/remote-fader-subscription-sync/`
  - `src/features/busMix/.specs/feature/remote-fader-fluidity-performance/`

## Current Findings

- `remote-fader-fluidity-performance` is currently present in the working tree and added:
  - `remoteFaderCoalescing`;
  - `faderSubscriptionScope`;
  - frame-aligned fader flush;
  - batched remote fader updates;
  - BusMix-specific scalar subscription `timeFactor = 20`;
  - additional diagnostics.
- `remote-fader-subscription-sync` appears in `HEAD` but not `HEAD~1` as `useBusMixRemoteFaderSubscription`, managed scalar `/subscribe`, and related tests/specs.
- The performance regression is plausibly caused by extra OSC fader receive traffic and extra JS/store work, even though meter code was not directly changed. Extra UDP traffic can still reduce meter/UI smoothness because the same app and network resources are shared.
- The iOS Local Network permission preflight is independent and must be preserved:
  - `src/shared/network/UdpTransport.ts` calls `ensureLocalNetworkPermission()`;
  - `src/shared/network/LocalNetworkPermission.ts` owns JS/native bridge logic;
  - `ios/Tacimix/LocalNetworkPermission.m` owns native preflight;
  - `ios/Tacimix/Info.plist` contains `NSLocalNetworkUsageDescription` and `NSBonjourServices`;
  - `ios/Tacimix.xcodeproj/project.pbxproj` includes `LocalNetworkPermission.m` in sources.

## Requirements

REQ-001: Remove the runtime behavior introduced by `remote-fader-fluidity-performance`.

REQ-002: Remove the runtime behavior introduced by `remote-fader-subscription-sync`, specifically managed visible-fader X32 `/subscribe` receive loops.

REQ-003: Restore the pre-remote-subscription BusMix fader receive behavior based on the existing lightweight exact-address listeners and background sync.

REQ-004: Preserve the current app-to-console fader send path, including optimistic UI, 30 ms send throttle, final send on release, presets, and BusGroups shared state.

REQ-005: Preserve `aux-fx-meter-stability`; do not touch meter stream isolation, meter decoder behavior, meter request/renew intervals, or meter visual components.

REQ-006: Preserve the iOS Local Network permission preflight and Info.plist permission declarations.

REQ-007: Preserve unrelated navigation, ConsoleDiscovery, BusSelection, BusGroups, pan modal, fader thumb-only behavior, and local storage behavior.

REQ-008: Remove tests that only cover deleted remote-fader subscription/coalescing behavior, or rewrite them to cover the restored lightweight receive path.

REQ-009: Mark `remote-fader-subscription-sync` and `remote-fader-fluidity-performance` as undone/reverted in local and global state documents after implementation.

REQ-010: Add a rollback log explaining what was removed, what was preserved, and why.

REQ-011: Use focused gates to prove BusMix, BusGroups, shared OSC, shared network permission code, and TypeScript remain stable.

REQ-012: Prefer a surgical rollback over broad `git reset`/`checkout` so user work and unrelated improvements are not lost.

## Acceptance Criteria

- No BusMix runtime code calls `useBusMixRemoteFaderSubscription`.
- No BusMix runtime code calls `BusMixService.subscribeChannelLevelUpdates`.
- `OscClient` no longer maintains managed scalar subscription timers for BusMix fader receive unless another unrelated feature needs that API and explicitly keeps it.
- `X32Protocol` no longer exposes BusMix fader subscription defaults if they are unused.
- Removed feature-only files are gone or archived only as specs/logs, not imported by runtime.
- BusMix fader receive falls back to the lightweight pre-subscription behavior.
- AUX/FX meters remain isolated as implemented by `aux-fx-meter-stability`.
- Local Network permission prompt/preflight still exists and is verified by static checks.
- `.specs/project/STATE.md` and `src/features/busMix/.specs/STATE.md` mark both features as undone/reverted.
- Automated gates pass, except any already-known unrelated full-suite timeout must be documented.

## Out Of Scope

- Removing the Local Network permission preflight.
- Reverting iOS permission/native project entries.
- Reverting AUX/FX meter stability.
- Reverting fader thumb-only interaction.
- Reverting pan modal scale/readout.
- Reverting unrelated app branding, navigation, orientation, or build settings.
- Adding a new fader remote-sync mechanism in the rollback pass.

## Performance Direction

Before trying another remote-sync implementation, restore the known smoother baseline first. The next performance investigation should measure the baseline app with:

- real X32/M32 connected;
- BusMix open with meters visible;
- no managed fader `/subscribe` loops;
- Local Network permission preflight preserved;
- meter smoothness and overall UI responsiveness observed for at least 2 minutes.

Only after that baseline is stable should a future receive-sync solution be reconsidered, likely behind a feature flag or diagnostics-first path.
