# Step 5: Closeout

## MANDATORY RULES

- **Never fix a finding**, even when it is one line and the fix is obvious. Route it to `doninha-desenvolver`.
- **PBI mode writes `review.md` through `doninha-copy-writer`** — it is the only writer of canonical docs and `status.yml`.
- **Round N appends**; it never overwrites round N−1.
- **Close `sessao-review.md` last**, after the artifact and the status update actually landed.
- This step only appends and closes. It never rewrites what earlier steps recorded.
- Communicate in **PT-BR**.

---

## GOAL OF THIS STEP

The verdict is persisted where the next person — or the next skill — will look for it, and the user knows exactly what to do next.

---

## SEQUENCE

### 1a. PBI mode — hand off to `doninha-copy-writer`

Its input contract has exactly **five** fields. Fill them like this:

| Field         | Value                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content       | The consolidated report from step-04, as round `{rodada}` dated today, already carrying its own closing line (see *Routing* below).               |
| Target path   | `{pasta_pbi}/review.md` — the folder resolved in step-01 §3, verbatim. It is `pbis/pbi-{NNN}-{slug}/`, **not** `pbis/{slug}/`: the local sequential id is part of the folder name, and dropping it writes the review into a directory that does not exist. Never reassemble this path from parts. |
| Status field  | `pbis.{slug}.review = approved` \| `changes-requested`. **On `approved` only**, add `pbis.{slug}.tasks.task-NN = done` per reviewed task, listed explicitly as additional requested changes — the copy-writer applies only what it was asked for. |
| Metadata      | `stage: review`, `feature: {feature-slug}`, `pbi: {slug}`, and the feature directory so it can locate `status.yml`.                                |
| Current stage | `"7. Review"` — PBI-level.                                                                                                                        |

**Routing — put it in the Content, not in a sixth field.** The copy-writer's contract has no field for a caller-supplied next step, and `doninha-artifact-review`'s template derives its own closing line from the stage. That derived line is generic; this round's is specific — it has to name the tasks that go back. So the round's own closing line travels **inside the Content**, and the handoff asks the copy-writer to keep it rather than re-deriving one:

- `NECESSITA CORREÇÕES` → *"Próximo passo: volte ao `doninha-desenvolver` nas tasks {task-NN, …} e rode uma nova rodada de review depois."*
- `APROVADO` → the next step in this project's flow (documentation/closeout).

**Round structure.** State in the handoff that `review.md` already exists, that this is round `{rodada}`, and that the content is **appended** rather than replacing the file. Two shape rules travel with it, because a shared template that knows nothing about rounds will otherwise produce a file nobody can read:

- The round heading stays `## Rodada de revisão {N}`; **every section inside a round is `###`**, not `##`. Left at `##`, a two-round file has two sibling `## Achados` tables with nothing marking which round each belongs to.
- Only the **last** round carries a closing `Próximo passo` line. When appending round N, the previous round's closing line is demoted into that round's body (or dropped) so the file ends with exactly one — an orphan closing line in the middle of a document reads as the end of it.

The accumulated history of what was found and fixed is the point of appending; a file that keeps the history but loses its structure trades one failure for another.

Only set task statuses to `done` on approval. A task inside a `NECESSITA CORREÇÕES` round stays where it is — marking it done and then reopening it loses the fact that it failed review.

The copy-writer formats via `doninha-artifact-review`, adds the mandatory frontmatter and the closing `Próximo passo` line, and updates `status.yml`. Do not pre-render any of that here.

If the copy-writer is unavailable, do not lose the review: write the report to `{pasta_pbi}/review.md` directly with the frontmatter `doninha-artifact-review` specifies, tell the user `status.yml` was **not** updated and why, and record it in the session. A review that exists but is not indexed beats a review that vanished.

### 1b. DIFF mode — write directly

Write `.doninha/reviews/{slug}.md`, creating the folder if needed. The slug comes from the branch, PR or target that defined the scope — **not** from the date. Dating the filename looks tidy until the normal fix-then-re-review loop happens twice in one day and the second report silently replaces the first.

**Sanitize the slug before it touches a path.** It is derived from user-supplied input — a branch name, a PR title, a free-form target — and `diff-scope.md` accepts those verbatim. Lowercase it, replace anything outside `[a-z0-9-]` with `-`, collapse repeats, strip leading/trailing `-`, and cap at 40 characters. A branch called `fix/../../etc/thing` must not resolve outside `.doninha/reviews/`, and an empty result after sanitizing means ask the user for a name rather than writing to `.md`.

**Read the file before writing it.** Rounds accumulate here exactly as in PBI mode, and unlike PBI mode there is no copy-writer doing the merge — this step owns it, which is precisely why it is easy to get wrong. If the file exists: read it, keep every existing round intact, append `## Rodada de revisão {N}` with `###` sections inside, and demote the previous round's closing line so the file ends with exactly one. Never open the target for overwrite before you have its current content in hand; a round that replaces its predecessor destroys the history the accumulation exists to preserve.

Then verify what you wrote: the file must contain `## Rodada de revisão 1` through `{N}`. If a previous round is missing, say so plainly in the report and to the user — a silent loss is worse than a declared one.

Same body as PBI mode minus the acceptance-criteria section, with a short frontmatter recording `modo: diff`, the resolved `escopo_diff`, the target and the current verdict.

Do not invoke the copy-writer and do not touch `status.yml`: there is no PBI and no feature for either to key off.

### 1c. `APROVADO` in PBI mode — invoke `doninha-documentation`

Only on `APROVADO`, and only in PBI mode. Documentation is the stage that follows an approved review, and leaving it to the user's memory is how a PBI ships with docs describing the version before it.

**Order matters and it is not negotiable: this runs after §1a landed.** `doninha-documentation` starts by reading `pbis.{slug}.review` from `status.yml` and stops if it is not `approved` — invoke it before the copy-writer has written that field and it refuses, correctly. So: copy-writer first, confirm the field, then this.

Hand it the resolved `pasta_pbi` and the feature directory. It reads the PBI's artifacts itself, updates only the docs that genuinely changed, produces `learnings.md`, and routes its own handoff through the copy-writer — this step does not write `learnings.md` and does not set `pbis.{slug}.documentation`.

If it is not installed, say so and name what is now pending; the review still stands. Never write the documentation yourself as a fallback: the no-code constraint covers project docs too, and a review that also rewrites the docs it just measured against has no independent reader left.

In DIFF mode there is no PBI, no `status.yml` and no `documentation` stage — skip this entirely and do not mention it.

### 2. Record memory

Write to `.doninha/STATE.md` via the memory skill when it is installed at runtime — check, do not assume. Otherwise **append** (never overwrite) under that file's own sections:

- **Lessons Learned** — a defect class that showed up more than once, or a finding that a convention would have prevented. This is the part of a review that outlives the round.
- **Active Blockers** — a `critical` that cannot be fixed within this PBI.
- **Deferred Ideas** — a `suggestion` worth keeping that is out of scope now.

Skip routine findings. A memory file that records every `minor` stops being read.

### 3. Report to the user

In PT-BR, short:

- The verdict, and the counts by severity.
- The top `critical`/`major` findings — the ones that decided the verdict, not the whole table.
- The artifact path.
- Any pass recorded `SKIP`, with its reason.
- **What this round cost**: passes that ran vs. `N/A`, files read, whether it fanned out, and the
  wall time — one line, from what step-03 §6 recorded. It closes the loop opened by the pre-flight
  block in step-01: the person was told what it would cost and now sees what it did cost.
- **If `NECESSITA CORREÇÕES`**: the affected tasks, and the next step — `doninha-desenvolver` on those tasks. Then a new review round here.
- **If `APROVADO`**: what `doninha-documentation` did in §1c — which docs it touched and where `learnings.md` landed — or, when it is not installed, that documentation is pending. Then the PBI's own closeout.

If the user then asks you to fix the findings, decline and route it: this skill documents, `doninha-desenvolver` implements. Say it in one sentence and hand over the task list — no negotiation and no "but I can do this small one".

### 4. Close the session

Update `sessao-review.md` **last**: `stepsCompleted: [1,2,3,4,5]`, `artefato` set to the written path, `veredito` final, `proxima_fase` empty.

Ordering is the point. Closing the tracker before the artifact and the status update actually landed produces a session that claims a review exists when it does not, and a resume that skips the step that failed.

Keep the cost line from step-03 §6 in the tracker — it is not scratch state. Round over round it
is the only evidence of whether the review got faster or slower, and the alternative is deciding
that from memory.

---

## SUCCESS METRICS

- PBI mode: `review.md` written through the copy-writer as round `{rodada}` appended, `pbis.{slug}.review` set, `current_stage` set to `"7. Review"`, and task statuses touched **only** on approval — or the fallback path taken with the user told what was skipped.
- The handoff used the copy-writer's five contract fields only; the routing line travelled inside the Content and the file ends routing to `doninha-desenvolver`.
- The file has one `## Rodada de revisão {N}` per round, `###` sections inside each, and exactly one closing line — at the end.
- DIFF mode: the report is at `.doninha/reviews/{slug}.md` (no date in the filename), rounds appended, and `status.yml` untouched.
- Round N did not overwrite round N−1.
- PBI mode on `APROVADO`: `doninha-documentation` was invoked **after** the copy-writer set `pbis.{slug}.review = approved`, or its absence was reported as pending. Never invoked on `NECESSITA CORREÇÕES`, never in DIFF mode.
- `learnings.md` and `pbis.{slug}.documentation` were written by `doninha-documentation`, not by this flow.
- Memory updated only where it earns its place.
- The user has the verdict, the blocking findings, the artifact path, and one unambiguous next action.
- No code was modified anywhere in this flow.
- `sessao-review.md` closed last, with `stepsCompleted: [1,2,3,4,5]`.
