# DESIGN.md Spec — Working Reference

Source of truth: [google-labs-code/design.md](https://github.com/google-labs-code/design.md) (Apache-2.0, Google Labs). This file is a working summary; the URL prevails in case of conflict.

## Structure

YAML frontmatter (machine-readable tokens) + a markdown body (human-readable rationale, prose sections).

## Frontmatter tokens

| Key | Type | Notes |
|---|---|---|
| `name` | string | Required. Brand or system name. |
| `description` | string | One-line statement of what this system is. |
| `colors` | flat object | Keys in kebab-case. Values are hex strings (`'#FBF9F4'`). |
| `typography` | nested object | Each value: an object with any subset of `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`. |
| `rounded` | object | Scale names (`sm`, `md`, `lg`, `xl`, `full`, `DEFAULT`) → CSS dimensions. `full` is conventionally `9999px`. |
| `spacing` | object | Scale levels (`'1'`, `'2'`, ...) or named tokens (`gutter`, `margin-mobile`, `editorial-gap`) → dimensions. |
| `components` | object | Component name → object of component tokens mapped to values or `{path.to.token}` references. |

## Body sections (omittable, fixed order when present)

1. **Brand & Style** — Aesthetic posture in prose. The editorial voice — what *kind* of thing this system is.
2. **Colors** — Narrative per color. Why each exists, where it is used, what it is *not* used for.
3. **Typography** — Type roles, scale, and rules. Platform conventions annotated semantically when inherited.
4. **Layout & Spacing** — Spacing-scale narrative, grid behavior, margins, gutters, breakpoint rules.
5. **Elevation & Depth** — Shadow language and tonal-layering rules.
6. **Shapes** — Corner-radius rules and the aesthetic logic behind them.
7. **Components** — Visual specs per component: anatomy, color usage, sizing, state appearance.
8. **Do's and Don'ts** — Hard visual rules — what to do and what to avoid.

Sections may be omitted when not relevant; the order is fixed when present.

## Cross-reference syntax

`{path.to.token}` is used in prose and inside component objects to reference frontmatter tokens. Examples:

- `{colors.primary}`
- `{typography.body.fontSize}`
- `{rounded.md}`
- `{spacing.4}`

The path follows the YAML structure.

## Common patterns

- **Light/dark mode.** Separate kebab-case tokens (`surface-base` / `surface-base-dark`) or separate per-mode DESIGN.md files. The spec allows both approaches; choose the form that reads most clearly for the product.
- **Platform conventions.** When inheriting from native platforms (iOS UIKit, Android Compose, Apple Human Interface Guidelines), use a `note` field instead of literal values: `{ note: 'iOS Title 1 · Android Headline Small' }`. The spec is the spec; the platform owns the rendered values.
- **UI-system inheritance.** When inheriting from shadcn / MUI / Tailwind / an internal design system, reference the system's tokens by name instead of repeating the values. DESIGN.md specifies only the deltas (brand color overrides, typography swaps, component customizations).
- **Component tokens.** The frontmatter `components` entry maps each named component (e.g. `button-primary`) to its specific token values. Use `{path.to.token}` references freely; the resolver flattens them at consumption time.
