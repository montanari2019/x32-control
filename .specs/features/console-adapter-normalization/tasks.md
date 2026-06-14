# Console Adapter Normalization Tasks

Date: 2026-06-14
Status: implemented; manual X32/M32 UAT pending

## Task List

- [x] T-001: Audit current console-facing contracts
  Reqs: REQ-001, REQ-002, REQ-003, REQ-004
  What: Inventory every feature service method, DTO, subscription, path helper,
  mock/demo method, storage identity input, and test that currently participates
  in console communication or normalized console state.
  Where: `src/features/consoleDiscovery`, `src/features/busSelection`,
  `src/features/busGroups`, `src/features/busMix`, `src/shared/mixer`,
  `src/shared/osc`, `src/shared/network`, `src/shared/x32`, `__tests__`.
  Depends on: none
  Reuses: `context.md` observations and `.specs/codebase/*`.
  Done when: Implementation has a checklist of public APIs and behavior that
  must remain compatible.
  Tests: Documentation-only task; use `rg` inventory commands in the
  implementation log.
  Gate: No adapter code is added until feature DTOs, subscriptions, and storage
  identity dependencies are classified.

- [x] T-002: Define adapter contract and normalized endpoint types
  Reqs: REQ-001, REQ-002, REQ-005, REQ-006, REQ-009
  What: Add `IConsoleAdapter`, `ConsoleEndpoint`, `ConsoleAdapterKind`,
  `Unsubscribe`, and normalized type strategy. Decide whether shared DTOs are
  new source-of-truth types or structural aliases to existing feature types for
  the first migration.
  Where: `src/shared/console/IConsoleAdapter.ts`,
  `src/shared/console/ConsoleEndpoint.ts`,
  `src/shared/console/ConsoleAdapterKind.ts`, `src/shared/console/types.ts`.
  Depends on: T-001
  Reuses: current `MixerControlProvider` capabilities without preserving its
  feature-import coupling as the final design.
  Done when: TypeScript exposes one adapter contract that covers Discovery,
  BusSelection, BusGroups, BusMix, meters, writes, subscriptions, lifecycle,
  and cleanup.
  Tests: Type-only compile check plus focused contract fixture tests if useful.
  Gate: `yarn tsc` passes.

- [x] T-003: Add adapter factory and selection tests
  Reqs: REQ-005, REQ-010
  What: Implement `ConsoleAdapterFactory` and a small registry/selection
  mechanism for `demo` and `x32`, with predictable errors for unsupported
  explicit kinds.
  Where: `src/shared/console/ConsoleAdapterFactory.ts`,
  `src/shared/console/ConsoleAdapterRegistry.ts`,
  `__tests__/shared/console/ConsoleAdapterFactory.test.ts`.
  Depends on: T-002
  Reuses: `isMockConsoleIp`, `DEMO_CONSOLE_IP`, `DEV_MOCK_CONSOLE_IP`,
  discovered `ConsoleDevice.port`, and route-compatible `consoleIp` fallback.
  Done when: Factory returns demo adapter for demo/mock endpoints, X32 adapter
  for real/default endpoints, and an unsupported-console error for explicit
  unimplemented kinds.
  Tests: Focused factory tests.
  Gate: Factory does not instantiate WING runtime code.

- [x] T-004: Extract X32 protocol source definitions without behavior change
  Reqs: REQ-003, REQ-006, REQ-009
  What: Move or mirror BusMix CH/AUX/FX source definitions and path selection
  into X32 adapter-owned protocol helpers while proving path parity with the
  current `X32Protocol`.
  Where: `src/shared/console/adapters/x32/X32SourceDefinitions.ts`,
  `src/shared/console/adapters/x32/X32ConsoleProtocol.ts`,
  existing `src/shared/osc/X32Protocol.ts` if needed.
  Depends on: T-002
  Reuses: current `SOURCE_DEFINITIONS`, `X32Protocol`, bus/channel link helper
  modules, meter decoder helpers.
  Done when: Current CH/AUX/FX/BUS/DCA path outputs are unchanged and reusable
  by X32 adapter methods.
  Tests: Focused X32 protocol/source definition tests plus existing
  `__tests__/shared/osc/X32Protocol.test.ts`.
  Gate: No feature service behavior changes in this task.

- [x] T-005: Implement X32 adapter for connection, buses, and discovery parity
  Reqs: REQ-001, REQ-002, REQ-003, REQ-005, REQ-007
  What: Implement the X32 adapter lifecycle and bus-facing methods, preserving
  port `10023`, `/info`, `/xremote`, bus name/color fallback, and stereo bus
  link collapse.
  Where: `src/shared/console/adapters/x32/X32Adapter.ts`,
  `src/features/busSelection/services/BusService.ts` only if a compatibility
  facade is introduced in the same task.
  Depends on: T-003, T-004
  Reuses: `OscClient`, `SharedOscClient`, `NetworkScanner`, `X32Protocol`,
  `fetchBusStereoLinkMap`, `normalizeStereoBusName`.
  Done when: X32 adapter can connect, disconnect, keep alive, load buses, and
  return the same bus list shape as current `BusService`.
  Tests: X32 adapter bus tests and existing BusSelection-related tests if
  present.
  Gate: Demo and current real X32 discovery behavior are not changed yet unless
  covered by tests.

- [x] T-006: Implement X32 adapter BusMix methods
  Reqs: REQ-001, REQ-002, REQ-003, REQ-006, REQ-007
  What: Move BusMix channel loading/control/subscription behavior behind
  X32Adapter while preserving `/node` response-mode detection, fallback,
  channel cache behavior, exact-address fader/on/pan listeners, CH/AUX/FX path
  mapping, and meter stream ownership.
  Where: `src/shared/console/adapters/x32/X32Adapter.ts`,
  adapter helpers under `src/shared/console/adapters/x32`, and
  `src/features/busMix/services/BusMixService.ts` as a compatibility facade.
  Depends on: T-005
  Reuses: current `BusMixService` algorithms, `ChannelStructureCache`,
  `meterStreamRouting`, `meterDecoder`, `linkedChannelSync` behavior.
  Done when: `BusMixService` can delegate real-console behavior to the adapter
  without changing its public methods used by hooks.
  Tests: X32 adapter BusMix tests, `yarn jest __tests__/features/busMix --runInBand`.
  Gate: Do not reintroduce `subscribeScalarValue`,
  `useBusMixRemoteFaderSubscription`, broad scalar subscriptions, or fader
  coalescing rollback targets.

- [x] T-007: Implement X32 adapter BusGroups methods
  Reqs: REQ-001, REQ-002, REQ-003, REQ-006, REQ-007
  What: Move BusGroups master/DCA/MCA read/write/subscription behavior behind
  X32Adapter while preserving `/meters/2` Bus Master meter renewal and existing
  heartbeat lifecycle.
  Where: `src/shared/console/adapters/x32/X32Adapter.ts`,
  adapter helpers under `src/shared/console/adapters/x32`, and
  `src/features/busGroups/services/X32BusGroupsService.ts` as a compatibility
  facade.
  Depends on: T-005
  Reuses: current `X32BusGroupsService`, `decodeMeter2BlobForBusMaster`,
  `McaChannelFaderService` integration points, DCA assignment bitmask logic.
  Done when: BusGroups can load initial state, subscribe to DCA/master changes,
  write DCA/master values, and receive Bus Master meter values through the
  adapter.
  Tests: X32 adapter BusGroups tests, `yarn jest __tests__/features/busGroups --runInBand`.
  Gate: Navigating to BusMix and back does not leave stale master meter state
  in automated hook tests or manual UAT.

- [x] T-008: Implement Demo adapter
  Reqs: REQ-004, REQ-005
  What: Wrap or migrate current mock/demo provider behavior into
  `DemoConsoleAdapter` so demo satisfies the same adapter contract as X32.
  Where: `src/shared/console/adapters/demo/DemoConsoleAdapter.ts`,
  `src/shared/mixer/mock/*` if minimal adapter-facing changes are needed.
  Depends on: T-002, T-003
  Reuses: `MockMixerProvider`, `demoMixerProvider`, existing demo constants,
  current simulated meters and subscriptions.
  Done when: Demo discovery, buses, BusGroups, BusMix, writes, and subscriptions
  work through the adapter contract.
  Tests: Demo adapter tests and focused BusMix/BusGroups demo-path tests.
  Gate: Demo console remains visible and usable without network access.

- [x] T-009: Rewire ConsoleDiscovery through adapter-aware endpoint metadata
  Reqs: REQ-001, REQ-002, REQ-005, REQ-010
  What: Ensure discovered and demo devices carry enough endpoint metadata for
  the factory while preserving current navigation compatibility.
  Where: `src/features/consoleDiscovery/types/ConsoleDevice.ts`,
  `src/features/consoleDiscovery/services/ConsoleDiscoveryService.ts`,
  `src/shared/network/NetworkScanner.ts` only if metadata needs to be added at
  parse time.
  Depends on: T-003, T-005, T-008
  Reuses: current `ConsoleDevice` fields, current route params, current `/info`
  scanner behavior.
  Done when: Discovery can produce adapter-selectable endpoints without
  breaking screens that only know `consoleIp`, `consoleName`, and current
  fields.
  Tests: NetworkScanner tests, ConsoleDiscovery service tests if added.
  Gate: No WING discovery runtime code is added.

- [x] T-010: Rewire BusSelection service as compatibility facade
  Reqs: REQ-001, REQ-002, REQ-003, REQ-009
  What: Update `BusService` to obtain an adapter through the factory and
  delegate connect/disconnect/getBuses while keeping its public API stable for
  `useBusSelection`.
  Where: `src/features/busSelection/services/BusService.ts`,
  `__tests__/features/busSelection` if added.
  Depends on: T-005, T-008, T-009
  Reuses: existing hook/screen contracts and bus shape.
  Done when: `useBusSelection` does not need protocol-specific changes and bus
  loading behavior is unchanged.
  Tests: `yarn tsc`, focused BusService tests if present/added.
  Gate: Linked stereo bus collapse remains covered.

- [x] T-011: Rewire BusMix service as compatibility facade
  Reqs: REQ-001, REQ-002, REQ-003, REQ-007, REQ-009
  What: Update `BusMixService` to delegate connection, channel loading, writes,
  realtime listeners, and meter subscriptions to the adapter while preserving
  public methods used by `useBusMix` and `useMeterSubscription`.
  Where: `src/features/busMix/services/BusMixService.ts`,
  `src/features/busMix/hooks/useBusMix.ts` only if dependency injection needs
  endpoint metadata.
  Depends on: T-006, T-008, T-010
  Reuses: existing BusMix hooks, store, preset service, channel cache, and
  fader local-protection behavior.
  Done when: BusMix UI and hooks are protocol-agnostic at their service
  boundary and receive the same channel state as before.
  Tests: `yarn jest __tests__/features/busMix --runInBand`.
  Gate: Presets, fader drag/release writes, mute/on, pan, linked visual
  behavior, CH/AUX/FX meters, and background fader sync are unchanged.

- [x] T-012: Rewire BusGroups service as compatibility facade
  Reqs: REQ-001, REQ-002, REQ-003, REQ-007, REQ-009
  What: Update `X32BusGroupsService` or introduce a neutral
  `BusGroupsConsoleService` facade that delegates adapter methods while keeping
  `useBusGroups` behavior stable.
  Where: `src/features/busGroups/services/X32BusGroupsService.ts` and/or a new
  neutral service file, `src/features/busGroups/hooks/useBusGroups.ts` only if
  constructor naming/dependency injection changes.
  Depends on: T-007, T-008, T-010
  Reuses: current hook state, secure store service, MCA calculations, focus
  pause/resubscribe behavior.
  Done when: BusGroups no longer depends directly on X32 protocol code at the
  feature boundary.
  Tests: `yarn jest __tests__/features/busGroups --runInBand`.
  Gate: MCA assignment persistence and Bus Master meter focus resubscribe
  remain unchanged.

- [x] T-013: Remove duplicate mock/protocol branching from feature services
  Reqs: REQ-004, REQ-006, REQ-009
  What: After facades are green, delete redundant `useMockProvider` and direct
  `X32Protocol`/`OscClient` branches from feature services where the adapter
  now owns those decisions.
  Where: `BusService`, `BusMixService`, `X32BusGroupsService` or replacement
  neutral facades.
  Depends on: T-010, T-011, T-012
  Reuses: adapter tests created earlier.
  Done when: feature services are thin app-level facades and protocol branching
  lives under `src/shared/console/adapters/*`.
  Tests: TypeScript plus all focused feature adapter tests.
  Gate: No unrelated refactors or visual changes are included.

- [x] T-014: Add future WING placeholder documentation only
  Reqs: REQ-010
  What: Add a README or design note under the future WING adapter folder
  documenting known protocol differences and implementation preconditions.
  Where: `src/shared/console/adapters/wing/README.md`.
  Depends on: T-002
  Reuses: external research in `context.md`.
  Done when: Future implementers can see the intended location and constraints
  without any active WING runtime behavior.
  Tests: Documentation review.
  Gate: No exported `WingAdapter` class, no WING factory registration, and no
  WING discovery path is active.

- [x] T-015: Add adapter boundary guardrails
  Reqs: REQ-006, REQ-011
  What: Add tests or static checks that make accidental feature-level imports
  of X32 protocol/network internals harder after migration.
  Where: `__tests__/shared/console/*` and/or a lightweight script under
  `scripts/*`.
  Depends on: T-013
  Reuses: existing Jest/`rg` guardrail style from i18n work.
  Done when: New feature code can be checked for direct imports from
  `@shared/osc/X32Protocol`, `@shared/osc/OscClient`, or adapter internals
  unless explicitly allowlisted.
  Tests: Focused guardrail test/script.
  Gate: Guardrail does not false-positive on adapter implementation files or
  legacy tests that intentionally validate X32 protocol helpers.

- [x] T-016: Run automated regression gates
  Reqs: REQ-003, REQ-004, REQ-007, REQ-008, REQ-011
  What: Run the project gates most relevant to adapter migration and document
  any pre-existing failures separately.
  Where: whole repo.
  Depends on: T-015
  Reuses: `.specs/codebase/TESTING.md`.
  Done when: TypeScript and focused suites pass, or failures are documented as
  pre-existing with evidence.
  Tests: `yarn tsc`,
  `yarn jest __tests__/shared/console --runInBand`,
  `yarn jest __tests__/shared/osc --runInBand`,
  `yarn jest __tests__/shared/network --runInBand --testTimeout=10000`,
  `yarn jest __tests__/features/busMix --runInBand`,
  `yarn jest __tests__/features/busGroups --runInBand`.
  Gate: No regression in current X32/M32, demo, BusMix, BusGroups, OSC, or
  network behavior.

- [ ] T-017: Manual Demo and real X32/M32 UAT
  Reqs: REQ-002, REQ-003, REQ-004, REQ-007, REQ-011
  What: Validate current user workflows after the adapter migration.
  Where: iOS/Android simulator/device for Demo; physical X32/M32 network for
  real-console validation.
  Depends on: T-016
  Reuses: existing manual UAT checklist style in `.specs/codebase/TESTING.md`.
  Done when: Discovery, BUS selection, BusGroups, BusMix, faders, mutes, pans,
  meters, presets, local MCA persistence, and navigation between screens are
  checked.
  Tests: Manual UAT notes with device/console/firmware details.
  Gate: Current working X32/M32 behavior is accepted by user validation.

- [x] T-018: Update project docs and logs
  Reqs: REQ-005, REQ-006, REQ-010, REQ-011
  What: Update architecture/integrations/testing docs and create an
  implementation log after the refactor lands.
  Where: `.specs/project/STATE.md`, `.specs/codebase/ARCHITECTURE.md`,
  `.specs/codebase/INTEGRATIONS.md`, `.specs/codebase/STRUCTURE.md`,
  `.specs/codebase/TESTING.md`, `logs/YYYY-MM-DD_*`.
  Depends on: T-017
  Reuses: current logs/spec memory conventions.
  Done when: Future maintainers can understand the adapter boundary, current
  supported adapters, future WING extension point, and verification history.
  Tests: Documentation review and `git diff --check`.
  Gate: Docs match final implementation behavior.

## Implementation Notes

- Implemented 2026-06-14.
- Added `src/shared/console` with `IConsoleAdapter`, `ConsoleAdapterFactory`,
  endpoint/kind types, `DemoConsoleAdapter`, and `X32Adapter`.
- `BusService`, `BusMixService`, `X32BusGroupsService`, and
  `useMeterSubscription` now consume the adapter boundary while keeping their
  existing public APIs stable for hooks/screens.
- Added optional `adapterKind` metadata to discovered/demo `ConsoleDevice`
  values. Existing route params remain compatible.
- Added future WING documentation only under
  `src/shared/console/adapters/wing/README.md`; no WING runtime adapter is
  registered.
- Automated gates passed for TypeScript, shared console tests, BusMix,
  BusGroups, shared OSC, shared network, and the i18n hardcoded-copy guard.
- Manual Demo/runtime UAT and real X32/M32 hardware UAT remain pending.
- SPEC_DEVIATION: `ConsoleAdapterRegistry.ts` was not added because the initial
  runtime selection is a small explicit factory switch for `demo` and `x32`;
  adding a registry now would add indirection without additional adapter
  implementations.
