# Components and forms

Principles only. Concrete base components, styling tokens, the conditional-class helper, and the i18n mechanism all come from the target project's `.doninha/docs/codebase/*` and real code. Reuse what exists; do not spawn parallels.

## Props and typing

- Props are **explicit and typed**. Exported prop shapes use the typing construct the project already uses (interface/type), matching its naming convention.
- Callback props have **explicit typed signatures** (e.g. an `onChange` that states its argument and return types) — never an untyped function type.
- Model finite states as **unions** (e.g. a status of `IDLE | LOADING | READY | ERROR`, a variant enumerated as a union) rather than open strings or booleans.
- DTO/view-model types live in the types layer (see [architecture.md](architecture.md)).
- **No** `any`, `Function`, boxed primitive wrappers, `Object`, or wide casts. Use precise types, generics, unions, and `unknown` with narrowing.

## Reuse before create

- Search for an equivalent existing component (base/shared library and the feature's own domain) before writing a new one.
- **Do not duplicate** existing base components (buttons, cards, badges, tables, toolbars, modals, pagination, and the like). Compose with them.
- Prefer a domain-local component over a new globally-shared one unless the reuse is genuinely cross-domain.
- A presentational component does not embed data calls, storage, or heavy business rules — keep those in their own layers.
- Accept an extensibility escape hatch (e.g. a `className`/style-override prop) only when the component is genuinely meant to be extended.

## Exports

Follow the project's predominant convention. A common one: **named exports** for helpers and hooks, and a **default export** for the component consumed by a route or parent. Do not introduce new barrel/index files unless the project has that pattern.

## Forms

- Use **controlled inputs** wired to state; keep parse/validation out of the render path.
- Put validation in the **pure business-rules** layer so it is testable without rendering.
- Model validation errors as **finite typed unions** (e.g. `EMPTY | LIMIT_EXCEEDED | INVALID_FORMAT`), and map each to a user message in the presentation layer — do not scatter raw strings through the logic.
- Provide label, helper text, inline error (that does not break layout), and a real **disabled state** (visual and functional).
- Disable submit while the form is invalid, loading, or another process is in flight.
- Submit follows the mutation flow in [state-and-data.md](state-and-data.md): validate → submitting → typed call → update/refresh → defensive error read → clear submitting in `finally`.
- For special inputs, follow the project's real patterns (e.g. reset a file input's value after processing so the same file can be re-selected; prevent default on drag/drop handlers).

## Styling principle (generalized)

The project's codebase docs supply the actual styling system, design tokens, and conditional-class helper. This skill states only the discipline:

- **Reuse the project's existing tokens / style constants.** Use the project's design tokens for surface, text, border, and action colors, its spacing/radius scale, and its typography — do not hardcode literal design values when a token exists.
- **Reuse the project's existing conditional-class helper.** If the project already has a helper for composing conditional classes, use it. Do **not** create a parallel styling helper, a new class-composition utility, or a competing abstraction.
- **Extract repeated style into shared constants** following the project's own location/convention, instead of copy-pasting the same cluster of styles across files.
- **Do not spawn a one-off palette** or a parallel token set alongside the project's tokens. When a token is missing for a genuine need, follow the project's process for adding one (or record it as a decision) rather than inventing an ad-hoc value.
- Avoid inline style objects for layout, spacing, or standard colors when the project's styling system covers them; reserve inline styles for the narrow cases the project documents as exceptions.
- Respect the project's theming (e.g. dark mode) wherever it already applies, using its tokens/mechanism.

Illustration only: if your project happens to use a utility-class CSS framework, its class strings and token variables still come from that project's docs and real code — this skill never dictates specific class names, palettes, or values.
