# Validate

Critique an existing spine document pair (`DESIGN.md` + `EXPERIENCE.md`), or any user-provided UX format, without changing it. The synthesis pipeline below is also used by the Review Gate during Create/Update Finalize.

Throughout this file, `{ux_spec_name}` is the name of the UX spec being reviewed — derived from the DESIGN.md `name` token or the PBI title, never a hardcoded company name.

## Orient

A subagent extracts from `.decision-log.md`, frontmatter sources, `imports/`, `mockups/`, `wireframes/`, `DESIGN.md`, `EXPERIENCE.md`. The parent agent assembles from the extracts.

## Reviewer Gate

**Opt-in.** Reviewers have a cost. In Finalize, first ask whether the user wants to run the multi-subagent UX validation. Offer it as a default, with an easy option to skip. In Validate intent, skip that question — the user already invoked it.

**Lens menu.** UNLESS IN HEADLESS MODE: always present the lens options before dispatching. Assemble the menu from: rubric walker (this file) + `{workflow.finalize_reviewers}` + ad-hoc reviewers the skill judges relevant. The user chooses all, a subset, or none. Only the selected lenses are dispatched.

Rubric walker prompt:

> Validate the spine document pair (`DESIGN.md` + `EXPERIENCE.md`) as a contract for downstream consumers (architecture, story-dev — human or AI). Can a consumer extract the sources cleanly, with all references resolving and all structural decisions confirmed? Read `{workflow.design_md_examples}` and `{workflow.experience_md_examples}` first.
>
> **Pass 1 — mechanical coverage.** Per category: extract and list the gaps with location citations. No gaps = **strong**.
>
> 1. **Flow coverage** (EXPERIENCE.md). Frontmatter sources → extract each user-journey name / requirement. Verify each one has a Key Flow with a named protagonist, numbered steps, a climax moment, and a failure path where applicable.
>
> 2. **Token completeness** (DESIGN.md). Extract every token in the YAML frontmatter and every `{path.to.token}` reference in the prose. Verify each is defined (see `references/design-md-spec.md` for type rules). **Color tokens without a hex (or light/dark pairs where applicable) are critical** — downstream code mirrors the spine. Platform conventions (native dynamic type, 8pt grid) may stay semantic. Declared contrast targets for structural combinations.
>
> 3. **Component coverage** (both spines). Extract every component name used anywhere. Verify each has a line in DESIGN.md.Components (visual spec) *and* in EXPERIENCE.md.Component Patterns (behavioral spec) — real rules, not one-word descriptions.
>
> 4. **State coverage** (EXPERIENCE.md). Walk every IA surface. List the states that should exist (empty, initial loading, focus, error, offline, permission denied — the ones that apply). Verify each is covered.
>
> 5. **Visual-reference coverage.** List every file in `mockups/`, `wireframes/`, `imports/`. The spines reference each one inline in the relevant section and describe what it illustrates; the spines' priority on conflict is stated once. List orphan references and non-specific references.
>
> **Pass 2 — judgment.** Verdict per category (*strong / adequate / thin / broken*); only conclusions that add information.
>
> 6. **Bloat & overspecification.** Pixel specs where tokens cover; restatement of sources (personas, functional requirements, scope); prose where a table works; sections no downstream consumer would read; decorative narrative with no link to a decision. DESIGN.md prose may have editorial voice; EXPERIENCE.md prose must not.
>
> 7. **Inheritance discipline.** The `sources` frontmatter resolves. Literal UJ / requirement names from the sources. Identical glossary between spines and sources. Identical component names across every section of both files. Token references in EXPERIENCE.md resolve to DESIGN.md tokens by name.
>
> 8. **Shape fit.** DESIGN.md sections in canonical order (Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts; omittable, but order-locked when present). Required EXPERIENCE.md patterns present (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows). Omitted patterns must be justifiable. Presence of conditional patterns where triggered (Inspiration when sources / log show reference products or rejections; Responsive when multi-surface or with breakpoints). Invented sections must justify their existence.
>
> Severity = downstream impact, not fix difficulty.
>
> Write to `{doc_workspace}/review-rubric.md`:
>
> ```markdown
> # Spine Pair Review — {ux_spec_name}
>
> ## Overall verdict
> [2–3 sentences]
>
> ## 1. Flow coverage — [verdict]
> [What was checked.]
> ### Findings
> - **[critical|high|medium|low]** [finding] (location). *Fix:* [suggestion].
>
> (repeat 2–8)
>
> ## Mechanical notes
> [Name inconsistencies, broken cross-refs, frontmatter completeness, Mermaid syntax.]
> ```
>
> Return ONLY a compact summary: overall verdict, per-section verdicts, finding count by severity, file path.

The gate can dispatch `{workflow.finalize_reviewers}` and ad-hoc reviewers (accessibility for consumer / regulated). Each writes `review-{slug}.md` and returns a compact summary. In parallel.

## Synthesis pipeline

In Validate intent, after all reviewers return, render a consolidated report. Do not skip.

1. Read every `{doc_workspace}/review-*.md`.
2. Fill `{workflow.validation_report_template}`. No overall grade — the per-category verdicts and severity counts already say what is true. The synthesis paragraph elevates the rubric's overall verdict; add a second if extra reviewers change the picture. One section per rubric category (open if thin / broken), one per extra reviewer (closed, adversarial voice preserved).
3. Write `{doc_workspace}/validation-report.html`.
4. Write the Markdown pair `{doc_workspace}/validation-report.md` — same content grouped by severity.
5. Open the HTML: `python3 -c "import webbrowser, pathlib; webbrowser.open(pathlib.Path('{doc_workspace}/validation-report.html').resolve().as_uri())"`. Skip in headless mode.

Re-runs overwrite the consolidated report; individual `review-*.md` files persist.

## Markdown pair structure

```markdown
# Validation Report — {ux_spec_name}

- **DESIGN.md:** `{design_path}`
- **EXPERIENCE.md:** `{experience_path}`
- **Run at:** {ISO timestamp}

## Overall verdict
{synthesis paragraphs}

## Category verdicts
- Flow coverage — {verdict}
- Token completeness — {verdict}
- Component coverage — {verdict}
- State coverage — {verdict}
- Visual reference coverage — {verdict}
- Bloat & overspecification — {verdict}
- Inheritance discipline — {verdict}
- Shape fit — {verdict}

## Findings by severity

### Critical (n)
**[Category or Reviewer]** — Title (§ location)
{Note}
Fix: {suggested fix}

### High (n) / Medium (n) / Low (n)
...

## Reviewer files
- `review-rubric.md`
- ...
```

## Close

Present the artifact paths. Always offer to fold the findings into an update (Update mode).
