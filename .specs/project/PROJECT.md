# Tacimix - Project Specification

Last updated: 2026-05-24

## Product Vision

Tacimix is a mobile-first personal monitor control app for Behringer X32 and Midas M32 digital consoles. It gives musicians, audio operators, and production teams a focused interface for selecting a console, choosing a monitor BUS, organizing local MCA-style groups, and controlling channel sends, mutes, pans, presets, and meters over OSC/UDP.

The product goal is not to replace the full X32/M32 console surface. Tacimix intentionally narrows the experience to fast, live-friendly monitor mixing on a phone, with enough reliability and feedback for real stage use.

## Current Product Shape

The app currently ships as a React Native mobile application named `Tacimix`, with bundle/application id `com.tacimix.app`.

Primary flow:

```txt
ConsoleDiscovery -> BusSelection -> BusGroups -> BusMix
                              \-> About
```

Functional surface:

- Console discovery over OSC/UDP `/info`.
- Always-visible Demo console for offline testing.
- BUS selection with X32/M32 bus names, colors, and stereo link awareness.
- BusGroups hub with BUS master and 8 MCA-style groups backed by DCA concepts.
- BusMix control for 48 send sources:
  - CH 01..32;
  - AUX 01..08;
  - FX 01..08.
- Fader, mute/on, and pan control for sends.
- Local presets per console and BUS.
- VU meters from X32/M32 meter blobs.
- Shared modal/dialog/toast system.
- iOS local-network discovery hardening.
- Android/iOS build scripts.

## Target Users

- Musicians adjusting in-ear or wedge monitor mixes.
- Band leaders who need fast access to groups of channels.
- Sound engineers setting up monitor mixes from a mobile device.
- Developers/maintainers extending X32/M32 OSC workflows.

## Core User Goals

- Find or select the correct X32/M32 console quickly.
- Choose the correct monitor BUS.
- Make broad mix changes using meaningful local groups.
- Fine-tune individual channel/AUX/FX sends.
- Store and recall personal monitor states.
- See signal activity without overloading the UI.
- Use the app on real phones in portrait or landscape.

## Non-Goals

- Full console replacement.
- Full scene/snippet management.
- Full routing matrix editing.
- Channel EQ, dynamics, gate, compressor, effects editing.
- Cloud sync for presets or MCA definitions.
- Multi-user collaboration or permissions.
- Long-lived background audio processing unless explicitly justified for app review.

## Success Criteria

Functional:

- A user can connect to a real X32/M32 on the same local network.
- A user can complete Demo flow without a physical console.
- BUS list matches the console enough for live use.
- BusGroups can control master and local MCA assignments.
- BusMix can control levels, mute/on, and pan for CH/AUX/FX sends.
- Presets can be created, overwritten, deleted, and restored locally.
- Meters show stable, believable signal activity for supported sources.

Reliability:

- UDP transport does not accumulate pending callbacks during normal use.
- Navigation between BusGroups and BusMix reuses connections without rapid socket churn.
- Local edits are protected from delayed OSC echo.
- Test suite covers OSC, network scanner, meters, presets, BusGroups calculations, and shared stores.

Release readiness:

- iOS build runs on simulator and physical devices.
- Android builds support develop/homolog/production flavors.
- README reflects current behavior.
- `.specs` docs stay current after material feature or architecture changes.

## Current App Identity

```txt
Package name: tacimix
App display name: Tacimix
iOS bundle id: com.tacimix.app
Android application id: com.tacimix.app
Current npm version: 1.0.0
```

About screen currently displays a commit-count-derived version based on `APP_COMMIT_VERSION = 44` in `src/features/about/screens/AboutScreen.tsx`.

## Platform Support

Primary:

- iOS physical devices.
- iOS Simulator for development.
- Android devices/emulators.

Important iOS details:

- Local Network permission is required.
- Bonjour service declaration uses `_osc._udp`.
- iOS discovery can require local Wi-Fi/VLAN correctness even when simulator works.
- Broadcast/multicast reliability may vary without Apple multicast entitlement.

Important Android details:

- UDP and Wi-Fi/multicast permissions are expected.
- Gradle flavors exist for develop, homolog, and production.

## Key Domain Concepts

Console:

- A Behringer X32 or Midas M32 endpoint reachable over UDP port `10023`.
- Identified via `/info`.
- Demo console is a local mock provider and not a network endpoint.

BUS:

- A monitor destination `1..16`.
- May be mono or part of a stereo-linked odd/even pair.
- Selected BUS defines the send target for BusGroups and BusMix.

BusGroups:

- Macro-control screen for a selected BUS.
- Includes BUS master and 8 MCA groups.
- Uses local assignment state per console.
- Uses DCA naming conceptually, but local MCAs can contain CH/AUX/FX send sources.

MCA:

- Local group of assigned channels/sources.
- Has local name, color token, assigned sources, computed fader value, and mute state.
- Movement applies proportional changes to assigned channel send levels.

BusMix:

- Detailed send mixer for a selected BUS.
- Contains 48 source strips.
- Maintains shared channel state that BusGroups can reuse.

Preset:

- Local snapshot of the BusMix state for one console and one BUS.
- Captures all current BusMix sources.
- Stored on-device.

Meter:

- Visual signal level derived from X32/M32 meter streams.
- `/meters/1` currently covers CH 01..32.
- `/meters/13` is used for AUX/FX source IDs `33..48`.

## Documentation System

Global persistent project memory:

```txt
.specs/project/
```

Brownfield codebase mapping:

```txt
.specs/codebase/
```

Quick ad-hoc task records:

```txt
.specs/quick/
```

Feature-local planning memory:

```txt
src/features/[feature]/.specs/
```

The workspace is a standalone React Native mobile app. Per user instruction and mobile placement rules, feature specs are co-located under each existing feature folder rather than placed under root `.specs/features`.

