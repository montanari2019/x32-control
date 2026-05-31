# Tacimix Global State

Last updated: 2026-05-31

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
- BusMix fader cap visual refresh has been implemented as a visual-only change in `VerticalFader`: off-white skeuomorphic cap, recessed grooves, center calibration line, bevel/volume, and pressed shadow feedback. Gesture ownership, fader math, meters, OSC, and rollback behavior were preserved.
- BusMix pan modal slider consistency/performance has been fixed with a deterministic local pan control. The modal no longer relies on the uncontrolled native slider for pan position and no longer sends pan OSC on every drag tick; it commits on release or Center.
- BusMix `fader-meter-single-rail` has been implemented. The separate side meter and central fader track were collapsed into a single meter/fader rail by rendering the live meter in the old central track position. Follow-up density work reduced BusMix channel strips from `86` to `71` px with matching FlatList item layout, targeting about 5.5 visible channels on wider portrait phones. Thumb-only drag, fader math, meter subscriptions, OSC behavior, AUX/FX meter isolation, linked pressed feedback, and current rollback decisions were preserved. Manual visual/gesture runtime validation remains pending.
- BusMix presets modal now occupies 95% width and 95% height, with its preset list filling the remaining modal space instead of being capped to 320 px.
- BusGroups spec `bus-master-meter-rail` has been implemented. The source is X32/M32 `/meters/2` Mix Bus meter data, decoded at `busId - 1`, rendered inside the existing Bus Master central rail while preserving rail dimensions/background, fader/mute behavior, MCA behavior, and BusMix meter streams. Hardware UAT remains pending.

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
- Real meter indexing for BusGroups Bus Master `/meters/2` should be validated against physical X32/M32 firmware before the feature is marked hardware-complete.
- `UIBackgroundModes=audio` needs product/legal/review justification.

## Deferred Ideas

- Manual IP field or saved console profiles.
- Formal feature specs for each existing feature after current scaffolding.
- Automated version generation for About screen.
- Stronger storage naming/security story.
- Release checklist linked to iOS/Android build artifacts.
- Real-console UAT for BusMix realtime linked-channel reactivity once X32/M32 hardware is available.
- Real-console UAT for BusMix AUX/FX meter stability once X32/M32 hardware is available; automated stream isolation is already implemented.
- Real-console UAT for BusGroups Bus Master meter rail on BUS 1, 8, 9, and 16 once X32/M32 hardware is available.
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
- 2026-05-25: Implemented BusMix spec `fader-knob-skeuomorphic-refresh`. Updated only `VerticalFader` visual styling with a stable centered skeuomorphic cap and pressed shadow state. Gates passed: `yarn tsc` and `yarn jest __tests__/features/busMix --runInBand`.
- 2026-05-25: Extended BusMix fader pressed visual feedback to linked channel peers. Pressing/dragging one linked fader now also dims the linked peer cap visually, while preserving existing fader value propagation and OSC send behavior.
- 2026-05-25: Planned and implemented BusMix spec `pan-modal-slider-consistency-performance`. External references checked: `@react-native-community/slider` value semantics and X32/M32 OSC pan ranges. Replaced the pan modal native slider with a local deterministic control, added pan slider mapping tests, and changed pan drag to send only on release/Center. Gates passed: focused pan tests, BusMix tests, and TypeScript.
- 2026-05-25: Applied follow-up pan modal drag stability fix after user validation found the new slider jumped between positions. Drag now uses initial value plus `gestureState.dx` instead of move-time `locationX`, preventing nested slider layers from changing the coordinate basis.
- 2026-05-31: Planned BusMix spec `fader-meter-single-rail` using `docs/skills/tlc-spec-driven` and local project docs as the source of truth. Created spec/design/tasks under `src/features/busMix/.specs/feature/fader-meter-single-rail/`. External research was not necessary because this is a local React Native fader/meter composition change and existing docs already cover meter protocol and project conventions.
- 2026-05-31: Implemented BusMix spec `fader-meter-single-rail`. Added a passive custom rail slot to `VerticalFader`, moved `ChannelVuMeter` into that rail from `ChannelStrip`, removed the separate side meter column for BusMix strips, and kept no-meter placeholders aligned. Gates passed: `yarn tsc`, `yarn jest __tests__/features/busMix --runInBand`, `yarn jest __tests__/features/busGroups --runInBand`, and `git diff --check`. Manual portrait/landscape and gesture validation remains pending.
- 2026-05-31: Applied BusMix channel strip density follow-up for `fader-meter-single-rail`. Reduced channel strip/list item width to target about 5.5 visible channels on wider portrait phones and added one-line shrink protection to the dB label. Gates passed: `yarn tsc`, BusMix tests, and BusGroups tests.
- 2026-05-31: Enlarged BusMix presets modal to 95% width and 95% height, removing the previous max width/list height caps so users have more room to interact with saved presets. Gates passed: `yarn tsc` and BusMix tests.
- 2026-05-31: Planned BusGroups spec `bus-master-meter-rail` using `docs/skills/tlc-spec-driven`, local meter docs, current BusGroups code, and external X32/M32 meter references. Key decision: use `/meters/2` rather than `/meters/5` for the selected BUS master meter, preserve the existing master rail geometry/background/function, and require BusMix non-regression gates plus real-console UAT.
- 2026-05-31: Implemented BusGroups spec `bus-master-meter-rail`. Added `/meters/2` protocol helper/decoder coverage, mock/demo Bus Master meter subscriptions, real `X32BusGroupsService` `/meters/2` renewal, transient `masterMeterDbfs` hook state, and passive meter fill inside the existing 5 px Bus Master rail. Gates passed: `yarn tsc`, BusGroups tests, BusMix tests, shared X32Protocol test, and `git diff --check`. Real-console UAT on BUS 1, 8, 9, and 16 remains pending.
