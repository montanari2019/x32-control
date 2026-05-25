---
name: theme-tokens
description: "Documents token-based React Native theming patterns for colors, spacing, typography, radius, shadows, dark theme composition, and shared UI styling. Use when working on design tokens, theme files, visual consistency, or migrating components to project theme conventions."
---

# Theme Tokens and Theming

## Summary

This project uses a token-based theme with light and dark palettes. Tokens live in a dedicated folder and are composed into theme objects consumed by `useTheme`.

## Core Pattern

- Tokens are split by category: colors, spacing, typography, borders, shadows, opacities.
- Light and dark themes are composed from the same token sets plus per-theme brand colors.
- A ThemeProvider from `@callstack/react-theme-provider` provides `useTheme`.

## Reference Implementation

- Tokens: [src/theme/tokens/colors.ts](src/theme/tokens/colors.ts), [src/theme/tokens/spacings.ts](src/theme/tokens/spacings.ts), [src/theme/tokens/typography.ts](src/theme/tokens/typography.ts), [src/theme/tokens/borders.ts](src/theme/tokens/borders.ts), [src/theme/tokens/shadows.ts](src/theme/tokens/shadows.ts), [src/theme/tokens/opacities.ts](src/theme/tokens/opacities.ts)
- Theme objects: [src/theme/lightTheme.ts](src/theme/lightTheme.ts), [src/theme/darkTheme.ts](src/theme/darkTheme.ts)
- Theme API: [src/theme/index.ts](src/theme/index.ts), [src/theme/types.ts](src/theme/types.ts)

## Implementation Steps

1. Create token modules per category in a `theme/tokens` folder.
2. Define `BrandColorsType` and per-mode color maps.
3. Compose light and dark theme objects using the tokens.
4. Export `ThemeProvider` and `useTheme` from a single theme entry.
5. Wrap the app with `ThemeProvider` (see Providers skill).

## Conventions to Follow

- Keep tokens strongly typed and exported as `const` objects.
- Avoid inline colors or spacing values in components.
- Update both light and dark palettes when adding new colors.
- Typography variants should map to a limited set of sizes and weights.

## Example Snippets

```ts
// theme/tokens/colors.ts (pattern)
export type BrandColorsType = GlobalColorsType & {
  primaryBase: string;
  secondaryBase: string;
};

export const GlobalLightColors: GlobalColorsType = {
  neutralBaseBackground: '#FFFFFF',
};
```

```ts
// theme/index.ts (pattern)
export const { useTheme, ThemeProvider } = createTheming<AppThemeType>(LightTheme);
```

## Pitfalls

- Adding a color to light theme but not dark theme breaks parity.
- Using raw hex values in components makes theming harder.

## Checklist

- Token file updated
- Light and dark theme updated
- Types updated
- Components use `useTheme` or themed props

## Prompt Seed

Create a token-based theme system with light/dark palettes, typed tokens, and a `useTheme` hook. Follow the file structure and conventions described in this skill.
