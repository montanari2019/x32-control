# Workflows

Stack-neutral, ordered checklists. Every step is deliberately free of framework names, file paths, library names, and design values — resolve all of those from the target project's `.doninha/docs/codebase/*` and its real code before you start. Every workflow assumes you have already read the project conventions and located the nearest existing pattern (real-code-is-authority, see SKILL.md).

## Create a screen

1. Confirm the target area of the project and the nearest existing similar screen; treat it as the reference pattern.
2. Create the feature's folder following the project's convention.
3. Split by responsibility only where the responsibility is real (types / api-data / business-rules / filters / hooks / presentation).
4. Build the root container with a semantic root element and a semantic `data-testid`.
5. Add the structural regions the project's screens use (header, toolbar/filters separated from content, content area).
6. Cover loading, recoverable-error (with retry), empty, and disabled states for any data-bound region.
7. Keep data flow in a hook/controller and pass prepared view-models to presentation; no calls in the render path.
8. Register any route through the project's routing mechanism with the correct permission guard, and update menu/links.
9. Route user-facing text through the project's i18n mechanism and update its locales.
10. Verify within the project using its own build/test command.

## Integrate an endpoint

1. Confirm the real endpoint path and its actual contract.
2. Check for required tenant/account/permission parameters and where they belong (params/header/body).
3. Define request/response types in the types layer.
4. Add the fetcher/mutation in the data/api layer, outside components.
5. Use `unknown` plus a defensive normalizer and type guards when the payload is unstable.
6. Encapsulate optional parameters in a helper.
7. Expose an explicit state (status, error, data) and a refresh callback from the screen's hook.
8. Give load errors a translated fallback and a retry.
9. Never call the endpoint from a presentational component.

## Create a form

1. Define the form-state type, the finite validation-error union, and the request type in the types layer.
2. Put parse/validation in the pure business-rules layer.
3. Use controlled inputs.
4. Use the project's input styling constants/tokens, or extract shared constants following its convention.
5. Add label, helper, inline error, and a real disabled state.
6. On submit: validate → if invalid, surface the typed error and stop → enter submitting → make the typed call → update/close/refresh → read errors defensively with a translated fallback → clear submitting in `finally`.
7. Give every interactive input/button a semantic `data-testid`.
8. Route text through the project's i18n mechanism.

## Add a filter

1. Check whether the module already has a filters layer/hook.
2. Add the filter's state to the filters hook.
3. Add a pure helper to apply the filter.
4. Normalize text (trim, lowercase, accent-fold) for textual search.
5. Expose the selected label through the project's i18n mechanism.
6. Build the filter UI from the project's shared toolbar/dropdown components when they exist.
7. Add `data-testid`s to open, select, clear, and apply.
8. Reset pagination when the filter changes, if the list is paginated.

## Create a reusable component

1. Search for an equivalent existing component (shared/base library and the feature's own domain) before creating one.
2. Prefer a domain-local component over a new globally-shared one unless the reuse is genuinely cross-domain.
3. Compose with the project's existing base components where possible.
4. Keep props explicit, typed, and small, with typed callback signatures.
5. Do not embed data calls, storage, or heavy business rules.
6. Accept a style-override/`className` prop only when the component is genuinely meant to be extended.
7. Source icons and styling from the project's own system/tokens.
8. Include disabled/loading/empty states when they are part of the control.

## Create a modal gated by contract

1. **Gate first:** confirm the modal is a real UX requirement — required by the PBI's `DESIGN.md`/`EXPERIENCE.md`, or its `spec.md`/`design.md`/`tasks.md`, or the real current flow. A prototype/print alone does **not** authorize it. On visual-vs-contract conflict, follow the contract and record the divergence.
2. Search for an existing modal in the domain before creating another.
3. Use the project's overlay/panel pattern with coherent stacking and sizing.
4. Add the dialog roles and accessible name (`role="dialog"`, `aria-modal="true"`, an `aria-labelledby`), and a close control with `aria-label`, `title`, and `data-testid`.
5. Structure header, body, and footer with the project's standard spacing; make a long body scrollable.
6. Support Escape and outside-click dismissal per the a11y floor.
7. Control open/close via local state and callbacks; keep focus visible.
