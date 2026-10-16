# Step 3: Spec & Tasks

## MANDATORY RULES

- `spec.md` and `task.md` are written **directly by this skill**, inside `{pasta_pbi}` — the PBI's own canonical folder from step-01/02. Never through any canonical-docs authoring skill, and never touching this project's tracker-sync artifact — those are working state for this flow, not canonical product docs.
- The PBI's acceptance criteria are immutable (`ca_imutaveis: true`, set in step-02) — normalize and structure them here, never re-derive or silently override them.
- `spec.md` follows the format in [references/specify.md](../references/specify.md); `task.md` follows the format in [references/tasks.md](../references/tasks.md). Both formats ship with this skill — apply them as-is, don't reinvent the structure here.
- Every task that touches backend, frontend, or UI code gets its specialist skill recorded in its `Tools` field, resolved per [references/gap-routing.md](../references/gap-routing.md) — never guessed, never a hardcoded stack keyword.
- Backend tasks are ordered before frontend tasks within the same PBI (AD-004) — regardless of the order they were first drafted in.
- A UI gap (frontend task, no existing `DESIGN.md`/`EXPERIENCE.md` pair for this PBI) blocks emitting frontend tasks until `doninha-ux` produces that pair — or, if `doninha-ux` isn't installed, a warning is issued and generic task generation proceeds anyway. Never block delivery on a missing specialist skill.
- Run all three mandatory pre-approval validation checks from `tasks.md` before showing anything to the user — Granularity, Diagram-Definition Cross-Check, Test Co-location. Any failing check must be fixed before presenting, not shown with a caveat.
- **The technical-doubt gate (§4) runs before `spec.md` is written, and it is a STOP of its own.** Anything the codebase does not settle — or settles with more than one live pattern — is asked there, once, in one batch, with `file:line` evidence behind every option. Nothing in this step invents an answer the project never gave: an unanswered doubt is recorded as `EM ABERTO`, never resolved by preference.
- **STOP for explicit user approval** of the generated `spec.md` + `task.md` before routing to implementation. Nothing gets implemented off the back of this step alone. This is a **different** STOP from §4's: §4 decides what the spec will say, §11 decides whether what it says is right.

---

## SEQUENCE

### 1. Read session state and confirm loaded context

From `{pasta_pbi}/sessao-dev.md`, confirm `artifacts_loaded`, `ca_imutaveis: true`, and `stepsCompleted` include `[1, 2]`. If something step-02 was supposed to load is missing from `artifacts_loaded` and looks needed here, load it now rather than restarting step-02.

### 2. Load the project's own test-coverage convention

Look for a `TESTING.md` (or equivalent) already summarized in step-02 from `.doninha/docs/codebase/*` — its location varies by project, don't assume a fixed path. Its Test Coverage Matrix and Parallelism Assessment drive:

- which tasks must co-locate tests (never a separate task) and at which gate tier (quick/full/build)
- which tasks can be marked `[P]` for parallel execution

If no such convention exists (greenfield project, or it lives somewhere step-02 didn't find), **do not ask here** — record it as a doubt for §4 and let it go out in that one batch, with the evidence of whatever test files the project actually has. Scattering the question here is how the user ends up answering the same kind of thing three times in one step.

### 3. Derive the stack→skill map for this PBI

Per [references/gap-routing.md](../references/gap-routing.md) Step 1: read `.doninha/docs/codebase/*` to build this session's task-domain → specialist-skill map (backend / frontend / UI). This map is derived fresh here — never cached from a previous session, never hardcoded in this step.

If `.doninha/docs/codebase/*` is missing or too thin to route confidently, **record it as a doubt for §4** rather than asking here or guessing — one question per ambiguous domain, its options naming the real module paths. A wrong routing decision cascades into the wrong specialist skill's conventions being applied later, so it is never guessed; it is just asked in one place.

### 4. Consolidated technical-doubt gate

Everything above is loaded. This is the last point where a question is cheap: after §5 the spec
asserts things, after §6 the tasks are built on them, and after implementation starts a wrong
assumption costs a review round.

**Read first, ask second.** A doubt is only a doubt after you looked for the answer. Anything
settled by `.doninha/docs/codebase/*`, `decisions.md`, `DONINHA.md`, `.doninha/STATE.md`,
`TESTING.md`, or one grep through the real code is **not asked** — it is recorded as a decision
with its evidence. The gate runs after the search, never instead of it.

#### 4.0 — Resolve the naming contract first

Before any other doubt, settle **what the code is allowed to be called** — which language domain
identifiers speak, and which term names each concept. Load `doninha-ubiquitous-language` and apply
its §0 precedence; if it is not installed, apply the precedence anyway, it is the part that
matters:

| Order | Authority |
| --- | --- |
| 1 | The project's real code and `.doninha/docs/codebase/conventions.md` |
| 2 | `DONINHA.md` team policy, when it states a naming or language rule |
| 3 | `doninha-ubiquitous-language`'s own default (domain in English) |

- **One clear pattern in the codebase** → follow it and record it as a decision with its
  `file:line`. **Do not ask** — the project already answered, and asking again invites the user to
  contradict their own code.
- **No pattern, or two competing ones** → it becomes a question in this batch, with the real
  precedents as options and the Doninha default offered as one of them.

This comes first because it is the decision every other line depends on: resolved after the code
exists, it is a rename — the change nobody schedules. And it runs **here**, not at the quality gate,
because a gate that catches naming has already let the whole PBI be written wrong.

Never carry a naming rule from another project, from this skill's examples, or from the language
these instructions happen to be written in. A project whose code speaks Portuguese is not
misnamed — it is decided.

#### 4.1 — What qualifies

Four triggers, each requiring that the scan already ran:

1. **The codebase is silent.** The implementation has to choose and nothing in the project settles
   it: error semantics, defaults, pagination limits, idempotency, timezone handling, retry policy,
   feature-flag gating.
2. **More than one live pattern.** Two or more competing precedents in this same codebase for the
   same concern, and nothing says which one is current. Each option cites `file:line`.
3. **An external contract nothing names.** A route, event/topic name, table or column, config key,
   or permission scope this PBI creates and that no existing code or doc names. The **naming
   contract** of §4.0 lands here when the codebase left it open.
4. **Something the spec would otherwise invent.** Anything §5 is about to assert as a `SHALL`
   without evidence behind it.

#### 4.2 — What does not qualify

This half is what keeps the gate from becoming an interrogation. None of these is asked:

- **Exactly one pattern exists** → follow it, record it as a decision with its `file:line`, move on. This covers naming: a codebase that consistently names in one language has already decided, and re-asking is noise.
- Anything a linter or formatter already owns.
- Anything already decided upstream — `decisions.md`, the CA themselves, an approved
  `DESIGN.md`/`EXPERIENCE.md`.
- A question whose answer changes no line of code and no test.
- Re-litigating the CA. They are immutable; a CA too vague to normalize is §5's pushback, a
  different mechanism with a different shape.
- Anything outside this PBI's scope.
- Preference with no technical consequence.

**Zero doubts is a valid and common outcome.** Say it in one line — *"Nenhuma dúvida técnica: o
codebase decide todas as escolhas desta PBI"* — and go to §5. A gate that always finds something to
ask is a gate that stopped discriminating.

#### 4.3 — Budget

Aim for **one round of at most 4 questions**. A second round is allowed when the doubts are
genuinely independent and did not fit. Past **8**, the signal is not "more to ask" — it is that the
PBI reached here under-analyzed: say so and offer going back to `doninha-analisar` instead of
interviewing your way through a bad decomposition. Above the target, roll up by decision area
rather than dropping questions.

#### 4.4 — Ask

**Use the `AskUserQuestion` tool if available; otherwise output the questions as a numbered plain-text
block and stop until the user responds.** One doubt per question:

| Field | Content |
| --- | --- |
| `question` | What has to be decided, why the codebase does not decide it (no precedent / two live patterns), and what the choice affects |
| `header` | ≤12 chars, the decision area (`Erro`, `Paginação`, `Retry`, `Naming`) |
| `options[].label` | 1–5 words naming the option |
| `options[].description` | The precedent — `file:line` — and the consequence of choosing it |
| `options[].preview` | The actual code of that precedent. This is what makes two competing patterns comparable instead of two labels |
| `multiSelect` | `false` |

Put the recommended option **first**, with `(Recomendado)` in the label and the reason drawn from
the code itself — not from preference. The tool injects "Other", so never add an "outro" option;
instead tell the user in the `question` text that they can use it to write `você decide` (you pick
the most recent pattern and mark the decision `assumida`) or `pular`.

**Every option cites evidence.** A question with no `file:line` behind any option is either a real
gap — say *"não encontrei nada no código sobre isso"* — or it is not a question.

Plain-text fallback, same content:

> **1. {o que precisa ser decidido}**
> O codebase não decide: {não há precedente | há dois padrões vivos}.
> - **[1a]** {opção} — precedente: `src/x/y.ts:88`
> - **[1b]** {opção} — precedente: `src/a/b.ts:142`
> Afeta: {requisitos/tasks}. Sugestão: **[1a]**, porque {razão tirada do próprio código}.
>
> Responda como `1a, 2b, 3-pular`. O que ficar sem resposta vira decisão em aberto registrada na
> spec — não invento.

**STOP — wait for the answers.** No question is answered on your own authority, except the ones the
user explicitly delegated with `você decide` — and those are recorded as `assumida`, never as the
user's decision.

**This is the second STOP in this step, and it is not the approval one.** §13 asks whether the spec
and tasks are *right*; this gate decides what the spec is going to *say*. Collapsing them means the
user approves a spec built on guesses, which is the failure this whole section exists to prevent.

#### 4.5 — No answer means a question, never an invention

A doubt the user skipped is written into `spec.md`'s **Decisões técnicas** table with
`Escolha: EM ABERTO`, added to `duvidas_em_aberto` and `riscos` in `sessao-dev.md`, and every task
that depends on it carries `Bloqueado por: decisão EM ABERTO #{n}`. Step-04's §4.0 re-asks it at
execute time instead of picking one. An unanswered question stays a question; it never becomes an
assumption with no one's name on it.

#### 4.6 — What gets recorded

Every answer, **and every decision the codebase made for you**, becomes a row in `spec.md`'s
**Decisões técnicas** table with its evidence. The naming contract of §4.0 is always one of those
rows — including, and especially, when nobody was asked: "identificadores em português, conforme
`src/acervo/consultar-exemplar.js:5`" is the line that stops task 4 from renaming what task 1
established, and the line the reviewer measures against instead of against a default.

### 5. Generate `spec.md`

Follow [references/specify.md](../references/specify.md) end to end:

1. Load the existing CA (from the tracker work-item in ado mode, or from this PBI's own `pbi.md` in local-only mode) — already loaded in step-02, treated as fixed.
2. Normalize each CA into `WHEN [event/action] THEN system SHALL [behavior]`. Anything that can't be rewritten this way is too vague — stop and flag it to the user instead of guessing a shape for it.
3. Surface edge cases the original CA didn't cover (boundaries, empty/huge input, error paths, unexpected input) as their own WHEN/THEN/SHALL lines.
4. Assign a unique Requirement Traceability ID to every CA and every edge case (`[PBI-SLUG]-[NUMBER]`).
5. Derive the **e2e scenarios** from the requirements above, before any code exists. Every Requirement ID that describes a user flow gets an `E2E-NN` scenario naming the ids it verifies; every id that does **not** goes in the "Fora do e2e" table with the reason. Write them in the project's own test vocabulary, read from `TESTING.md` — the given/when/then of the template is the fallback for a project without one.

   This is the step's own reason to exist: written at coding time, the e2e test mirrors what was built; written here, it verifies what was agreed, and the developer starts knowing exactly what has to pass. Do **not** decide the test *type* here (that is the coverage matrix in §2) — decide the *scenario*.
6. Write `{pasta_pbi}/spec.md` using the template in `specify.md` — Scope, Out of Scope, **Decisões técnicas** (filled from §4's answers), Acceptance Criteria, Edge Cases, Cenários e2e, Requirement Traceability, Success Criteria. Reference the parent feature's artifacts and `sessao-dev.md` by path; never re-paste their content.
7. Confirm with the user that the normalized CA + surfaced edge cases + e2e scenarios are **complete** — this replaces the "approve the discovery" checkpoint that doesn't apply here (the CA already exist). If the user flags something as incomplete, revise before moving to tasks.

### 6. Break the PBI into atomic tasks

Follow [references/tasks.md](../references/tasks.md)'s process:

1. Review `spec.md` (just written) as the source for every task's `Requirement` field.
2. Break the PBI into atomic tasks — one task = one component, one function, one API endpoint, or one file change. Co-locate each task's required tests per the coverage matrix loaded in §2 — tests are never a separate task.
3. Define `Depends on` for each task.
4. Route each task's `Tools`/`Skill` field using the map derived in §3 above. A task spanning more than one domain (e.g. a full-stack task) records every skill that applies.
5. Group tasks into execution phases; mark `[P]` only where dependencies and test parallel-safety both allow it.

**Safety valve:** if, while listing tasks, the breakdown grows past roughly 5 phases or the dependency graph becomes hard to state cleanly in one diagram, stop and reconsider before finishing the listing — either the PBI's scope has drifted wider than one unit of work (a signal to go back to `doninha-analisar`, not to keep splitting tasks here), or the tasks themselves need regrouping into cleaner phases. This should rarely trigger, since one PBI is already a bounded unit of work by the time this step runs — but state the check explicitly rather than skipping it.

### 7. Apply the ordering rule (AD-004)

When building the execution plan/dependency graph, place every backend-domain task ahead of every frontend-domain task in the same PBI, regardless of the order they were first drafted in.

### 8. Apply the UI-gap rule before emitting frontend tasks

For any task routed to the frontend/UI domain: check whether `{pasta_pbi}` already contains **both** `DESIGN.md` and `EXPERIENCE.md` (per what step-02 loaded into `artifacts_loaded`).

- **Both present:** route straight to the frontend specialist skill for those tasks — no need to re-invoke the UX skill.
- **Either missing, and the UX specialist skill is installed:** invoke it now, before finalizing or emitting any frontend task in `task.md`. Wait for it to produce the `DESIGN.md`/`EXPERIENCE.md` pair, then use that pair as the contract for those tasks.
- **Either missing, and the UX specialist skill is not installed:** warn the user once that this PBI's frontend tasks will proceed without a design/experience contract, and generate them generically instead. Never block on this.

### 9. Run the three mandatory pre-approval validation checks

Before presenting anything to the user, per `tasks.md`:

1. **Task Granularity Check** — every task is one component/function/endpoint/file change; anything broader gets split.
2. **Diagram-Definition Cross-Check** — every task's `Depends on` field has a matching arrow in the execution diagram and vice versa; no `[P]`-marked task depends on another `[P]` task in the same phase.
3. **Test Co-location Validation** — every task's `Tests` field matches what the coverage matrix (§2) requires for the code layer(s) it touches; `Tests: none` is only valid when the matrix says so, or no such convention exists and the user confirmed no tests are expected.

Any ❌ in any check means restructuring the tasks and re-running the checks — never present a failing check to the user with a request to approve anyway. Include both validation tables in what gets presented.

### 10. Write `task.md`

Write `{pasta_pbi}/task.md` using the template in `tasks.md` — Execution Plan (phased diagram), Task Breakdown (What/Where/Depends on/Reuses/Requirement/Tools/Done when/Tests/Gate/Commit per task), Parallel Execution Map, and both validation tables from step 8.

### 11. Present spec + tasks and stop for approval

> "**spec.md** e **task.md** gerados para **{titulo}** (`{pasta_pbi}`):
>
> 📋 `spec.md` — {N} critérios de aceite (+ {M} edge cases), todos com Requirement ID
> 📋 `task.md` — {N} tasks em {N} fases · skills envolvidas: {lista de skills_necessarias}
>
> Backend antes de frontend, conforme AD-004. {Nota sobre doninha-ux, se invocado ou se ausente e ignorado.}
>
> Checks de validação: Granularidade ✅ · Diagrama×Dependências ✅ · Co-localização de testes ✅
>
> Revise os arquivos. Aprova para avançar à implementação? **[S]** Sim | **[Ajustar X]**"

**STOP — wait for explicit approval before routing to step-04.** Do not begin implementation off an implicit approval unless the user's original invocation already made continuation of this whole run explicit.

### 12. Update `sessao-dev.md`

```yaml
duvidas_resolvidas: true
decisoes_tecnicas: {N}     # rows in spec.md's Decisões técnicas table
duvidas_em_aberto: []      # the ones the user skipped, if any
spec_construido: true
total_tasks: {N}
skills_necessarias: ['{aggregated set of specialist skills used across every task in task.md}']
stepsCompleted: [1, 2, 3]
proxima_fase: 'implementar'
```

This updates the fields shown above and nothing else. `status` stays `developing` — only
`step-01-identificar` (seed) and `step-05-fechamento` (`done`/`paused`) ever write it.

### 13. Route to the next step

Load `./step-04-implementar.md`.

---

## SUCCESS METRICS

- `spec.md` written directly to `{pasta_pbi}/spec.md`, following `references/specify.md`'s format — CA normalized to WHEN/THEN/SHALL, edge cases surfaced, every line with a Requirement Traceability ID
- `Cenários e2e` present in `spec.md` **before** any task is written: every requirement that
  describes a user flow either has an `E2E-NN` scenario naming it, or a line in the "Fora do
  e2e" table saying why not — no requirement silently uncovered, no scenario invented later at
  coding time
- `task.md` written directly to `{pasta_pbi}/task.md`, following `references/tasks.md`'s format — atomic tasks with What/Where/Depends on/Reuses/Requirement/Tools/Done when/Tests/Gate/Commit, `[P]` markers only where dependency + test parallel-safety both allow
- Neither file goes through any canonical-docs authoring skill, and neither touches this project's tracker-sync artifact — both are this skill's own working state
- Every backend/frontend/UI task's `Tools` field carries the specialist skill resolved via `references/gap-routing.md`, derived fresh from `.doninha/docs/codebase/*` — no hardcoded stack keyword
- `skills_necessarias` in `sessao-dev.md` aggregates the full set of specialist skills used across `task.md`
- Backend tasks ordered before frontend tasks in the same PBI (AD-004)
- Any frontend task without an existing `DESIGN.md`/`EXPERIENCE.md` pair triggers `doninha-ux` first (if installed) before that task is finalized/emitted — or a warning + generic generation if not installed, never a block
- Safety valve stated and checked when the task breakdown grows past ~5 phases or its dependency graph gets hard to state cleanly
- The technical-doubt gate ran before `spec.md` was written, with every option citing `file:line` and the recommended one first; a concern the codebase answers with a single consistent pattern was followed and recorded, not asked
- The naming contract (§4.0) was resolved before anything else and recorded in `spec.md` as a decision with evidence — followed from the codebase when it had one clear pattern, asked when it had none or two, and never imported from another project or from this skill's own examples
- Zero doubts, when that is the truth, was stated in one line rather than padded into questions; more than 8 doubts was reported as a decomposition problem, not answered as an interview
- Every doubt the user skipped is in `spec.md`'s Decisões técnicas as `EM ABERTO`, in `duvidas_em_aberto`, and named in the `Bloqueado por` field of every task that depends on it — none silently decided
- `spec.md` carries a **Decisões técnicas** table where every row has evidence (`file:line`) or is marked `EM ABERTO`
- All three mandatory validation checks (Granularity, Diagram-Definition Cross-Check, Test Co-location) run and pass before presenting to the user
- Explicit user approval obtained before routing to `step-04-implementar.md`
- `sessao-dev.md` updated: `spec_construido: true`, `total_tasks`, `skills_necessarias`, `stepsCompleted: [1, 2, 3]`, `proxima_fase: 'implementar'`
