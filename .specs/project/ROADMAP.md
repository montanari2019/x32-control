# Tacimix Roadmap

Last updated: 2026-05-24

## Roadmap Philosophy

Tacimix should prioritize live reliability before breadth. Work should favor small, verifiable improvements that make the app safer on real devices and real X32/M32 consoles.

## Current Milestone: Stabilize Real-Device Operation

Status: active

Objective:

- Make iOS/Android real-device operation dependable enough for release validation.

Key outcomes:

- iPhone physical device can discover or connect to the console reliably.
- Manual IP fallback decision is resolved.
- App Store-facing iOS plist settings are justified.
- Network diagnostics are informative without noisy dev warnings.
- User-facing monitor workflow works in Demo and on a real X32/M32.

Candidate work:

- Reintroduce or explicitly reject manual IP UI in ConsoleDiscovery.
- Validate Local Network permission flow on iOS 14+ and current iOS.
- Confirm if multicast entitlement is required for target deployment.
- Confirm iPhone Wi-Fi/subnet behavior with a real X32 at known IP.
- Add UI affordance for network troubleshooting if discovery fails.
- Validate Info.plist `UIBackgroundModes=audio` against App Review needs.

## Milestone: Monitor Workflow Confidence

Status: planned

Objective:

- Prove the core musician workflow end-to-end.

Required validations:

- Select real console.
- Select mono BUS.
- Select stereo-linked BUS.
- Move BUS master.
- Toggle BUS master mute.
- Assign CH/AUX/FX sources to MCA.
- Move MCA and verify proportional source updates.
- Toggle MCA mute and verify assigned source mutes.
- Open BusMix from BusGroups.
- Move CH/AUX/FX send faders.
- Toggle CH/AUX/FX send mute/on.
- Adjust pan.
- Create, overwrite, delete, and restore preset.
- Confirm restored preset reaches the console.

Candidate work:

- Add a real-device UAT checklist in `.specs` once hardware validation starts.
- Add focused regression tests for any discovered X32/M32 behavior mismatch.
- Add runtime logging for meter blob size/indexing when debugging real meters.

## Milestone: Release Hardening

Status: planned

Objective:

- Prepare iOS and Android artifacts with predictable build, signing, metadata, and validation gates.

iOS work:

- Confirm `CURRENT_PROJECT_VERSION` and `MARKETING_VERSION`.
- Review `ITSAppUsesNonExemptEncryption=false`.
- Confirm Bonjour services are valid.
- Confirm background audio mode is required or remove it.
- Validate `PrivacyInfo.xcprivacy`.
- Validate physical device debug and release builds.

Android work:

- Confirm versionCode/versionName strategy.
- Validate develop/homolog/production flavors.
- Validate keystore property handling.
- Generate AAB/APK with scripts.

Shared release work:

- Run `yarn tsc`.
- Run `yarn test`.
- Run `yarn lint`.
- Update README and `.specs` after release-critical decisions.

## Milestone: Product Polish

Status: planned

Objective:

- Improve clarity and confidence for non-technical users.

Candidate work:

- Improve discovery empty state with network checklist.
- Consider manual IP entry or saved consoles.
- Add clearer preset restore feedback.
- Review portrait/landscape polish on common iPhone sizes.
- Audit text for encoding and Portuguese accent consistency.
- Clarify About versioning strategy.

## Milestone: Technical Debt Reduction

Status: planned

Objective:

- Reduce risk in shared networking, persistence, and documentation.

Candidate work:

- Rename `SecureStoreService` or back it with real secure storage.
- Automate app version display instead of hardcoded commit count.
- Decide whether root `src/theme/tokens.*` and `src/shared/theme/*` should both exist.
- Reduce duplicate modal skill/docs history and keep one canonical overlay doc.
- Add a formal UAT artifact for real-console validation.

## Deferred Ideas

- Saved console list.
- Manual IP profiles.
- Cloud or LAN sync for presets.
- More X32/M32 models/firmwares validation matrix.
- Scene/snippet integration.
- Channel naming/color editing.
- Full DCA assignment integration with console state.
- Multi-device coordination.

