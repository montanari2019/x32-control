---
name: doninha-frontend
description: 'Stack-agnostic frontend-work discipline invoked by doninha-desenvolver whenever a task touches UI. Treats the target project''s real code plus its .doninha/docs/codebase/* convention docs as the sole source of truth for framework, styling, tokens, and state — nothing about the stack is hardcoded here. Enforces a real-code-is-authority routine (read the project''s own conventions and locate the nearest existing pattern before generating anything new) and a dual-contract rule (when DESIGN.md/EXPERIENCE.md exist in the PBI folder, they are the UX contract and no flow, modal, or route may be invented outside them). Use when: implementing, changing, or reviewing a screen, component, form, filter, table, modal, hook, client-side state, data-bound view, loading/error/empty state, or accessibility of any UI. Triggers: frontend, UI, screen, component, form, state, accessibility, a11y, view, layout, responsive.'
---

# Doninha Frontend

`doninha-frontend` is a **stack-agnostic frontend discipline**, not a framework guide. It is invoked by `doninha-desenvolver` (gap-routing) before reading or writing any code for a task that touches the UI. It never mandates a technology: the framework, styling system, design tokens, conditional-class helper, i18n mechanism, and state store all come from the **target project's own real code and its `.doninha/docs/codebase/*` convention docs** — never from this skill. In a multi-repo workspace, resolve `.doninha/docs/codebase/*` **per repo with fallback** per `doninha-workspace-detection`'s Codebase-context resolution: prefer the current repo's `repos/<name>/.doninha/docs/codebase/*`, else the root.

Any framework or styling library named below appears only as an illustration ("e.g. if your project uses X"), never as a requirement.

## Real-code-is-authority (start here, every time)

Before generating anything new, in this order:

1. **Read the project's conventions.** Load `.doninha/docs/codebase/*` (produced by `doninha-project-research`) and `DONINHA.md` (team policies/overrides), following `doninha-workspace-detection`'s **reading order**: `OVERVIEW.md` (what this repo is for + its module map) → the `modules/<slug>.md` of the **one** module/feature area you are touching → the technical files (`stack.md`, `architecture.md`, `conventions.md`, …). Never read the whole `modules/` folder. These tell you the actual framework, styling system, design tokens, conditional-class helper, i18n mechanism, state store, folder layout, and naming rules. If they are absent — including a missing `OVERVIEW.md` or module doc, which is normal — warn that specificity is missing, then fall back to inspecting the repository directly and to the universal principles in this skill — never invent a stack.
2. **Locate the nearest existing pattern in the real code.** Find the screen/component/hook/form most similar to what the task needs and treat it as the canonical example. The project's own code is the reference implementation — there are no bundled stack examples here on purpose (real code is authority).
3. **Reuse before create.** Prefer existing base components, tokens, helpers, and hooks over new ones. Match the predominant modern pattern of the codebase, not its legacy layers.
4. **Only then generate**, mirroring the located pattern's structure, typing, styling source, and naming. Naming follows the contract resolved before any code existed — the PBI's `spec.md` **Decisões técnicas** table (`doninha-desenvolver` step-03 §4.0). Outside the dev flow, apply `doninha-ubiquitous-language` §0 instead: the project's own code and `conventions.md` outrank every default, and no clear pattern means ask.
5. **Account for every visual value before handing off** — see the section below.

The references below are principles that deliberately **defer every specific** (styling system, design tokens, conditional-class helper, i18n mechanism, state store, file layout) to the project's own docs.

## Dual-contract rule (mandatory)

When the PBI folder contains `DESIGN.md` and/or `EXPERIENCE.md` (the dual-contract pair produced by `doninha-ux`), they are the **UX contract**:

- **Treat them as authoritative.** DESIGN.md defines visual identity/tokens; EXPERIENCE.md defines information architecture, states, interactions, behavioral a11y, and key flows.
- **Refuse to invent.** Do NOT create any flow, modal, drawer, wizard, route, or screen that is not explicitly required by the contract (or, absent a contract, by the PBI's spec/design/tasks or the real current flow). A prototype, mockup, screenshot, or print is a **visual reference only** — it never authorizes a new flow on its own.
- **On visual-vs-contract conflict, the contract wins.** If a mockup/print disagrees with DESIGN.md/EXPERIENCE.md (or with the spec/design), follow the contract and **record the divergence** in the handoff so it can be reconciled — never silently follow the visual (SKL-08).

If no dual-contract exists for a UI task, `doninha-desenvolver` invokes `doninha-ux` first; do not fabricate the missing contract yourself.

## Style account (mandatory, before handoff)

Users report the same asymmetry: the logic lands right and the **style** is what they have to ask
to be changed, delivery after delivery. The reason is structural, not carelessness — logic has a
test that fails when it is wrong, and style has nothing that fails. So it needs an explicit pass,
or it drifts by default.

Mirroring the neighbour component's *structure* is not enough either: a component can copy its
neighbour's layout faithfully and still invent a spacing, a radius or a shade along the way.

Before reporting the task done, list **every** visual value the change introduced or altered —
colour, spacing, radius, shadow, border, font size/weight, line height, breakpoint, z-index,
duration — and name where each one came from:

| Valor            | Origem                                      |
| ---------------- | ------------------------------------------- |
| cor de fundo     | token/constante do projeto que a define     |
| espaçamento      | token/escala do projeto                     |
| raio de borda    | token do projeto                            |

Three outcomes, and only the first is silent:

- **Every value traces to a project token or to an existing component's value** → nothing to say
  beyond the account itself.
- **A value has no token** → the project has a gap. Say so and ask, instead of inlining a literal
  that becomes the fourth shade of the same grey. If the answer is "inline it for now", record it
  in the handoff as a known deviation.
- **A value was invented** → fix it before handing off. This is the case the user has been
  catching by hand.

When a `DESIGN.md` exists it is the authority for these values and the account is checked against
it, not against taste. Absent one, the authority is the project's real tokens.

## References

Load the one relevant to the current task (progressive disclosure):

- [references/architecture.md](references/architecture.md) — split by responsibility (types / api-data / business-rules / filters / hooks / presentation); container orchestrates, presentation receives prepared view-models; apply the full split only when the responsibility is real.
- [references/state-and-data.md](references/state-and-data.md) — finite states as unions; loading/error/empty/disabled coverage; data layer outside components; defensive normalizers; mutation flow; auth/permission is the backend's authority.
- [references/accessibility.md](references/accessibility.md) — the a11y floor (semantics, labels/aria, roles, focus/keyboard) plus semantic `data-testid` (test-ids never substitute for a11y).
- [references/components-and-forms.md](references/components-and-forms.md) — typed props/callbacks, unions for finite states, reuse-before-create, controlled inputs, typed validation errors, export convention, and the styling principle (reuse the project's tokens/helper — never a parallel one).
- [references/forbidden-patterns.md](references/forbidden-patterns.md) — generalized anti-patterns and the "never invent a flow from a prototype" anchor (SKL-08).
- [references/workflows.md](references/workflows.md) — stack-neutral ordered checklists (create-screen, integrate-endpoint, create-form, add-filter, create-reusable-component, create-modal-gated-by-contract).

`doninha-frontend` is the domain-execution discipline; it applies, and does not replace, the cross-cutting principles in `doninha-code-practices` and `doninha-testing-practices`.

## PR / review checklist (generic)

- [ ] Project convention docs (`.doninha/docs/codebase/*`, `DONINHA.md`) were read and the nearest existing pattern in the real code was located and mirrored.
- [ ] Existing base components, tokens, helpers, and hooks were reused; nothing existing was duplicated.
- [ ] When a DESIGN.md/EXPERIENCE.md contract exists, the change conforms to it; no flow/modal/drawer/route/screen was invented outside the contract (or spec/design/tasks); any visual-vs-contract divergence is recorded.
- [ ] Files are split by responsibility when the change is non-trivial; trivial changes preserve the local file.
- [ ] Finite states are modeled as unions; every data-dependent view covers loading, recoverable error (with retry), empty, and disabled states.
- [ ] No data/API calls inside JSX or presentational components; the data layer lives outside components.
- [ ] Props and callbacks are explicitly typed; no `any`, `Function`, boxed primitives, or wide casts.
- [ ] The **style account** was produced and travels in the handoff: every visual value introduced traces to a project token/existing value, values without a token were raised instead of inlined, and nothing was invented.
- [ ] Styling reuses the project's existing conditional-class helper; no parallel helper was introduced.
- [ ] Accessibility floor is met (semantic elements, labels/aria, roles, visible focus, keyboard); interactive elements carry a semantic kebab-case `data-testid`; test-ids did not replace a11y attributes.
- [ ] User-facing text uses the project's own i18n mechanism when one exists.
- [ ] Layout was considered for small and large viewports and long text without overlap.
- [ ] Route/permission changes tracked the corresponding menu entries, links, and permission checks; auth/permission was not bypassed on the client.
- [ ] No empty catch, stray `console.log`, `debugger`, or inline mock data left in components.

## Handoff report

On completion, report back to `doninha-desenvolver`: what changed and why, files touched, verification run and its result, the located reference pattern that was mirrored, any recorded contract divergence, residual risks, and follow-ups.

Include the **style account** from the section above — the table, plus any value that had no
token and what was decided about it. It travels with the handoff on purpose: kept to itself, the
check becomes a promise, and a promise is what the user has been auditing by hand. On the report,
whoever reads it sees which values are token-backed before opening the screen.
