# Step 1: Scope

## MANDATORY RULES

- **Never modify code**, in this step or any other. This skill documents; `doninha-desenvolver` fixes.
- **Resolve the project root before anything else.** Every `.doninha/` path in this flow means the resolved root, not a literal relative path.
- **Never presume the mode.** Infer it, and when the inference is not safe, ask.
- **Never invent a scope.** A review of a diff you could not resolve is worthless — stop and ask instead.
- Communicate in **PT-BR**.

---

## GOAL OF THIS STEP

Know exactly what is being reviewed, in which mode, as which round — and have a session tracker on disk that can survive an interruption.

---

## SEQUENCE

### 1. Resolve the project

If the user referenced a file or folder path, walk up from it until `.doninha/` is found — that is `DONINHA_ROOT`. Otherwise invoke `doninha-workspace-detection` and use what it resolves.

In a multi-repo workspace, also resolve which repo the change lives in: the codebase docs are per-repo with fallback (prefer `repos/<name>/.doninha/docs/codebase/*`, else the root). Record the resolved `<CODEBASE_DIR>`; step-02 uses it.

If no `.doninha/` exists anywhere above, this project has no Doninha harness. Say so and offer to review in DIFF mode anyway — the five pass skills still work, they simply lose the project-conventions context.

### 2. Detect the mode

Signals for **PBI**:

- The user named a PBI id or slug.
- A `sessao-dev.md` exists for a PBI whose branch or recent commits match the current work.
- The current branch name maps to a PBI folder.

Signals for **DIFF**:

- The user named a PR, branch, commit range or path.
- The user asked to review "o diff", "meu PR", "essa branch".

**"No PBI folder found" is not a DIFF signal on its own.** When the user names something that behaves like a work item — a feature or PBI slug, an id — and the `.doninha/docs/modules/**/pbis/` layout has no match, look for a **spec/task pair under another layout** before concluding anything. A project may track its own work elsewhere: `.specs/features/{slug}/{spec,tasks}.md` is a common alternative layout. Requirements written down are requirements, whatever folder holds them.

- Pair found → offer PBI mode against those files. Pass 1 works from any spec; it needs acceptance criteria, not a specific path. The output still goes to `.doninha/reviews/` when there is no `status.yml` to key off — say that when offering.
- Nothing found anywhere → **ask**, do not assume:

  > Não encontrei artefatos de PBI para `{alvo}` — nem em `.doninha/docs/modules/`, nem em `.specs/`. Quer que eu revise como **[D]** diff avulso, ou você me aponta onde estão a spec e as tasks?

Falling to DIFF in silence is the failure mode to avoid: the user gets a review that never checked a single acceptance criterion and a report filed somewhere they were not expecting, with nothing in the output explaining why.

When the signals point one way, take it and say which mode you picked and why — the user can correct you in one word. When they conflict or nothing resolves, **STOP** and ask:

> Vou revisar em qual modo?
>
> **[P]** PBI — valido também os critérios de aceite contra a spec (passes 1–7)
> **[D]** Diff avulso — branch/PR/working tree, sem spec (passes 3–5)

Write the answer to `modo`. It is decided once and never re-inferred later in the flow.

### 3. Resolve the PBI folder (PBI mode)

**This runs before the scope, not after.** The scope's PBI branch reads `sessao-dev.md` for the round's commits and tasks, so resolving it after §4 would leave that precedence level unusable and silently fall through to the whole-branch diff.

Locate `pasta_pbi` and `feature_folder`. In local-only projects, search `.doninha/docs/modules/*/*/pbis/` for the id or slug; confirm with the user when more than one is plausible.

Read the PBI's `sessao-dev.md` to learn `tasks_revisadas` — the tasks this round covers. When it does not exist, ask the user which tasks are in scope rather than assuming all of them.

If the PBI folder cannot be found, do not fabricate one. Report it and offer DIFF mode.

### 4. Offer resume — before deciding anything else

A half-finished review of this same target may already exist, and everything below (the round number, the scope) is a **decision** that a resume must inherit rather than recompute. Deciding first and offering resume afterwards is how a session ends up with the round already incremented and `escopo_diff` already overwritten before the user is even asked.

The tracker belongs to one target: in PBI mode it lives in the PBI folder; in DIFF mode it is `.doninha/reviews/.sessao-review-{slug}.md`, keyed by the same slug the report uses. A single shared file would offer to resume branch A's review when the user asked for branch B.

If a tracker for **this** target exists with `stepsCompleted` short of `[1,2,3,4,5]`, ask:

> Encontrei uma revisão em andamento de `{alvo}` (rodada {N}, parou em {proxima_fase}). Quer **[C]** continuar de onde parou ou **[R]** recomeçar a rodada?

- **[C]** → adopt the tracker's `rodada` and `escopo_diff` **as they are**, skip §5 and §6 entirely, and jump to `proxima_fase`. Re-resolving the scope would review a different diff than the one already half-reviewed, producing a report about neither.
- **[R]** → discard the tracker and continue below as a fresh round.

A tracker whose recorded target does not match the one just resolved is stale, not a resume candidate: ignore it and continue below.

### 5. Determine the round

Only reached on a fresh start (no tracker, or **[R]**).

**PBI mode** — read the existing `review.md` in the PBI folder, if any. `rodada` is the highest `## Rodada de revisão {N}` found, plus one — otherwise `1`.

**DIFF mode** — read `.doninha/reviews/{slug}.md`, if it exists. `rodada` is the highest round heading in it, plus one.

A round greater than 1 changes what matters: the previous round's `critical`/`major` findings are the first thing to check in step-03, because the point of a re-review is whether they were actually addressed. Carry them into the session so step-03 can check them explicitly.

**Two kinds of round > 1, and they block differently.** A re-review of a correction answers "was it fixed?"; a fresh look answers "is this right?". Which one this is decides `escopo_correcao`, and through it the blocking rule in [references/severity-and-verdict.md](../references/severity-and-verdict.md) §6a.

- **Driven by `doninha-desenvolver`'s cycle** (it handed over a correction base): it is a correction re-review. Record that base as `escopo_correcao` and do not ask — the caller already answered.
- **Invoked by hand**: ask. **Use the `AskUserQuestion` tool if available; otherwise output the options as plain text and stop until the user responds.**

  > Rodada {N} desta PBI. Como quer que eu trate os achados?
  >
  > **[N]** Rodada nova (padrão) — reviso tudo no escopo e todo `critical`/`major` bloqueia, como na rodada 1
  > **[C]** Re-review de correção — bloqueio restrito ao que ficou aberto, ao diff da correção e a `critical` novo; o resto eu registro sem reprovar

  `[N]` leaves `escopo_correcao` empty, which is what preserves today's behaviour for a human-run review. `[C]` asks which commit the corrections started from and records it.

Never infer `[C]` from the round number alone. A round being the second one says nothing about whether a correction happened between them.

### 6. Resolve the review scope

Follow [references/diff-scope.md](../references/diff-scope.md) — the precedence order, the exclusions, and the size check all live there. In PBI mode its precedence level 2 now has what it needs, because §3 already resolved `pasta_pbi` and `tasks_revisadas`.

Confirm the resolved diff is non-empty by actually running it. An empty diff means either the change has not landed or the scope is wrong; in both cases report it and stop rather than producing an empty review.

Record `escopo_diff`, `arquivos_alterados` and `arquivos_fora_de_escopo`.

### 6b. Decide the review profile

The diff already tells you how much review it deserves. Deciding it here — once, from facts
already in hand — is what keeps a four-line fix from costing what a four-hundred-line one does.

**Count two things and look for one.** Changed source files, changed lines, and whether any
changed path carries a risk signal.

**Risk signals** — any one of them, at any size: authentication or authorization · validation or
parsing of external input · secret, token or crypto · money, price or billing · schema change or
migration · data deletion · concurrency or parallelism · public API contract · permission model.

| Profile | When | Passes | File bodies | Shape |
| --- | --- | --- | --- | --- |
| `leve` | ≤2 source files **and** ≤50 changed lines **and** no risk signal | 1 (PBI only) + 3 | diff plus the enclosing function — not whole files | inline, no fan-out |
| `padrao` | everything else | 1, 2 + 3, 4, 5 | per-pass filter (step-02 §1) | fan out |
| `profundo` | any risk signal, **or** >40 files | 1, 2 + 3, 4, 5 | per-pass filter, plus the dependencies a pass chooses to follow | fan out |

Three rules keep the profile from becoming an excuse:

1. **A risk signal is never outweighed by size.** Three lines under `auth/` is `profundo`. Size
   decides how much to read; risk decides whether reading less is allowed at all.
2. **The profile is declared in the report, always, with its reason** — *"Perfil `leve`: 1 arquivo,
   12 linhas, sem sinal de risco; passes 4 e 5 não rodaram."* A review that covered less has to say
   so, in the same breath as its verdict. Silence here turns a cheap review into a false claim of a
   thorough one.
3. **The user can move it either way**, in §7's summary. The profile is a default computed from
   the diff, not a decision taken away from them.

Record `perfil` in `sessao-review.md`.

> This is the inverse of the rule `phoenix-spec` applies to its scanner flags, and the difference
> is the point: there, inferring from the diff would fire a toolchain the user never asked to
> install. Here nothing new is fired — the review was already requested, and the inference only
> decides how deep it goes.

### 7. Seed the tracker

**Only on a fresh start.** A resume already has its tracker and must not have it overwritten — writing `stepsCompleted: [1]` over a session that had reached step 4 throws away the work the user just chose to keep.

Create the tracker from [assets/sessao-review-template.md](../assets/sessao-review-template.md), filled with everything resolved above, `stepsCompleted: [1]` and `proxima_fase: contexto`.

Then state the plan in one short block and **start reviewing** — do not stop for approval. The
profile was computed from the diff, and making the person confirm a default is how the review
spends the time it just saved.

> "Rodada {N} · perfil **{perfil}** ({motivo}) · {M} arquivos · passes {lista}.
> {Se N>1: 'Desde a rodada {N-1}, mais {K} arquivo(s) com achado em aberto.'}
> Ajuste com `--profundo`, `--leve` ou `--completo` (inclui `suggestion`) se quiser outro corte."

Stop and ask in exactly two cases, both already defined elsewhere: the scope did not resolve at all
([diff-scope.md](../references/diff-scope.md) §1.4), and the diff exceeds ~40 files (§5, where the
offer is to split into rounds). Everything else is a computed default that the report declares.

---

## SUCCESS METRICS

- `DONINHA_ROOT` and `<CODEBASE_DIR>` resolved, or their absence stated explicitly.
- `modo` decided by inference or by the user — never by default.
- PBI mode: `pasta_pbi`, `feature_folder` and `tasks_revisadas` resolved **before** the scope, or the flow switched to DIFF mode with the user's agreement.
- The diff command ran and produced a non-empty result; `escopo_diff` records it verbatim.
- `rodada` computed from the prior report for **this** target — the PBI's `review.md` or the matching slug in `.doninha/reviews/` — with prior blocking findings carried forward when N > 1.
- Round > 1: the scope is the diff **since the previous round** plus the files carrying open
  blocking findings, or the full-base fallback with the reason stated — never the whole branch
  re-reviewed by default.
- `sessao-review.md` exists on disk with `stepsCompleted: [1]`.
- The user saw the scope summary before any pass ran, and it named the profile and its reason.
- A profile was computed from the diff — never assumed — and any risk signal forced it to `profundo` regardless of how small the change was.
- At most two stop-and-ask points happened before the first pass: unresolved scope and the >40-file split offer.
