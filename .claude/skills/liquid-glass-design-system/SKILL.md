---
name: liquid-glass-design-system
description: "Documents an Apple Liquid Glass–inspired translucent material system adapted for this project's dark console/mixer UI: concentric radii, specular highlight, adaptive tint, layered glass surfaces, motion rules, and performance guidance for real-time meters/faders. Use when creating or upgrading panels, cards, modals, toolbars, headers, or floating controls to a glass aesthetic, or when deciding whether a surface should use true blur vs. faux-glass."
---

# Liquid Glass Design System

## Summary

Apple introduced **Liquid Glass** (iOS 26 / iPadOS 26 / macOS Tahoe) as the successor to the old
frosted-blur material: a dynamic, translucent material that refracts and reflects the content behind
it, reacts to light, and morphs continuously between states. React Native has no native refraction/
lensing pipeline, so this skill defines a **faux-glass adaptation** built from tokens, layered views,
and an SVG specular highlight — no new native dependency required by default.

This project already has a seed of the idea: `colors.surface.glassOverlay` and the overlay pattern in
[src/features/busSelection/components/BusCard.tsx](src/features/busSelection/components/BusCard.tsx).
This skill formalizes and extends that pattern into a reusable system.

## Apple Liquid Glass — Core Principles

- **Material, not just blur.** Glass lightens/darkens and shifts based on what's behind and beneath it
  (light vs. dark content), instead of a fixed frosted look.
- **Concentricity.** Corner radii nest: an inner element's radius equals the outer radius minus the
  padding between them, so both curves share the same center. Nothing floats with a mismatched corner.
- **Layering.** Glass sits in a distinct control layer above content (toolbars, tab bars, sheets,
  floating actions) — it separates chrome from content, it does not replace content surfaces.
  Never stack two glass layers on top of each other ("glass-on-glass" kills legibility).
  This mirrors the existing token comment: only one translucent layer per surface.
- **Specular highlight.** A thin, directional light-catching highlight traces the top edge of the
  glass, implying a physical light source.
- **Legibility first.** Text/icons on glass get a scrim or shadow when contrast would otherwise break;
  glass is dialed back over busy/high-contrast content.
- **Continuous motion.** Shape and elevation morph fluidly with gestures/presses rather than snapping
  between discrete states.

## Adaptation for This Project — Constraints & Decisions

- Bare React Native 0.78, no Expo. **No blur library is installed** (`@react-native-community/blur`
  is not a dependency). Default pattern below uses **no new native dependency** — only
  `react-native-svg` (already installed) plus `View`/`StyleSheet`/`Animated`.
- This app renders **real-time meters and faders at high frequency**. True backdrop blur re-composited
  every frame is expensive, especially on Android. Rule: **blur/glass is for chrome, never for
  live-updating audio surfaces.**
- The palette is already dark and low-chroma (`src/theme/tokens.colors.ts`), which is exactly the kind
  of background Liquid Glass reads well against — lean into existing `surface.*` and `border.*` tokens
  rather than inventing a parallel palette.

## Where To Apply / Where Not To

Apply glass to:

- Cards and list items (extend the `BusCard` pattern)
- Modals, dialogs, sheets — [src/shared/components/Dialog/index.tsx](src/shared/components/Dialog/index.tsx),
  [src/shared/components/Modal/](src/shared/components/Modal/)
- Headers, toolbars, floating action buttons, bottom bars
- Toast — [src/shared/components/Toast/](src/shared/components/Toast/)

Do **not** apply glass to:

- Fader tracks/thumbs, meter bars, numeric readouts (`fader.*`, `meter.*` tokens) — keep these flat and
  crisp; legibility and frame budget matter more than aesthetics there.
- A surface already sitting on another glass surface (no nested translucency).
- Any view inside a `FlatList`/scroll list item that re-renders on every scroll frame, unless the glass
  layer is memoized and static (no blur recompute per frame).

## Core Pattern

### 1. Tokens — `src/theme/tokens.glass.ts`

```ts
export const glass = {
  tint: {
    subtle: 'rgba(255, 255, 255, 0.03)', // matches existing surface.glassOverlay
    regular: 'rgba(255, 255, 255, 0.06)',
    heavy: 'rgba(255, 255, 255, 0.10)',
  },
  edge: {
    highlight: 'rgba(255, 255, 255, 0.16)', // top specular border
    shade: 'rgba(0, 0, 0, 0.22)', // bottom edge, implies depth
  },
  specular: {
    from: 'rgba(255, 255, 255, 0.14)',
    to: 'rgba(255, 255, 255, 0)',
  },
};
```

Re-export following the existing convention in
[src/shared/theme/colors.ts](src/shared/theme/colors.ts):

```ts
// src/shared/theme/glass.ts
export { glass } from '../../theme/tokens.glass';
```

### 2. Concentric radius helper

```ts
// src/shared/theme/concentricRadius.ts
export const concentricRadius = (outerRadius: number, padding: number): number =>
  Math.max(outerRadius - padding, 0);
```

Use it whenever an inner element (icon chip, inner card, badge) sits inside a glass container with
padding — never hardcode the inner radius independently of the outer one.

### 3. `GlassSurface` component — `src/shared/components/GlassSurface/index.tsx`

```tsx
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { glass } from '@shared/theme/glass';
import { radius } from '@shared/theme/radius';

type GlassSurfaceProps = {
  children?: ReactNode;
  tint?: keyof typeof glass.tint;
  cornerRadius?: number;
  style?: ViewStyle;
};

export const GlassSurface = ({
  children,
  tint = 'regular',
  cornerRadius = radius.lg,
  style,
}: GlassSurfaceProps): JSX.Element => (
  <View style={[styles.container, { borderRadius: cornerRadius }, style]}>
    <View
      pointerEvents="none"
      style={[styles.tint, { backgroundColor: glass.tint[tint], borderRadius: cornerRadius }]}
    />
    <View pointerEvents="none" style={styles.specularWrapper}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="specular" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={glass.specular.from} />
            <Stop offset="1" stopColor={glass.specular.to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="40%" fill="url(#specular)" />
      </Svg>
    </View>
    <View pointerEvents="none" style={[styles.edgeHighlight, { borderRadius: cornerRadius }]} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderColor: glass.edge.shade,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  edgeHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderColor: glass.edge.highlight,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  specularWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
});
```

This is the same layering idea already used in `BusCard` (`glassOverlay` as an absolute-fill sibling
view painted before the content), extended with a top specular gradient and a two-tone border to fake
the light-catching edge that real Liquid Glass renders via refraction.

### 4. Optional true blur (opt-in, not installed)

For **static** chrome only (e.g. a modal backdrop, a settings sheet) you may later add
`@react-native-community/blur` and wrap `GlassSurface`'s tint layer with a `<BlurView>` behind it.
This requires a native rebuild (`pod install` / Gradle sync) — treat it as a separate, deliberate step,
not a default. Never wrap anything that re-renders on meter/fader updates.

## Motion & Morphing

Follow the existing `Animated` press pattern from `BusCard.tsx` / `Dialog/index.tsx` (no Reanimated
installed): animate `scale`/`opacity`/`translateY` with `useNativeDriver: true`. When a glass surface
expands (e.g. a card becoming a sheet), animate scale and opacity together rather than snapping the
`borderRadius`, so the transition reads as one continuous shape.

## Implementation Steps

1. Add `src/theme/tokens.glass.ts` and its `src/shared/theme/glass.ts` re-export.
2. Add `src/shared/theme/concentricRadius.ts`.
3. Create `src/shared/components/GlassSurface/index.tsx` per the pattern above.
4. Migrate `BusCard`'s inline `glassOverlay` View to `GlassSurface` (or leave it — both are valid,
   `GlassSurface` is the richer version for new chrome-level surfaces).
5. Apply `GlassSurface` to modals/dialogs/toolbars/toasts one at a time, checking contrast in the
   existing dark theme before shipping.
6. Never apply it to fader/meter surfaces (see Where Not To Apply).

## Conventions to Follow

- Only one glass layer per surface; never nest glass inside glass.
- Always pair a glass tint with the edge highlight/shade pair — a flat translucent fill alone is not
  "glass," it's just an overlay.
- Derive inner radii from `concentricRadius`, never hardcode a second radius value near a glass edge.
- Keep glass tokens in `glass.*`; do not duplicate alpha values as inline strings in components.
- Reuse `radius`/`spacing`/`colors` tokens for everything else inside a `GlassSurface` — glass only
  changes the background/edge treatment, not the rest of the design system.

## Pitfalls

- Using real blur on a view that sits above animated meters/faders — causes dropped frames, especially
  on Android.
- Stacking a `GlassSurface` inside another `GlassSurface` — reads as murky, not glassy.
- Pushing `tint` too high (`heavy` everywhere) — loses the "translucent" read and just looks like a
  gray box; reserve `heavy` for surfaces over the busiest backgrounds.
- Forgetting `overflow: 'hidden'` on the container — the specular `Rect` and gradient will bleed past
  rounded corners.
- Applying glass to text-heavy, high-contrast content without checking legibility in both the console
  screen background and modal backdrop contexts.

## Checklist

- Tint + edge highlight + edge shade all present (not just a flat overlay)
- `overflow: 'hidden'` set on the container
- Corner radius uses a theme `radius.*` value; inner radii use `concentricRadius`
- No glass layer applied to fader/meter/live-numeric surfaces
- No nested glass-on-glass
- Contrast checked against `colors.text.*` on top of the glass tint
- Press/expand motion uses `Animated` with `useNativeDriver: true`

## Prompt Seed

Aplique o padrão Liquid Glass deste projeto (skill `liquid-glass-design-system`) ao componente [X]:
crie/usa `GlassSurface` de `@shared/components/GlassSurface`, com tint apropriado (`subtle`/`regular`/
`heavy`), radius vindo de `@shared/theme/radius`, e sem aplicar blur real em superfícies com meters ou
faders. Garanta contraste do texto sobre o glass e evite glass-on-glass.

## References

- Apple Human Interface Guidelines — Materials: https://developer.apple.com/design/human-interface-guidelines/materials
