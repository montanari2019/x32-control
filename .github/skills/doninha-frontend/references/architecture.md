# Architecture — split by responsibility

Principles only. Concrete folder layout, file suffixes, and framework primitives come from the target project's `.doninha/docs/codebase/*` and its real code. Mirror the codebase's own convention; the responsibilities below are what to separate, not what to name.

## Separate by responsibility

For a non-trivial UI feature, keep each concern in its own place instead of one mixed file:

- **Types** — DTOs, view-model shapes, and finite-state unions. Kept apart so both the data layer and the presentation share one contract.
- **Api-data** — the fetch/mutation layer that talks to the backend. Lives outside components (never inside JSX or presentational code).
- **Pure business-rules** — validation, derivations, and view-model construction as pure functions with no framework and no DOM dependency, so they are testable in isolation.
- **Filters** — filter state and pure search/normalization helpers.
- **Hooks / controller logic** — screen state, orchestration, effects, refresh callbacks; the framework-bound layer that wires data + rules + filters together.
- **Presentation** — the rendering layer that receives prepared view-models and callbacks and renders them.

Use whatever the project's own naming/suffix convention is for these (read it from the codebase docs); do not impose a new one.

## Container orchestrates, presentation renders

- The **container** (screen / route-level component / controller) orchestrates data loading, filters, permissions, and flow. It owns state and decides what happens.
- **Presentation** components receive **prepared view-models and callbacks** as props. They **never fetch data**, never call the backend, never hold cross-screen business rules. They render and emit events.
- Pure business-rules stay free of framework and DOM so they can be unit-tested without rendering.
- Derived data (filtered lists, summaries, labels) is computed once in the orchestration layer and passed down — not recomputed inside render loops.

## Apply the split only when the responsibility is real

The full split is a response to real complexity, not a template to stamp on everything:

- **Trivial change** (a copy tweak, a one-line fix, a small addition to an existing file) → preserve the local file; do not explode it into layers.
- **Real, distinct responsibility** appears → extract it into its own place following the project's convention.

Over-splitting a simple change is as much an anti-pattern as mixing everything into one file. Let the actual responsibility decide.

## Providers / global wiring

Use the project's existing providers, contexts, or wiring for shared concerns (auth, tenant, account, theme, language). Do not introduce a new global provider or store for state that is local to a single screen — see [state-and-data.md](state-and-data.md).
