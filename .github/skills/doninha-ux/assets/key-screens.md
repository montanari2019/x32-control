# Key Screens Renderer

Subagent prompt. Triggered at the Finalize step (or during advanced Discovery, when layout decisions are settled). Produces 1:1 HTML mocks of the highest-weight surfaces so the spine document can link them as visual reference. The spine document remains the contract; the mocks illustrate.

## Inputs

`.decision-log.md`, the current drafts of `DESIGN.md` and `EXPERIENCE.md`, `.working/` (especially the chosen color theme and direction mocks), and the source PBI context. The user indicates which surfaces to render — typically 2 to 4: the canonical entry surface, the main screen of the most complex flow, any heavy overlay/modal, and, when present, the week / list / dashboard view.

## What to render

One HTML file per screen, in `.working/key-{slug}.html`. Each file should contain: a realistic device frame (phone or browser), real product content drawn from the conversation (no lorem), all visible strings checked against `.decision-log.md`, and all defined tokens applied. Show one canonical state per screen; if a surface has a relevant alternative state (focus, error, critical-status card present), render it as a second column or section in the same file.

Inline CSS, system fonts, no JS, no network. The mock must render fully offline. A comment block at the top of `<style>` states which spine-document sections govern this screen, so a future reader knows what to check. Keep all user-facing strings in PT-BR (Doninha artifact convention).

## What to return

A compact summary for the parent agent:
- file path per screen
- a one-line caption per screen (e.g. "Date picker at rest; highlight on the interaction log")
- which spine-document sections each mock illustrates (Component Patterns rows, State Patterns rows, Flow steps)

The parent agent, at the Finalize "Promote working artifacts" step, uses this summary to inline `mockups/...` links in the relevant spine-document sections.

## Anti-patterns

- Do not invent layout — every composition decision must be traceable to an artifact in `.working/` or a confirmation in `.decision-log.md`. If a layout question is open, the mock is premature.
- Do not render every screen of every flow — 2 to 4 highest-weight surfaces, not 14.
- Do not use staged marketing copy. Strings come from `.decision-log.md` and the voice rules.
- Do not introduce a new pattern that is not in the spine document's Component Patterns table. If one is needed, record it and ask before rendering.
