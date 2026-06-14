# X32 Adapter File Decomposition Tasks

Date: 2026-06-14
Status: implemented

## Task List

- [x] T-001: Capture adapter baseline and public API
  Reqs: REQ-001, REQ-002, REQ-008
  What: Document current exports, constructor signature, public methods,
  helper exports, file size, imports, and tests before moving code.
  Where: `src/shared/console/adapters/x32/X32Adapter.ts`,
  `src/shared/console/ConsoleAdapterFactory.ts`, `__tests__/shared/console`.
  Depends on: none
  Reuses: `context.md` current observations.
  Done when: Implementation has a checklist of exports/methods that must remain
  compatible.
  Tests:
  ```sh
  wc -l src/shared/console/adapters/x32/X32Adapter.ts
  rg -n "export class X32Adapter|export const isChannelInDca|async |subscribe|set|get|load|fetch" src/shared/console/adapters/x32/X32Adapter.ts
  ```
  Gate: No runtime edits before baseline is captured.

- [x] T-002: Create `X32Adapter/` folder and move constants/types/helpers
  Reqs: REQ-003, REQ-004, REQ-005
  What: Create the folder named after the file and extract constants plus pure
  OSC parsing helpers into focused modules.
  Where:
  - `src/shared/console/adapters/x32/X32Adapter/X32AdapterConstants.ts`
  - `src/shared/console/adapters/x32/X32Adapter/x32OscValueUtils.ts`
  Depends on: T-001
  Reuses: current constants and helper implementations.
  Done when: Helper modules compile and root adapter behavior is unchanged.
  Tests:
  ```sh
  npx tsc --noEmit --pretty false
  ```
  Gate: No public import path changes.

- [x] T-003: Add focused tests for extracted pure helpers
  Reqs: REQ-005
  What: Add tests for OSC value parsing and `/node` response parsing before
  moving the node client logic.
  Where: `__tests__/shared/console/x32OscValueUtils.test.ts` or equivalent.
  Depends on: T-002
  Reuses: existing `/node` parsing behavior from `X32Adapter.ts`.
  Done when: Tests cover string splitting with quotes, node echo detection,
  numeric parsing fallback, and blob argument detection.
  Tests:
  ```sh
  npx jest __tests__/shared/console --runInBand
  ```
  Gate: Tests pass before extracting `/node` request orchestration.

- [x] T-004: Extract BusGroups utilities
  Reqs: REQ-001, REQ-003, REQ-005
  What: Move `isChannelInDca` and assigned-channel construction into a
  BusGroups utility module while preserving public re-export from root
  `X32Adapter.ts`.
  Where: `src/shared/console/adapters/x32/X32Adapter/x32BusGroupsUtils.ts`.
  Depends on: T-002
  Reuses: current helper code.
  Done when: `X32BusGroupsService` and tests can still import
  `isChannelInDca` from the public adapter path.
  Tests:
  ```sh
  npx jest __tests__/features/busGroups/services/X32BusGroupsService.test.ts --runInBand
  npx jest __tests__/shared/console --runInBand
  ```
  Gate: Public export compatibility is preserved.

- [x] T-005: Extract connection lifecycle module
  Reqs: REQ-002, REQ-003, REQ-008
  What: Move connect/disconnect/heartbeat behavior into a lifecycle module with
  explicit access to adapter context.
  Where:
  - `src/shared/console/adapters/x32/X32Adapter/X32AdapterContext.ts`
  - `src/shared/console/adapters/x32/X32Adapter/X32ConnectionLifecycle.ts`
  Depends on: T-002
  Reuses: `OscClient`, `SharedOscClient`, `X32Protocol.defaultPort`.
  Done when: shared lease behavior, injected-client behavior, and heartbeat
  behavior are unchanged.
  Tests:
  ```sh
  npx jest __tests__/shared/console/ConsoleAdapterFactory.test.ts --runInBand
  npx tsc --noEmit --pretty false
  ```
  Gate: Do not change shared lease timing or cleanup.

- [x] T-006: Extract BUS adapter module
  Reqs: REQ-002, REQ-003
  What: Move BUS loading, bus color parsing, and stereo BUS link collapse into
  a focused module.
  Where: `src/shared/console/adapters/x32/X32Adapter/X32BusAdapter.ts`.
  Depends on: T-005
  Reuses: `fetchBusStereoLinkMap`, `getCachedBusStereoLinkMap`,
  `setCachedBusStereoLinkMap`, `normalizeStereoBusName`, default BUS names.
  Done when: `X32Adapter.getBuses()` delegates to the BUS module and returns
  the same `Bus[]` shape.
  Tests:
  ```sh
  npx jest __tests__/shared/console --runInBand
  npx tsc --noEmit --pretty false
  ```
  Gate: Linked odd/even BUS collapse behavior is unchanged.

- [x] T-007: Extract `/node` client module
  Reqs: REQ-002, REQ-003, REQ-005
  What: Move response-mode detection, request chaining, echo/direct request
  handling, retry, and timeout behavior into `X32NodeClient`.
  Where: `src/shared/console/adapters/x32/X32Adapter/X32NodeClient.ts`.
  Depends on: T-003, T-005
  Reuses: extracted `x32OscValueUtils`.
  Done when: BusMix bulk loading can use `X32NodeClient` without changing
  fallback behavior.
  Tests:
  ```sh
  npx jest __tests__/features/busMix --runInBand
  npx jest __tests__/shared/console --runInBand
  ```
  Gate: `/node` no-echo serialization and echo matching remain unchanged.

- [x] T-008: Extract channel cache helpers
  Reqs: REQ-002, REQ-003
  What: Move cached-structure dynamic reload and save mapping into a cache
  helper module.
  Where: `src/shared/console/adapters/x32/X32Adapter/X32ChannelCache.ts`.
  Depends on: T-007
  Reuses: `ChannelStructureCache`, `CachedChannelStructure`,
  `X32SourceDefinitions`, node value parsers.
  Done when: `loadChannelsWithCache` behavior and cache key ownership remain
  unchanged.
  Tests:
  ```sh
  npx jest __tests__/features/busMix --runInBand
  npx tsc --noEmit --pretty false
  ```
  Gate: No storage key migration or cache invalidation behavior change.

- [x] T-009: Extract BusMix adapter module
  Reqs: REQ-002, REQ-003, REQ-005
  What: Move BusMix channel loading, fallback loading, channel link map, fader
  reads/writes, and fader/on/pan subscriptions into a module.
  Where: `src/shared/console/adapters/x32/X32Adapter/X32BusMixAdapter.ts`.
  Depends on: T-007, T-008
  Reuses: `X32SourceDefinitions`, `X32NodeClient`, `X32ChannelCache`,
  `x32OscValueUtils`.
  Done when: public `X32Adapter` delegates BusMix methods to the module.
  Tests:
  ```sh
  npx jest __tests__/features/busMix --runInBand
  npx jest __tests__/shared/console --runInBand
  ```
  Gate: Exact-address receive model and background fader sync compatibility
  remain unchanged.

- [x] T-010: Extract BusGroups adapter module
  Reqs: REQ-002, REQ-003
  What: Move BusGroups initial state loading, DCA/master writes, and DCA/master
  scalar subscriptions into a module.
  Where: `src/shared/console/adapters/x32/X32Adapter/X32BusGroupsAdapter.ts`.
  Depends on: T-004, T-005
  Reuses: `x32BusGroupsUtils`, DCA constants, MCA color tokens, safe request
  helpers.
  Done when: public `X32Adapter` delegates BusGroups methods to the module.
  Tests:
  ```sh
  npx jest __tests__/features/busGroups --runInBand
  npx jest __tests__/shared/console --runInBand
  ```
  Gate: DCA assignment bitmask behavior remains unchanged.

- [x] T-011: Extract meter subscription module
  Reqs: REQ-002, REQ-003, REQ-008
  What: Move channel meter and Bus Master meter subscription state/cleanup into
  a dedicated module.
  Where: `src/shared/console/adapters/x32/X32Adapter/X32MeterSubscriptions.ts`.
  Depends on: T-005
  Reuses: `dispatchMeterStreamBlob`, meter routing helpers,
  `decodeMeter2BlobForBusMaster`, `getBlobArg`.
  Done when: `subscribeMeter` and `subscribeBusMasterMeter` delegate to the
  meter module.
  Tests:
  ```sh
  npx jest __tests__/features/busMix/hooks/useMeterSubscription.test.ts --runInBand
  npx jest __tests__/features/busGroups/services/X32BusGroupsService.test.ts --runInBand
  npx jest __tests__/features/busMix --runInBand
  npx jest __tests__/features/busGroups --runInBand
  ```
  Gate: `/meters/1`, `/meters/13`, and `/meters/2` ownership and cleanup remain
  unchanged.

- [x] T-012: Make root `X32Adapter.ts` a thin public entrypoint
  Reqs: REQ-001, REQ-004, REQ-006
  What: Move the implementation class into `X32Adapter/X32Adapter.ts` and make
  the root file re-export only the public class/helper.
  Where:
  - `src/shared/console/adapters/x32/X32Adapter.ts`
  - `src/shared/console/adapters/x32/X32Adapter/X32Adapter.ts`
  Depends on: T-006, T-009, T-010, T-011
  Reuses: public import path used by `ConsoleAdapterFactory`.
  Done when: root `X32Adapter.ts` is under 100 lines and all public imports
  still compile.
  Tests:
  ```sh
  wc -l src/shared/console/adapters/x32/X32Adapter.ts
  npx tsc --noEmit --pretty false
  ```
  Gate: Public import path remains stable.

- [x] T-013: Run full adapter regression gates
  Reqs: REQ-002, REQ-005, REQ-006, REQ-007, REQ-008
  What: Run the full set of automated checks relevant to this refactor.
  Where: whole repo.
  Depends on: T-012
  Reuses: `.specs/codebase/TESTING.md`.
  Done when: All focused suites pass, or failures are documented as
  pre-existing with evidence.
  Tests:
  ```sh
  npx tsc --noEmit --pretty false
  npx jest __tests__/shared/console --runInBand
  npx jest __tests__/features/busMix --runInBand
  npx jest __tests__/features/busGroups --runInBand
  npx jest __tests__/shared/osc --runInBand
  npx jest __tests__/shared/network --runInBand --testTimeout=10000
  git diff --check
  ```
  Gate: No X32/M32, Demo, BusMix, BusGroups, OSC, network, or adapter-boundary
  regression.

- [x] T-014: Update docs/logs after implementation
  Reqs: REQ-004, REQ-005, REQ-008
  What: Update local `STATE.md`, this task file, global docs if needed, and a
  log entry after implementation.
  Where:
  - `src/shared/console/adapters/x32/.specs/STATE.md`
  - `src/shared/console/adapters/x32/.specs/feature/x32-adapter-file-decomposition/tasks.md`
  - `.specs/codebase/STRUCTURE.md` if file structure changes need recording
  - `logs/YYYY-MM-DD_*`
  Depends on: T-013
  Reuses: current docs/log conventions.
  Done when: Future maintainers can understand the new X32 adapter file layout
  and verification history.
  Tests:
  ```sh
  git diff --check
  ```
  Gate: Docs match final implementation.

## Implementation Notes

- Root `src/shared/console/adapters/x32/X32Adapter.ts` is now a 3-line public
  entrypoint that re-exports `X32Adapter` and `isChannelInDca`.
- The implementation class now lives in
  `src/shared/console/adapters/x32/X32Adapter/X32Adapter.ts` and delegates to
  focused modules for lifecycle, BUS, BusMix, BusGroups, meters, `/node`, cache,
  constants, and pure OSC value helpers.
- Public import compatibility is preserved for `ConsoleAdapterFactory` and
  `X32BusGroupsService`.
- Automated regression passed on 2026-06-14:
  - `npx tsc --noEmit --pretty false`
  - `npx jest __tests__/shared/console --runInBand`
  - `npx jest __tests__/features/busMix --runInBand`
  - `npx jest __tests__/features/busGroups --runInBand`
  - `npx jest __tests__/shared/osc --runInBand`
  - `npx jest __tests__/shared/network --runInBand --testTimeout=10000`
- Real X32/M32 hardware UAT remains pending for UDP timing, meter ownership,
  and subscription cleanup in the physical console environment.
