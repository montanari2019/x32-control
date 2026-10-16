# Context - Master Fader Drag Stability

Date: 2026-10-15

User report (pt-BR, paraphrased): on iOS the master fader on Personal Mix
Grupos is too sensitive to touch and scroll; on Android it is not, but while
dragging it stutters as if guessing the final value, and the whole fader
(thumb and ruler) shakes. Android phone is connected to the PC and to the real
console.

Files read: `VerticalGroupFader.tsx`, `MasterStrip.tsx`, `BusGroupsScreen.tsx`,
`useBusGroups.ts` (setMasterFader, meter, remote handlers), `useOscSubscription.ts`,
`X32BusGroupsService.ts`, BusMix `VerticalFader.tsx` (comparison), `audio.ts`.

Comparison with BusMix `VerticalFader`: no hit-test gate (`() => true`), same
`translateY` thumb, local protection window of 250 ms in `useBusMix`.

Hypothesis status: all unproven (see spec). Device `7b877dc7` is attached via adb.
Do not implement before T-001/T-002 evidence.
