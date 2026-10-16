# Step 4: Implement

## MANDATORY RULES

- Execute `task.md`'s tasks in dependency order, respecting `[P]` parallel groups and the backend-before-frontend ordering (AD-004) already applied when `task.md` was written.
- A **correction pass** (§2b, re-entered from `step-05-fechamento.md` §2c after a `NECESSITA CORREÇÕES` verdict) runs the same loop under the same gates, scoped to the tasks the verdict named and nothing else. It never re-executes the plan, and it never weakens a test to close a finding.
- For every task, **Step 0** runs before any code for that task is read or written: re-check the task's domain against [references/gap-routing.md](../references/gap-routing.md)'s Checkpoint 2 (execute time). If it maps to `doninha-backend`, `doninha-frontend`, or `doninha-ux`, invoke that specialist skill first and follow its handoff/conventions for the rest of the task. If the mapped skill isn't installed, warn once and continue with the generic discipline in [references/implement.md](../references/implement.md) — never block.
- After Step 0, run the rest of [references/implement.md](../references/implement.md)'s loop as-is: RED → GREEN → VERIFY (mandatory gate, tier from `task.md`, commands sourced from the target project's own `TESTING.md`) → Post-Gate review → scoped Quality Gate → atomic Commit. Never skip or weaken either gate.
- The **scoped quality gate runs after the Post-Gate review and before the commit** — `doninha-quality-gate` invoked at scope `per-task` per [references/quality-gate.md](../references/quality-gate.md). An unresolved finding blocks the commit. A gate that can't run is reported as SKIP with its reason and does not block. Gate 3 (complexity) runs only when `quality_gates.complexity` is on (resolved in step-02 §5b from `.doninha/integrations/quality-gate.yml`); otherwise it is reported as DISABLED. This carries the same weight as the tier gate: never skipped, never weakened, never run after the commit.
- The quality gate runs **in this context, or in the generic sub-agent running this task's loop** — never by invoking a `doninha-*` agent definition. `doninha-quality-gate` is a skill, not an agent: invoking it means loading that skill here, not spawning an agent to run it.
- One task = one commit. Never batch multiple tasks into one commit, never commit a task that hasn't passed its gate.
- Tests are never modified to make them pass, never deleted, never skipped/disabled to bypass a failure — this file inherits every hard constraint from `implement.md` verbatim.
- Update `task.md`'s checklist and `spec.md`'s Requirement Traceability table after every task, not in a batch at the end.
- If the whole PBI is trivial (≤3 files, one-sentence scope), [references/quick-mode.md](../references/quick-mode.md) may replace this whole per-task loop — same quality bar, less ceremony. This is a judgment call made once, before starting task 1, not per task.

---

## SEQUENCE

### 1. Confirm entry state

From `{pasta_pbi}/sessao-dev.md`, confirm `stepsCompleted` includes `[1, 2, 3]`, `spec_construido: true`, and `total_tasks` and `skills_necessarias` are populated. If any of these is missing, step-03 didn't complete correctly — go back to it rather than improvising a task list here.

**There are two legal entries into this step.** A first pass arrives with `proxima_fase: 'implementar'` and runs §2 onward. A **correction pass** arrives from `step-05-fechamento.md` §2c with `stepsCompleted` already `[1, 2, 3, 4]`, `proxima_fase: 'correcao'`, and `tasks_em_correcao` non-empty — that one routes straight to §2b and skips §2 and §3 entirely. Do not treat the already-complete `stepsCompleted` as a session that has nothing left to do.

### 2. Decide: full per-task loop vs quick mode

Before starting task 1, check whether the whole PBI still fits [references/quick-mode.md](../references/quick-mode.md)'s bar: describable in one sentence, ≤3 files total across every task in `task.md`.

- **Fits:** use quick-mode's process instead of the per-task loop below. Same RED→GREEN→VERIFY→commit discipline, same gate check, just without the full execution-template ceremony per task. Note this choice in `sessao-dev.md` (see step 7 below) and skip to step 6 once quick-mode's single commit lands.
- **Doesn't fit (the normal case for anything that reached full spec+tasks):** continue with the per-task loop below.

### 2b. Correction pass (re-entry from a review verdict)

Entered **only** from `step-05-fechamento.md` §2c, never from step-03. Skip this section entirely
on a first pass.

A correction pass is not a second implementation pass. The plan was already executed and approved;
what is being answered here is a specific list of findings, and touching anything else re-opens
work that already passed review — which is the behaviour this whole cycle exists to stop.

#### 2b.1 — Fix the scope before touching anything

1. Read the round's blocking findings from `{pasta_pbi}/review.md` (the round `doninha-code-review`
   just appended) and `tasks_em_correcao` from `sessao-dev.md`.
2. Record **`base_correcao` = `git rev-parse HEAD`** *before the first correction commit*. The next
   review round checks "did the correction break something?" against this ref, and it is the one
   thing that round cannot reconstruct on its own. Forgetting it silently costs the next round its
   regression check.
3. Map each finding to the task whose `Where` field covers its file. A finding that maps to no
   existing task becomes a **new task appended to `task.md`**, with `Requirement` pointing at the
   spec requirement it protects and a `Corrige: achado #N (rodada M)` line. Never an untracked edit
   — a fix nobody can trace is a fix nobody can review.

#### 2b.2 — Run the loop, scoped

For each task in `tasks_em_correcao` (plus any task added in 2b.1), in the original dependency
order, run §4's loop unchanged: 4.0 routing re-check → RED → GREEN → VERIFY → Post-Gate review →
scoped quality gate → commit. Every hard constraint of `implement.md` applies verbatim, and the
one that matters most here bears repeating: **a test is never weakened, deleted or skipped to close
a finding.** A finding that can only be closed by changing the test that catches it is not closed.

- **Do not re-run a task the verdict did not name.** Not to "check it still works" — the gates
  already do that.
- **One commit per finding** (or per group of findings sharing one fix), Conventional Commits,
  subject prefixed `fix(review):` and the body naming `achado #N · rodada M`. This is what makes the
  correction diff self-describing to the next round.

#### 2b.3 — Answer every finding, including the ones you disagree with

A finding you judge to be a false positive is **not** silently skipped. Skipping it in silence is
how the same finding comes back every round: the reviewer has no reason to change its mind about an
argument it never saw.

Write the disagreement down in `sessao-dev.md`'s `contestacoes` — the finding number and the
argument, citing the code that makes the case. §2c hands it to the next round, which must answer
`mantido` (with its own reason) or `aceito`. Either way the loop moves.

A finding that is real but cannot be fixed within this PBI's scope stays **open** — record it as a
Blocker (step-05 §3) and say so. Out of scope is not resolved.

#### 2b.4 — Record what happened, then route back

Append to the **body** of `{pasta_pbi}/sessao-dev.md` (not the frontmatter):

```markdown
## Correções — rodada {M}

| # | Severidade | Task | O que foi feito | Commit |
| - | ---------- | ---- | --------------- | ------ |
```

Round N+1 reads this table to state corrigido / parcialmente corrigido / em aberto with evidence,
instead of re-deriving it from the diff. `review.md` is **not** touched here — it belongs to
`doninha-copy-writer`.

Update the frontmatter: `correcao_rodada: {M}`, `base_correcao`, `proxima_fase: 'fechamento'`.
Leave `status` exactly as it is (§7's rule applies here too). Then route back to
`step-05-fechamento.md`, which re-runs §2b's gates and re-enters §2c.

### 3. Read the execution plan

Load `{pasta_pbi}/task.md`'s Execution Plan and Parallel Execution Map. This defines the order: phases in sequence, tasks within a `[P]` group eligible for concurrent execution, backend phases before frontend phases (AD-004, already baked into the plan by step-03).

### 4. For each task, in order: run the implementation loop

For every task (or every task in a `[P]` group, handled concurrently per step 5 below):

#### 4.0 — Step 0: re-check specialist routing (execute-time checkpoint)

Per [references/gap-routing.md](../references/gap-routing.md) Checkpoint 2 — this is a **re-check**, not a reuse of the planning-time assignment recorded in `task.md`'s `Tools` field:

1. Re-run the routing check for this specific task against the current codebase state.
2. **Matches the planning-time assignment:** proceed, invoke the mapped skill(s) now, before reading or writing any code for this task.
3. **Diverges** (codebase shifted since step-03, or the planning-time guess was wrong): invoke the newly-derived skill(s) instead, and note the change in the task's entry in `task.md` — never silently keep executing under the stale assignment.
4. **Mapped skill not installed:** warn once, proceed with the generic discipline in `implement.md` — never block.
5. **Maps to no specialist domain** (pure config/docs/infra scripting): skip straight to 4.1.

6. **Re-read the naming contract before writing the first identifier.** It is in `spec.md`'s
   **Decisões técnicas** table, resolved once in step-03 §4.0. Follow it — it is not re-opened per
   task, and a task that names things its own way is how one PBI ends up speaking two languages.
   If the contract is marked `EM ABERTO`, that is the `Bloqueado por` case: ask now, do not pick.

Follow the invoked skill's own handoff instructions and conventions for the remainder of this task — they take precedence over the generic guidance below wherever they overlap.

#### 4.1 — Run the RED→GREEN→VERIFY→COMMIT loop

Apply [references/implement.md](../references/implement.md) steps 0–10 to this task exactly as written there:

1. State assumptions, files to touch, success criteria (Pre-Implementation).
2. Verify this task's `Depends on` are already done; if blocked, stop and ask rather than reordering silently.
3. **RED** — write the task's `Tests` (per its field in `task.md`) before any implementation; confirm they fail.
4. **GREEN** — minimum implementation to satisfy "Done when"; never modify/weaken/delete/skip the tests written in RED.
5. **VERIFY** — run the gate check at this task's `Gate` tier (quick/full/build), commands sourced from the target project's own `TESTING.md`. Non-zero exit = STOP, fix, re-run. Do not proceed on a red gate.
6. **Post-Gate review** — test count check (no silent deletions), `SPEC_DEVIATION` marker added if implementation diverged from spec/design, altitude read on complexity.
7. **Scoped Quality Gate** — `implement.md` step 7b: invoke `doninha-quality-gate` at scope `per-task` with this task's changed-file list and the `quality_gates` resolution, per [references/quality-gate.md](../references/quality-gate.md). Unresolved finding = fix, re-run, do not commit. Tool unavailable = SKIP with reason, continue. Gate off in config = DISABLED, not run.
8. **Commit** — one atomic commit for this task, Conventional Commits 1.0.0, referencing what was done.

### 5. Delegation to sub-agents

Tasks may be executed by sub-agents rather than inline. A "sub-agent" here is a **generic worker** — a plain delegation of this same loop with the payload below. It is never one of the `doninha-*` agent definitions: those belong to a different, agent-driven flow and are never invoked from this skill.

- **`[P]` group:** one sub-agent per task in the group, run concurrently.
- **Sequential tasks:** one sub-agent at a time, in dependency order — or run inline; either is acceptable as long as the loop in step 4 is followed unmodified.

Each sub-agent receives, and only receives:

- That task's own definition from `task.md` (What/Where/Depends on/Reuses/Done when/Tests/Gate) — never other tasks' definitions.
- The relevant coding conventions (the `doninha-code-practices` skill, and the invoked specialist skill's conventions from Step 0, if any).
- The target project's own `TESTING.md`, if it exists.
- [references/quality-gate.md](../references/quality-gate.md) plus the `quality_gates` resolution from `sessao-dev.md` — the sub-agent runs the scoped quality gate itself, as part of the loop, before its own commit, without re-reading `quality-gate.yml`. A sub-agent never commits on an open finding.
- Any spec/design context this specific task references (relevant slice of `spec.md`, `DESIGN.md`/`EXPERIENCE.md` if the task is frontend/UI) — not the full session history.

The sub-agent runs the loop in step 4 and reports back: done/blocked/partial, tier-gate result, scoped quality-gate result (per gate, including any SKIP and its reason, and any DISABLED gate), commit hash. This orchestrating flow (step-04 itself) keeps all planning and validation — it decides what happens next (proceed, re-route, stop for the user), it never delegates that judgment to the sub-agent.

### 6. After each task completes

1. Mark the task's checkbox complete in `{pasta_pbi}/task.md`.
2. Update `{pasta_pbi}/spec.md`'s Requirement Traceability table: progress the status of every Requirement ID this task satisfies.
3. If implementation diverged from spec/design, confirm the `SPEC_DEVIATION` marker (per `implement.md` step 7) was actually added at the point of divergence — don't just note it in chat.
4. Update `{pasta_pbi}/sessao-dev.md` progressively (see step 7) — do not wait until every task is done to touch it once.

### 7. Update `sessao-dev.md` progressively

After each task (or after the quick-mode commit, if step 2 took that path):

```yaml
stepsCompleted: [1, 2, 3, 4]   # once the first task of this step completes
```

Optionally track finer-grained progress (e.g. a running count of tasks done vs `total_tasks`) in the session file's own notes area if the template supports it — but the frontmatter contract only requires `stepsCompleted` and `proxima_fase` to be accurate at every point, never stale.

When every task in `task.md` for this pass is complete (or quick-mode's single deliverable is done and verified):

```yaml
stepsCompleted: [1, 2, 3, 4]
proxima_fase: 'fechamento'
```

This updates the fields shown above and nothing else. `status` stays `developing` for the whole
of this step, however many tasks land — the pass being finished is not the PBI being finished,
and `step-05-fechamento` is the only place that decides between `done` and `paused`.

### 8. Route to the next step

Load `./step-05-fechamento.md`.

---

## SUCCESS METRICS

- Every task in `task.md` executed in dependency order, respecting `[P]` groups and AD-004 (backend before frontend)
- Step 0 (execute-time gap-routing re-check) run before any code for every single task, even when the result is "no specialist" — never skipped, never assumed from planning time without re-checking
- A diverging routing result at execute time invoked the newly-derived skill and was noted, not silently executed under the stale planning-time assignment
- A missing specialist skill produced a warning and continued with the generic discipline — never blocked a task
- Every task followed RED→GREEN→VERIFY→Post-Gate→Quality Gate→Commit from `implement.md` unmodified — no test weakened, skipped, or deleted; gate check mandatory and non-negotiable at its assigned tier
- The scoped quality gate (`doninha-quality-gate`, scope `per-task`) ran for every task before its commit, with the changed-file list passed explicitly — every finding either resolved, or confirmed pre-existing and deferred to `.doninha/STATE.md`
- A quality gate that couldn't run was reported as SKIP with its reason and did not block; no skipped gate was reported as passing, and no gate was silently omitted
- Gate 3 (complexity) ran only when `quality_gates.complexity` was on; when off it appeared as DISABLED in every task's report — never run, never a Blocker, never mistaken for SKIP
- One atomic commit per task (Conventional Commits 1.0.0); no task committed on a failing tier gate or on an open quality-gate finding; no batched multi-task commits
- `task.md`'s checklist and `spec.md`'s Requirement Traceability table updated after every task, not in a single end-of-pass batch
- `SPEC_DEVIATION` markers present wherever implementation diverged from spec/design
- `sessao-dev.md` kept current throughout (`stepsCompleted`), reaching `stepsCompleted: [1, 2, 3, 4]` and `proxima_fase: 'fechamento'` once the pass is complete
- Quick-mode substitution (when the whole PBI is trivial: ≤3 files, one-sentence scope) considered explicitly before task 1, applied instead of the full loop only when it genuinely fits, same quality bar maintained either way
- Sub-agent delegation, when used, respected scope isolation — each sub-agent received only its own task's definition, relevant conventions, `TESTING.md`, and the spec/design slice it needed — never other tasks' definitions or unrelated session history
- A correction pass (§2b) recorded `base_correcao` before its first commit, stayed inside `tasks_em_correcao`, committed one `fix(review):` commit per finding, and wrote the `## Correções — rodada {M}` table into `sessao-dev.md`'s body
- Every blocking finding of the round was either fixed, contested in writing under `contestacoes`, or left explicitly open as a Blocker — none silently skipped
- Correct routing to `step-05-fechamento.md`
