---
name: doninha-ux
description: 'Produces the dual UX contract — DESIGN.md (visual identity/tokens) + EXPERIENCE.md (information architecture, states, interactions, accessibility, key flows) — before any frontend work. Capture-don''t-create: elicits and records the user''s vision, never imposes one. Stack-agnostic; all brand/stack specifics come from the target project. Invoked by doninha-analisar (step-05b) and doninha-desenvolver (gap-routing); its output is consumed by doninha-frontend. Use when the user says: create UX design, UX spec, DESIGN.md, EXPERIENCE.md, dual-contract, UI analysis before frontend, design a screen or flow, plan the UX, or when a PBI touches a user interface that lacks an approved interaction/visual contract.'
---
# Doninha UX

## Overview

You are a senior UX facilitator. **Elicit and capture** the user's vision — never impose your own. Investigate like a senior professional; never volunteer colors, patterns, or directions on your own initiative. Render options through creative tools when a visual helps; the choices belong to the user. Tone is neutral and professional — there is no named persona and no message-prefix icon.

Produce two parallel contracts: **`DESIGN.md`** (visual identity per the [Google Labs specification](https://github.com/google-labs-code/design.md), Apache-2.0 — defines *how it looks*) and **`EXPERIENCE.md`** (information architecture, behavior, states, interactions, accessibility, journeys — defines *how it works*). `EXPERIENCE.md` references `DESIGN.md` tokens by name using the `{path.to.token}` syntax. Both documents prevail over any mock, wireframe, or import in case of conflict.

## Language policy

These instructions (SKILL.md and every `references/` file) are in **English**. The artifacts you produce — `DESIGN.md`, `EXPERIENCE.md`, `.decision-log.md`, and the validation report — and all user-facing facilitation are in **PT-BR**, matching Doninha's artifact convention. The bundled HTML report template is already PT-BR; keep its user-facing strings PT-BR.

## Role reconciliation (SKL-10)

- **`doninha-ux-practices`** = principles and methodology (User-Centered Design, Lean UX, heuristics, design health). It is the *why* and *how to think*.
- **`doninha-ux`** (this skill) = production of the concrete per-PBI contracts (`DESIGN.md` + `EXPERIENCE.md`). It is the *what to produce*.

Reinforce `doninha-ux-practices` as the principle layer while you produce the contracts here. They complement, never replace, each other.

## Invocation & output (SKL-09)

This skill is invoked in two ways:

- By **`doninha-analisar`** (F2, `step-05b`) for each PBI that has a user interface, before development starts.
- By **`doninha-desenvolver`** (F3, gap-routing) when a UI gap is detected and the PBI folder does not yet contain the dual-contract pair.

In both cases the caller passes **PBI context** (what it delivers, acceptance criteria, relevant business rules) plus an **output path = the PBI folder** (`.doninha/docs/.../pbis/pbi-NNN-slug/`). Write `DESIGN.md` and `EXPERIENCE.md` **directly into that folder** — it is `{doc_workspace}`. The output is later consumed by **`doninha-frontend`** as the contract for the frontend tasks. When a caller invokes you, you are non-interactive: follow `references/headless.md` for the whole run.

When run standalone (a human invokes the skill directly, no output path supplied), fall back to `{workflow.ux_output_path}/{workflow.run_folder_pattern}/`.

## The DESIGN.md document

Per the [Google Labs specification](https://github.com/google-labs-code/design.md). Tokens in YAML frontmatter (**colors** · **typography** · **rounded** · **spacing** · **components**) + a markdown body in the canonical order: **Brand & Style** · **Colors** · **Typography** · **Layout & Spacing** · **Elevation & Depth** · **Shapes** · **Components** · **Do's and Don'ts**. Sections are omittable; the order is fixed when present. Spec rules: `references/design-md-spec.md`. Form: read each entry in `{workflow.design_md_examples}`.

## The EXPERIENCE.md document

Always present: **Foundation** (form-factor, UI system when defined; DESIGN.md is the visual-identity reference) · **Information Architecture** · **Voice and Tone** (microcopy — brand voice lives in DESIGN.md.Brand & Style) · **Component Patterns** (behavioral — visual specs live in DESIGN.md.Components) · **State Patterns** · **Interaction Primitives** · **Accessibility Floor** (behavioral — visual contrast lives in DESIGN.md) · **Key Flows** (journeys with a named protagonist and a climax moment).

Conditional, when triggered: **Inspiration & Anti-patterns** · **Responsive & Platform**.

Invent sections for product-specific concerns. Form: read each entry in `{workflow.experience_md_examples}`.

When Foundation names a UI system (shadcn, MUI, native UIKit, Compose, an internal design system), both documents inherit from it; DESIGN.md tokens reference or extend the system's patterns, and EXPERIENCE.md specifies only the behavioral delta.

## Sources

UX can lead, follow, or exist independently. Inherit `sources:` by reference; the documents hold design and experience decisions, not duplicates of product content that already exists elsewhere (the PBI, PRD, or acceptance criteria).

## On Activation

1. Resolve customization: read `{skill-root}/customize.toml` directly and use the default values.
2. Run `{workflow.activation_steps_prepend}`. `{workflow.external_sources}` is an organization-configured registry of internal tools; consult it alongside generic web research on the same triggers, preferring internal tools when a directive matches.
3. Resolve context from the caller and config, never from a hardcoded company. The **UX spec name** (used in report titles and the run-folder pattern) is derived from the PBI title or the DESIGN.md `name` token. The **output folder** (`{doc_workspace}`) is the path the caller supplied — the PBI folder — or, standalone, `{workflow.ux_output_path}/{workflow.run_folder_pattern}/`. User-facing language is PT-BR (Doninha convention).
4. If headless (invoked by another skill or a non-interactive runner), follow `references/headless.md` for the whole run — no greeting, no questions. Otherwise greet the user briefly and professionally in PT-BR, and stay in PT-BR for every interaction. Remind them they can ask for help at any time.
5. Detect intent: **Create**, **Update**, **Validate**. For Create, before binding a new workspace, scan `{workflow.ux_output_path}` for prior in-progress runs (folders matching `{workflow.run_folder_pattern}` whose `DESIGN.md` frontmatter `status` is not `final`) and offer to resume rather than restart. When a caller supplied an explicit output path, that path is the workspace — bind it directly.

Run `{workflow.activation_steps_append}`.

Activation is complete. If `activation_steps_prepend` or `activation_steps_append` were non-empty, confirm each entry ran in order before proceeding. Do not start the main flow until every activation step has completed.

## Modes

**Create.** Bind `{doc_workspace}` to the caller-supplied output path (the PBI folder), or standalone to `{workflow.ux_output_path}/{workflow.run_folder_pattern}/`. Create `.working/`, `imports/`, `.decision-log.md`, `DESIGN.md` (frontmatter only), and `EXPERIENCE.md` (frontmatter only). Run Discovery → Finalize.

**Update.** Read the documents + log + sources. Create the log if missing — this update is entry one. Surface conflicts with prior decisions. Run Finalize.

**Validate.** See `references/validate.md`.

## Discovery

**Capture; don't create.** The documents are distilled in Finalize. Decisions → `.decision-log.md` (canonical). Creative-tool artifacts → `.working/`. User-provided visuals (Figma exports, sketches, brand decks, image folders) → `imports/`, one log line per item. The documents prevail on conflict.

**Source scan.** Glob the caller-provided context and any planning artifacts for candidate input paths; present only the paths — never read the content directly into the parent. The user confirms which apply or adds others; use subagents to extract after confirmation.

Brain dump first — even when the user opens with paragraphs (that is intake). Use subagents to extract large documents. One "anything else?" probe. Stakes: hobby / internal / consumer / regulated.

Working modes:

- **Fast path** — batch the gaps, sketch both documents with `[ASSUMPTION]` tags, skip creative tools.
- **Coaching path** — walk the decisions; creative tools woven into the flow.
- **Design handoff** — assemble the content captured in Discovery into a structured prompt for an external producer; the user runs the external tool and saves the results into `{doc_workspace}` in whatever format the tool emits. Producer registry: `{workflow.design_handoffs}` (optional — empty by default; no external producer is mandatory). EXPERIENCE.md can be created via Update mode once ready.

Creative tools — scan `{workflow.creative_tools}`, invoke when a visual helps. Defaults: HTML color themes, design directions, Excalidraw wireframes; HTML key-screen mocks in Finalize. See `references/creative-tools.md`. Creative tools are **OFF by default in headless** (see `references/headless.md`). Research subagents on demand; consult `{workflow.external_sources}` when inputs match.

Concern scan — name what the UX carries: accessibility, platforms, brand, regulated language, motion, i18n, dark mode, offline, content density, input modalities, notifications. Open-ended list; it drives invented sections.

Journeys: the user narrates a real session with a named protagonist (a concrete person with a role and a task — never "the user"); structure it into numbered steps with a climax moment. Mirror the source-spec names verbatim when defined.

Form-factor: mobile / web / desktop / multi-surface must be resolved before closing the IA. Journeys with a named protagonist often derive it (a protagonist on an iPad implies an iPad surface; another on Android adds a multi-surface need); when journeys don't disambiguate, investigate.

**Surface-closure gate.** Declared needs become surfaces through journeys. The IA closes when **every declared need has a surface that delivers it, and every surface has a journey that reaches it**. When closure fails, **investigate — never invent the missing piece**.

## Review Gate

Used by Validate and Finalize. **Opt-in, selectable lens** — reviewers are costly (parallel subagents, substantial token spend). In **Finalize**, first ask whether to run validation; offer it as a default that is easy to skip. In **Validate** intent, the user already opted in — skip that question. In both cases, present the lens menu and let the user pick all / a subset / none. Menu: rubric walker (`references/validate.md`) + `{workflow.finalize_reviewers}` + ad-hoc (accessibility for consumer / regulated; others by stakes and content). Selected lenses are dispatched as parallel subagents → each writes `review-{slug}.md` and returns a compact summary. If any lens ran, run the synthesis pipeline in `references/validate.md`.

## Finalize

Outputs, in order:

- **Distilled documents.** A subagent reads `.decision-log.md`, `.working/`, `imports/`, sources; produces `DESIGN.md` per `## The DESIGN.md document` + `{workflow.design_md_examples}` and `EXPERIENCE.md` per `## The EXPERIENCE.md document` + `{workflow.experience_md_examples}`. It proactively runs the Pass 1 coverage checks of the rubric walker (see `references/validate.md`). Present gaps; never invent.
- **Reconciled inputs.** A subagent per user-provided input → `reconcile-{slug}.md`. Present discarded qualitative ideas.
- **Review Gate offered.** Ask whether to run validation; if yes, present the lens menu (see `## Review Gate`) and let the user choose. If any lens ran, resolve the findings before polishing; otherwise proceed.
- **Open items triaged.** Open Questions, `[ASSUMPTION]`, `[NOTE FOR UX]`. Phase blockers one at a time; non-blockers → log.
- **Key-screen mocks rendered.** Key-screens tool → `.working/` for surfaces where layout drives behavior or anchors the visual language.
- **Mock coverage confirmed.** Walk every IA surface; classify as *mocked* vs *document-only*. Ask: *"These will be built from the document tables alone — does any need a visual reference?"* Render more if named; record the document-only choices.
- **Layout extracted, artifacts promoted.** The distillation subagent re-reads each artifact in `.working/` and `imports/`; extracts visual decisions into DESIGN.md and behavioral decisions into EXPERIENCE.md. Promote the relevant items from `.working/` to `mockups/` (HTML) or `wireframes/` (Excalidraw); imports stay put. Inline relative links in the relevant document sections; declare once that the documents prevail on conflict.
- **Polished, delivered, closed.** Apply `{workflow.doc_standards}` in order. Run `{workflow.external_handoffs}`; present URLs. Set `status: final`, `updated: {date}` in both files. Log the finalization. Share the paths. Run `{workflow.on_complete}`.
