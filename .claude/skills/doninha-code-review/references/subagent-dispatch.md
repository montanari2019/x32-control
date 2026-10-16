# Reference — Dispatching passes 3–5

Loaded by [steps/step-03-passes.md](../steps/step-03-passes.md). This file is a **contract**, not a methodology. Each pass's checklist is defined once, in its own skill; this file only describes what the orchestrator must hand over so that checklist can run.

---

## The three passes

| Pass | Skill                         | Reviews                                                                 |
| ---- | ----------------------------- | ----------------------------------------------------------------------- |
| 3    | `doninha-reviewer-correctness` | Null/undefined, races, leaks, off-by-one, coercion, error swallowing, inconsistent state, OWASP Top 10 |
| 4    | `doninha-reviewer-design`      | SOLID, Calisthenics, Clean Code, folder structure, naming, dependency flow, logging |
| 5    | `doninha-reviewer-tests`       | Test existence and bite, naming, coverage, isolation, doubles           |

**Why three and not five.** Bugs and security were one question asked twice — an unvalidated input
is a boundary violation and an injection, and both passes were finding it, reporting it, and then
paying consolidation to merge the two. Quality and patterns had the same overlap on naming and
placement. Merging them removed the duplicate finding, the duplicate context, and two subagents'
worth of fixed overhead. Pass 3 is the one that always runs, in every profile.

**Dispatch the applicable passes in a single message**, as parallel subagents. They are independent by construction and each carries its own isolated context; running them sequentially multiplies the wall-clock cost for nothing. Which passes apply, and whether fan-out is worth it at all, is decided in step-03 §2b — a small filtered scope runs inline instead.

**Match the model to the pass.** They are not equally hard, and running all of them on the most capable model is the single largest avoidable cost in this flow:

| Pass | Nature | Tier |
| ---- | ------ | ---- |
| 5 — tests | Mechanical checklist against a documented convention: does the test exist, does it match the rule. | A fast model is enough. |
| 4 — design | Judgement, but against explicit criteria and a written convention. | Mid tier. |
| 3 — correctness | Requires constructing a failure path nobody wrote down — the reasoning the rest of the flow depends on. | Keep the strong model here. |

When the runner exposes a model choice per subagent, use it. When it does not, this table still tells you where to spend depth if you must run passes sequentially.

Do not restate their checklists in the dispatch prompt. They own their rules, and a paraphrase in the payload only creates a second, drifting copy.

## Payload

Every subagent receives the same six blocks:

1. **The changed files** — repo-relative paths and the diff, plus the **full current content of the files that pass actually judges**. Full content is not optional where it matters: pass 3 reads whole files because defects emerge between new and existing code. Pass 4 judges placement, naming and dependency direction, which the paths plus the diff already show; pass 5 needs the source under test. Send paths and the diff to everyone; add full bodies for pass 3 always and pass 5 where it covers code. **Profile `leve` sends no full bodies at all** — diff plus the enclosing function of each hunk. When in doubt, give the subagent the paths and let it Read what it needs — it has the tools.
2. **The scope statement** — in PBI mode, the paths of `spec.md` and the reviewed task file(s), which the pass skills read for the requirement context. In DIFF mode, a one-paragraph summary of what the change does and the resolved diff command.
3. **The project docs** — the resolved `<CODEBASE_DIR>` **path**, plus the excerpts that bear on this change. Pass 4 depends on these completely and should get the relevant files in full; the others need the naming rules, not the whole set. Pasting all four docs into every prompt pays for the same tokens repeatedly — send the path and the excerpts, and let a subagent Read further if its checklist needs it.
4. **The output language** — explicitly **PT-BR**. The pass skills say *"detect the language of the TASK file provided by the orchestrator"*, which has no answer in DIFF mode where no task file exists. State it and neither mode guesses.
5. **The minimum severity to emit** — `minor` by default, which means `suggestion` is never produced. `--completo` lowers it to `suggestion`. This is where the severity floor of [severity-and-verdict.md](severity-and-verdict.md) §1b actually bites: a finding filtered at consolidation was already paid for.
6. **The instruction**:

   > Load and follow the `{skill-name}` skill. Return only a markdown findings block, in PT-BR, emitting only findings of severity `{mínima}` or above. Never modify code and never write to any file. You may use the `Explore` agent to read files the changed files import or depend on.

The `Explore` permission matters: passes 3 and 4 need to follow a dependency to judge whether a call is safe or a layer is respected, and a subagent that believes it cannot read anything else will guess instead.

## What comes back

Each returns a markdown block — `### Pass N — Título`, a findings table, and a `**Summary**` line — or the literal `Nenhum achado.` Nothing more; they write no files and change no code.

Take the blocks as candidates, not conclusions. Consolidation dedups them and verifies every `critical` — and the `major`s whose evidence is not already in hand ([severity-and-verdict.md](severity-and-verdict.md) §3).

## Degradation

A pass whose skill is not installed, or whose subagent fails or returns nothing usable:

1. Warn the user **once**, in PT-BR, naming the pass and the reason.
2. Record it in `sessao-review.md → passes_skipped` as `{pass, motivo}`.
3. Record it in the report's `Passes executados` section as `SKIP` with the reason.
4. Continue. A missing pass narrows the review; it does not stop it.

The one thing never to do is drop a pass silently. A verdict that ran five of seven passes is a weaker statement than one that ran all seven, and only the report can tell the reader which they are holding.

**When subagents are unavailable entirely** — no fan-out possible in the current context — do not error. Work through the five pass skills yourself, sequentially, in this context, loading each one in turn. Say plainly in the summary that the review ran single-pass without fan-out, because the isolation that makes five independent reviewers valuable is exactly what is missing.
