# Headless Mode

Load this file when invoked in headless mode. Follow it for the whole run.

## Detection

Headless mode is identified when any of the following is true: the caller sets `headless: true` (or the harness equivalent); the invocation comes from another skill or a non-interactive runner; `{workflow.activation_steps_prepend}` declares it; the first message is an automation context that already supplies the inputs. When you are invoked by **`doninha-analisar` (step-05b)** or **`doninha-desenvolver` (gap-routing)**, you are headless. On ambiguity, default to interactive.

## Inputs

Free-form structured payload in the first message:

- `intent` — `"create"`, `"update"`, or `"validate"`. If absent, infer from the artifact set.
- **Output path** — the caller supplies the **PBI folder** (`.doninha/docs/.../pbis/pbi-NNN-slug/`) as `doc_workspace`. Write `DESIGN.md` and `EXPERIENCE.md` **directly into that directory**. Do not create a nested run folder; the caller's path *is* the workspace.
- **Create**: any source spec (PBI context, acceptance criteria, relevant business rules, PRD, brief, requirement list, prior UX — text, path, or URL) plus brand, platform, and accessibility notes; the output path for the run folder.
- **Update**: an existing workspace containing `DESIGN.md` + `EXPERIENCE.md` (or a path to either) + a change signal.
- **Validate**: an existing workspace containing `DESIGN.md` + `EXPERIENCE.md` (or a path to either). The default workspace is the directory that contains the primary files.

Inferences → `assumptions[]`. Gaps that require a human decision → `open_questions[]`. Do not invent persona, brand, accessibility, or scope details.

Creative tools are **OFF by default in headless mode**. The caller may override; artifacts are then generated in `.working/` and are not promoted unless the caller signals it.

## Behavior

Do not ask questions. Do not greet. Complete the intent from what was supplied, what exists in `{doc_workspace}`, or what can be discovered (read the target project's `.doninha/docs/codebase/*` — resolved per repo with fallback per `doninha-workspace-detection`'s Codebase-context resolution — and `DONINHA.md` for stack/design-system specifics — never hardcode them). If the intent stays ambiguous after inference, terminate with `status: "blocked"` and a one-sentence `reason`.

`status`:
- `"complete"` — the artifact is self-sufficient.
- `"partial"` — artifact produced, but `open_questions[]` is non-empty or critical inputs were inferred.
- `"blocked"` — no artifact produced.

Terminate with JSON matching `assets/headless-schemas.md`. This is the **strict terminal JSON contract**: `status`, `intent`, `reason` (only when blocked), `assumptions[]`, `open_questions[]`, plus the artifact-path keys — Create: `design` / `experience` / `decision_log`; Update: same three plus `changes_summary` / `conflicts_with_prior_decisions[]`; Validate: `validation_report` / `findings_summary` / `offer_to_update`. `intent` reflects the detected intent. Omit keys for artifacts not produced. The `design` and `experience` paths point inside the caller-supplied PBI folder.

## Per-mode overrides

**Update.** Apply the change. Log it in `.decision-log.md` with rationale. Flag conflicts in `conflicts_with_prior_decisions[]`.

**Validate.** Always write both `validation-report.html` and `validation-report.md`, regardless of the number of findings. Always include `"offer_to_update": true`. Skip the open-in-browser step.
