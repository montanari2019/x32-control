# Step 5: Closeout

## MANDATORY RULES

- This is the **terminal step** of `doninha-desenvolver` — there is no `step-06`. It ends in a summary to the user, not a route to another step file. The one loop that starts here is internal: §2c drives the review cycle and may route back into `step-04-implementar.md`'s correction pass before this step finishes.
- A **fully-complete PBI is never marked done, and its work item is never moved to a terminal state, before a review verdict exists** — or before §2c's round cap is reached. §2c runs before §3, and §5 (tracker sync) and §6 (`status`) both read its outcome. The only exception is a project where `doninha-code-review` is not installed: then §2c degrades to today's behaviour and the summary says the PBI closed unreviewed.
- **This step never edits code to satisfy a review finding.** Corrections re-enter `step-04-implementar.md` §2b; §2c only routes and waits. Finding and fixing stay separated here for the same reason `doninha-code-review` never patches its own findings.
- A **fully-complete PBI is never marked done on a red build/type-check, nor on an open quality-gate finding.** Before completion, §2b runs the Build-tier gate for every repo the PBI touched — before the review — and §2d runs the full quality gate once, after the review approved (`doninha-quality-gate` at scope `full` — the gates that scope runs are listed only in that skill's `## Scoped invocation` table, never here). A non-zero build or an unresolved finding blocks done-marking unless it is an explicitly-confirmed pre-existing failure recorded as a Blocker. A gate reported as SKIP (tool unavailable) does not block, but is always reported. Gates 3 (complexity) and 5 (SonarQube) run only when enabled in `.doninha/integrations/quality-gate.yml` (resolved in step-02 §5b); otherwise they are reported as DISABLED and left to the team's pipeline.
- Memory (decisions/blockers/lessons/deferred ideas) is recorded into `.doninha/STATE.md`. Primary path: delegate the write to the memory skill (`doninha-memory`) **if it is installed in this project** — discover its presence at runtime, never assume it exists just because this skill's own docs mention it. Fallback: write directly into `.doninha/STATE.md` yourself, under that file's own sections (Decisions Log / Blockers / Lessons Learned / Deferred Ideas) — no branding, no project-specific naming baked in.
- Status sync with an external tracker is **one-directional: local → tracker, never the reverse.** This step pushes the locally-known outcome (PBI done, or still in progress) onto the configured work-item. It never reads the tracker's current state back and lets it overwrite anything in `sessao-dev.md` or `.doninha/STATE.md`.
- **Never move a work item to its terminal/closed/finalized state without explicit user confirmation** — closing/finalizing a card is high-visibility and must be a deliberate, confirmed action, never automatic. The gate itself (prompt, options, decline behaviour) is owned and worded canonically by the Azure DevOps integration skill; this step invokes it and honors the outcome, it does not re-specify it. Non-terminal transitions (in-progress) need no confirmation.
- Status sync only runs when `sessao-dev.md`'s `modo` is `ado` (i.e. `.doninha/integrations/azure-devops.yml` is configured). When `modo` is `local-only`, skip this entirely — no error, no apology, just skip.
- Never hardcode a tracker org/project name, a literal integration-tool name, or a work-item state name here — resolve the integration skill and its state names from `.doninha/integrations/azure-devops.yml`, exactly as step-01 already did to read the item.
- A HANDOFF record is only written when the PBI is **not** fully done (some tasks in `task.md` remain, the user is explicitly pausing mid-PBI, or §2c hit the round cap with blocking findings still open). When every task is complete **and** the review approved, there is nothing to resume — mark the PBI done instead of writing a handoff.
- Close `sessao-dev.md`'s frontmatter last, after memory, handoff/done-marking, and status sync all landed — never mark the session closed before its trailing effects actually happened.

---

## SEQUENCE

### 1. Confirm entry state

From `{pasta_pbi}/sessao-dev.md`, confirm `stepsCompleted` includes `[1, 2, 3, 4]` and `proxima_fase: 'fechamento'`. If either is missing, step-04 didn't actually finish its pass — go back to it rather than closing out a session that isn't ready.

### 2. Determine the session outcome

Read `{pasta_pbi}/task.md`'s checklist:

- **Every task checked off** (or quick-mode's single deliverable landed): the PBI is **fully complete**.
- **Some tasks remain** (the user stopped mid-pass, hit a blocker step-04 couldn't resolve, or explicitly asked to pause): the PBI is **pausing mid-flight**.

If it's ambiguous whether the user wants to stop here or go back and finish the remaining tasks, ask before proceeding:

> "Ainda restam tasks pendentes em `task.md`. Quer encerrar a sessão aqui (deixando um handoff para retomar depois) ou voltar ao passo 4 para concluir?"

**STOP — wait for the answer if genuinely ambiguous.** If the invocation already made "wrap up now" explicit, proceed without asking.

### 2b. Build-tier gate, before the review (fully-complete PBIs only)

When the outcome is **fully complete**, each touched repo's **Build-tier** gate runs here, before
§2c reviews anything — a review of code that does not compile reports on nothing. The expensive
gates (coverage, checklist, SonarQube) are **not** here: they moved to §2d, after the review
approves, because they measure the PBI as a whole and the PBI is not whole while the review is
still sending work back.

Skip this whole step when the outcome is *pausing mid-PBI* — a handoff, not a completion, is being
written.

#### 2b.1 — Build-tier gate, per touched repo

Run each touched repository's Build-tier gate — even if no individual task declared a `build` gate. Per-task gates frequently run only the test tier, and some test runners transpile loosely without full type-checking, so a compile/type error can survive every per-task gate and only surface at build time. This is the PBI-level safety net that catches it.

For **each repository touched by this PBI**:

1. Look up the Build-tier command in that repo's `TESTING.md` (Gate Check Commands). If it defines a build / compile / type-check command (e.g. `npm run build`, `tsc`, `mvn compile`, `go build`), run it.
2. If `TESTING.md` names none but the project clearly has one (a `build` script in `package.json`, a compiler config like `tsconfig.json`), run that.
3. **Non-zero exit = the PBI is NOT done.** Either fix it and re-run, or — if it is a genuinely pre-existing failure unrelated to this PBI (confirm via `git stash` that it reproduces without this PBI's changes) — record it as a Blocker in step 3 and report it in the summary. Never mark the PBI complete on a red build without this explicit pre-existing determination.
4. If the project has no build/type-check step at all (interpreted project with only a test tier), skip this gate — note it, don't fabricate one.

### 2c. Review cycle

Green tests and a passing quality gate are not a review: they say the code runs, not that it does
what the PBI asked for. This is where that gets checked, and it runs **before** anything in this
step is made permanent — §5 pushes a terminal tracker state and §6 writes `status: 'done'`, and
both of them read the outcome of this section.

Skip this whole section when the outcome from §2 is *pausing mid-PBI*. A partial pass is not
reviewable, and a review of half a change reports on a state nobody will ship.

**`doninha-code-review` not installed** → warn once, record it in `sessao-dev.md`'s `riscos`, and
fall through to §3 with the PBI closing unreviewed (say so in §7). Never block on it — same
degradation posture as every specialist skill in this flow.

#### 2c.1 — Invoke the review

Load `doninha-code-review` **as a skill, in this context**, in PBI mode on `{pasta_pbi}`. Hand it
`pasta_pbi`, `feature_folder`, the tasks this round covers, and — from round 2 on —
`base_correcao` as the correction base its round scope should start from.

> **Never dispatch the review to a sub-agent.** Loaded here, its `step-03-passes` dispatches from
> this same top-level context, so its **fan-out over passes 3–5 runs in parallel exactly as it
> does standalone** — which is what keeps a round at the cost of its slowest pass instead of the
> sum of all of them. Inside a sub-agent that fan-out falls back to running the pass skills
> sequentially, and the review gets *slower*, not faster. It also loses
> `doninha-copy-writer` (so `review.md` is written raw and `status.yml → pbis.{slug}.review` never
> updates) and `doninha-documentation` (which gates on exactly that field, and would stay pending
> forever). This is not a preference — it is the difference between the review working and the
> review looking like it worked.

#### 2c.2 — Read the verdict from the tracker, not from prose

When the review finishes, read `{pasta_pbi}/sessao-review.md`: `veredito`
(`approved` | `changes-requested`), `rodada`, and the blocking findings with the task each maps
to. Reading the recorded field is what makes this loop mechanical — never infer the outcome from
the review's closing message.

Increment `review_rodadas` and record `review_veredito` and `review_artefato` in `sessao-dev.md`.

| Verdict | `review_rodadas` | Do |
| --- | --- | --- |
| `approved` | any | Proceed to §3. The PBI is reviewed. |
| `changes-requested` | `< 2` | Correction pass — §2c.3. |
| `changes-requested` | `== 2` | Round cap — §2c.4. |

#### 2c.3 — Correction pass, then re-review

1. Write `tasks_em_correcao` (the tasks the verdict pointed at) and `proxima_fase: 'correcao'` into
   `sessao-dev.md`, then route to `step-04-implementar.md` §2b.
2. When it returns, run the **scoped** gate, not the full one: the Build-tier gate for the repos
   the correction touched, plus `doninha-quality-gate` at scope `per-task` over the corrected files.
   The review still sees green code, and a correction that breaks the build is caught before it is
   reviewed.

   **The full gate does not run between rounds.** Coverage, the checklist and SonarQube measure the
   PBI as a whole, and the PBI is not whole until the review approves it — running them per round
   pays for the same measurement two, three, four times and delays the round that would have found
   the next defect. They run once, in §2d, after §2c ends in `approved`.
3. Re-enter §2c.1 as round N+1.

#### 2c.4 — Round cap: two automatic rounds, then it is the human's call

At `review_rodadas == 2` with blocking findings still open, **stop**. Do not run a third round and
do not start another correction pass.

The cap exists because the third round is where this stops being work and starts being motion: the
first review finds what is wrong, the correction answers it, the second review says whether the
answer held. A loop that keeps going past that is not converging, and the person who can tell why
is the user.

1. Copy the still-open blocking findings into `achados_em_aberto`, each with what the correction
   attempted and why it did not resolve it — from the `## Correções — rodada {M}` table plus round
   2's corrigido/parcialmente/em aberto verdicts.
2. Reclassify the session outcome from *fully complete* to **pausing**: §4 writes a handoff whose
   pending work is the open findings, §5 pushes the in-progress state and **never** the terminal
   one, §6 closes with `status: 'paused'`.
3. §3 logs each open finding as a Blocker in `.doninha/STATE.md`.
4. Present the cap report and ask for the decision — see §7.

#### 2c.5 — `status` is not written here

§6 remains the only writer of `status` in this step, and it writes exactly once, after this section
reached an outcome. While the review and its corrections run, `sessao-dev.md` still says
`developing` — because the work still is. The value set is closed (`developing | paused | done`)
and the engine hard-fails on anything outside it, so there is no "in review" value to invent and
none is needed.

#### 2c.6 — When the context is already tight

This section runs in a context that has carried a whole implementation pass. The fan-out isolates
five of the seven passes and round 2's scope is incremental, but on a large PBI the review's own
inline work can still strain what is left. If that happens, **stop and say so** rather than
producing a thin review that reads like a thorough one:

> A implementação está fechada e os gates passaram, mas o contexto desta sessão já está carregado
> e uma review feita aqui sairia rasa. Rode `doninha-code-review` nesta PBI (`{pasta_pbi}`) num chat
> novo e volte aqui — a sessão retoma daqui lendo o `sessao-review.md`.

The PBI stays `developing`, nothing is marked done, and re-entry resumes at §2c.2.

### 2d. Full quality gate — once, after the review approved

The per-task loop in step-04 ran only the cheap gates on each task's own diff. The expensive ones
were deferred to here, and **here is after §2c ended in `approved`** — not before it, and not once
per round.

The reason is what these gates measure: coverage, the checklist and SonarQube are statements about
the PBI as a whole, and the PBI is not whole until the review stops sending work back. Running them
before §2c measured a version that no longer exists by the time the corrections land; running them
per round paid for the same measurement four times on a PBI that needed four rounds. The review
only ever needed the build to be green, and §2b gives it that.

Skipped entirely when §2c hit the round cap: a paused PBI is not being marked done, and the gate
that guards done-marking has nothing to guard. Read [references/quality-gate.md](../references/quality-gate.md) for the split and the degradation rules; it is the routing contract, and this step does not restate the gate definitions.

Invoke the `doninha-quality-gate` **skill** at scope **`full`**, passing the list of files the whole PBI changed (`git diff --name-only` against the PBI's base) and the `quality_gates` resolution from `sessao-dev.md`. Invoking it means loading that skill in this context — never spawn a `doninha-*` agent to run the gate. **Which gates scope `full` runs is defined only by that skill's `## Scoped invocation` table** — never enumerate them here, and never drop one because this step doesn't mention it. What this step adds on top of the scope, for the gates that scope does run, for this flow only:

- **Gate 1 (static analysis)** — already covered by 2b.1's Build-tier run for each repo. Report that result; do **not** re-run build+lint.
- **Gate 2 (tests & coverage)** — the threshold for this flow is ≥80% line coverage measured **on the PBI's changed files**, not on the whole project.
- **Gate 3 (complexity)** — only when `quality_gates.complexity` is on; otherwise DISABLED. `complexity-check`'s `path` argument only sets the analyzer's root, so filter the returned findings to the changed-file list.
- **Gate 5 (SonarQube)** — only when `quality_gates.sonar` is on; otherwise DISABLED, and the presence of `sonar-project.properties` does **not** change that. When on, run it every time: `sonar-run`, then `get-sonar-issues` with `projectKey` from `quality-gate.yml`'s `sonar_project_key` or, failing that, `sonar-project.properties`' `sonar.projectKey`, and `filters.directories` scoped to the directories the PBI touched. Only issues, hotspots, and duplication **newly introduced by this PBI** count. An enabled Gate 5 is never skipped because it is slow — it is the one gate the per-task loop deliberately does not run.
- **Gate 6 (checklist verification)** — the checklist for this flow is `{pasta_pbi}/task.md`'s "Done when" items plus `{pasta_pbi}/spec.md`'s Requirement Traceability table. Every item must be genuinely satisfied by the code, not just checked off.

Then:

- **Unresolved finding = the PBI is NOT done.** Fix it and re-run the affected gate, or — if it is genuinely pre-existing and unrelated to this PBI (same `git stash` determination as 2b.1 step 3) — record it as a Blocker in step 3 and report it in the summary.
- **A gate that could not run** (`doninha-quality-gate` not installed, `doninha-mcp` unavailable, Docker missing, `SONAR_URL`/`SONAR_TOKEN` not configured) is reported as **SKIP with its reason** per `quality-gate.md`'s degradation cascade. A SKIP does not block done-marking — but it is never reported as PASS and never silently omitted from the summary.
- **A gate the project turned off** is reported as **DISABLED (off in quality-gate.yml)** — not SKIP, not a Blocker, not a gap. It is listed so the reader knows the check stayed with the team's pipeline.
- Carry the per-gate PASS/FAIL/SKIP/DISABLED result forward into step 7's summary table.

### 3. Record memory

Gather what surfaced during steps 1–4 that's worth remembering beyond this single session:

- **Decisions** — architectural/implementation choices with lasting effect (e.g. a routing divergence noted in step-04's Step 0, a `SPEC_DEVIATION` marker added during implementation, a quick-mode-vs-full-loop call), plus the entries of `spec.md`'s **Decisões técnicas** table whose effect reaches beyond this PBI — those were decided once, in step-03 §4, and the next session should not have to re-ask them.
- **Blockers** — anything that stopped or slowed a task and wasn't fully resolved (a missing specialist skill, an ambiguous CA that needed a stop-and-ask, an environment/dependency issue, a pre-existing build or quality-gate failure accepted in §2b or §2d, a gate reported as SKIP because its tooling was unavailable — a DISABLED gate is not a blocker). **Every finding still open when §2c hit the round cap is a Blocker**, one entry each, carrying what the correction attempted and why it did not hold; so is every finding the user chose to accept at the cap — accepting a finding records it, it does not erase it.
- **Lessons learned** — anything discovered about the codebase, test setup, or process that would help a future session avoid repeating the same investigation.
- **Deferred ideas** — anything raised during spec/task generation or implementation that was explicitly pushed out of this PBI's scope.

Check for a skill that owns this kind of persistent memory (`doninha-memory`) installed in this project:

- **Installed:** hand it the gathered items and let it follow its own event→action rules to write them into `.doninha/STATE.md`. Do not duplicate its write by also writing the same entries directly.
- **Not installed:** write directly into `.doninha/STATE.md` yourself, appending (never overwriting existing content) under sections shaped like:
  - `## Recent Decisions` — one entry per decision: title, date, decision, reason, trade-off, impact.
  - `## Active Blockers` — one entry per unresolved blocker: discovered date, impact, workaround (if any), resolution path.
  - `## Lessons Learned` — one entry per lesson: context, problem, solution, what it prevents next time.
  - `## Deferred Ideas` — one line per idea, tagged with which PBI/feature it was captured during.

  If `.doninha/STATE.md` doesn't exist yet, create it with just these sections populated — don't invent unrelated sections or port branding/terminology from any other project.

Skip this step's write entirely only if steps 1–4 produced genuinely nothing worth remembering (rare) — don't pad `.doninha/STATE.md` with empty-content entries.

### 4. Write a handoff, or mark the PBI done

Based on the outcome from step 2, as §2c may have reclassified it:

- **Pausing mid-PBI:** produce a handoff record — via `doninha-memory` if it owns handoff records too (same install-check as step 3), or written directly to `.doninha/HANDOFF.md` (overwriting any previous content there, it is a snapshot of the *current* pause, not a log) if the skill isn't installed. Either way, the record covers:
  - PBI identification (`titulo`, `item_id`/`ado_id` if any, `pasta_pbi`).
  - Completed so far: which tasks in `task.md` are checked off.
  - In progress: the specific task that was interrupted, and where (file/line if applicable).
  - Pending: the remaining tasks in dependency order.
  - Blockers: anything already logged in step 3 that's still open.
  - **Review findings still open** (cap outcome only): each one with its severity, file:line, the task it belongs to, what round 2's correction attempted, and why it did not resolve it. These *are* the pending work — list them in the order they should be attacked, not in the order they were found.
  - Context: current git branch, any uncommitted changes (there should be none if step-04's one-task-one-commit discipline held — flag it if there are), and a pointer back to `.doninha/STATE.md` for the fuller decision/blocker history.
- **Fully complete (review approved, or closed unreviewed because the skill is absent):** no handoff needed. Instead, note the completion plainly in `.doninha/STATE.md`'s current-work marker (if that convention is in use) so a future session doesn't go looking for a handoff that doesn't exist.

### 5. Sync status to the tracker (ado mode only)

Read `modo` from `sessao-dev.md`:

- **`local-only`:** skip this step entirely. No message needed beyond what's already in the final summary (step 7).
- **`ado`:** invoke the Azure DevOps integration skill configured in `.doninha/integrations/azure-devops.yml` (resolved by name/entry point from that config, never hardcoded) to push the outcome from step 2 onto the work item, mapped through that config's own states:
  - Fully complete → the config's "done"/equivalent state. **This is a terminal transition — CONFIRM with the user before applying it** (see below). Reaching this branch means §2c either approved the work or was waived; a PBI whose review has open blocking findings never gets here.
  - Pausing mid-PBI, **including §2c's round cap** → the config's "in progress"/equivalent state (or leave it as whatever "in progress" already is if no better state fits — never push "done" for partial work). Non-terminal → no confirmation needed. A capped PBI is work in progress with a written reason, and finalizing its card would tell the board the opposite.

  **Confirm before finalizing (MANDATORY).** The integration skill owns this gate — its "Confirm before closing / finalizing" section is the canonical wording, prompt, and options. Let it run; do not restate or improvise a variant of it here, and never push a terminal state that hasn't cleared it. The one consequence this step adds on top: if the user declines, the tracker state stays untouched **and the decline is noted in the closing summary** (step 7).

  This is a **write only**: read nothing from the tracker to reconcile back into `sessao-dev.md`, `task.md`, or `.doninha/STATE.md`. If the push fails (auth, network, stale item), report it plainly to the user and continue closing out the local session anyway — a failed remote sync never blocks local closeout.

### 6. Close `sessao-dev.md`

The `status` written here depends on the outcome classified back in step 2 and possibly
reclassified by §2c — the same fully-complete vs. pausing split that drove the handoff record and
the tracker sync:

- **Fully complete:**

  ```yaml
  status: 'done'
  stepsCompleted: [1, 2, 3, 4, 5]
  proxima_fase: 'concluida'   # cleared of any next-step name — this session has nothing left to route to
  ```

- **Pausing mid-PBI:**

  ```yaml
  status: 'paused'
  stepsCompleted: [1, 2, 3, 4]   # step 5 did not close the PBI — do not claim it did
  proxima_fase: 'implementar'    # or 'correcao' when §2c hit the round cap — the phase the work actually stopped in
  ```

`paused` is the state-contract counterpart of the handoff record: it says the work has saved
state to come back to, which is exactly what the handoff file holds. The doninha engine keeps
deriving this PBI as work — resuming, not starting over — and keeps it out of the completed
count. `done` is the only value that counts the PBI as finished, so never write it for partial
work, for the same reason the tracker sync above never pushes a terminal remote state for a
partial pass.

Leave every other field (`item_id`, `ado_id`, `pasta_pbi`, `skills_necessarias`, `riscos`, the `review_*` and correction fields §2c wrote, etc.) as already recorded — step 5 only ever appends/closes, never rewrites history from earlier steps.

### 7. Present the closing summary

There is no next step file to route to inside this skill. What the summary says depends on how
§2c ended, and the three endings are genuinely different claims — do not blur them into one.

- **Review approved** — the PBI is implemented *and* reviewed. Report the round count, the verdict
  and the path of `review.md`. `doninha-code-review` already invoked `doninha-documentation` on
  approval, so there is nothing left for the user to run.
- **Round cap** — the PBI is **not** closed. Present the cap report below and ask for the decision.
- **Closed unreviewed** (`doninha-code-review` not installed) — say so plainly and point the user at
  the skill for later. Green tests plus a passing quality gate are not a review, and a summary that
  omits this reads like the work was checked when it was not.

A **paused** PBI that never reached §2c gets no review line at all — there is nothing complete to
review yet.

Present the summary:

> "## ✅ Desenvolvimento Concluído — {titulo}
>
> **PBI:** `{pasta_pbi}`
> **Status:** {Concluída — todas as {N} tasks implementadas | Pausada — {X}/{N} tasks concluídas}
>
> ### Commits realizados:
> {lista ou contagem de commits desta sessão, um por task, per RED→GREEN→VERIFY→COMMIT}
>
> [se concluída:] ### Quality Gate:
>
> | Gate | Status | Detalhe |
> | --- | --- | --- |
> | {uma linha por gate do escopo `full`, na ordem da tabela `## Scoped invocation` do `doninha-quality-gate` — nenhum gate do escopo fica fora} | APROVADO/REPROVADO/PULADO/DESATIVADO | {evidência: comandos rodados, cobertura % nos arquivos alterados, maior complexidade no diff, issues/hotspots/duplicação novos, itens de checklist aprovados/total, o motivo do PULADO, ou "desligado em quality-gate.yml"} |
>
> {para cada PULADO: o motivo — skill não instalada, MCP indisponível, Docker ausente, SONAR_URL/SONAR_TOKEN não configurados, sonar-project.properties ausente}
> {se houver DESATIVADO: uma linha — "Sonar/complexity ficam com o pipeline do time; habilite em `.doninha/integrations/quality-gate.yml` se quiser rodá-los aqui."}
> {para cada achado aceito como pré-existente: o que é e por que não bloqueou}
>
> [se houver:] ### Itens adiados:
> {lista de deferred ideas registradas em `.doninha/STATE.md`}
>
> ### Memória:
> {registrado via `doninha-memory` | registrado diretamente em `.doninha/STATE.md`} — decisões, blockers e lições desta sessão.
>
> [se `modo: ado`:] ### Tracker:
> {Status sincronizado local→tracker: work item movido para '{estado aplicado}'. | Finalização recusada — work item mantido em '{estado atual}'. | Sync falhou: {motivo} — work item não atualizado.}
>
> [se rodou review:] ### Review:
> {N} rodada(s) · veredito **APROVADO** · `{review_artefato}`
> {se houve correção: "Rodada 1 apontou {X} achado(s); corrigidos em {Y} commit(s); rodada 2 aprovou."}
> {se houve observação não bloqueante na rodada 2: "{Z} observação(ões) registrada(s) em review.md, fora do diff de correção — não bloquearam."}
> Documentação atualizada pelo `doninha-documentation` na aprovação.
>
> [se pausada:] ### Retomar depois:
> Handoff salvo em `.doninha/HANDOFF.md` (ou via `doninha-memory`) — {resumo de uma linha do que falta}.
>
> [se `doninha-code-review` não instalada:] ### Fechou sem review:
> A PBI está implementada, mas **não revisada** — gate verde não é review. Instale o `doninha-code-review` e rode nesta PBI (`{pasta_pbi}`) para validar os critérios de aceite contra o código."

**Cap outcome — a different summary.** When §2c.4 stopped at the round cap, the block above does
not apply: the PBI did not close, so a "✅ Desenvolvimento Concluído" heading would be a false
claim. Present this instead:

> "## ⚠️ Review não convergiu em 2 rodadas — {titulo}
>
> A PBI **não** foi fechada. Rodei o ciclo até o teto: review inicial, uma rodada de correção,
> re-review. O que continua aberto:
>
> | # | Severidade | Arquivo:linha | Task | O que tentei na correção | Por que não resolveu |
> | --- | --- | --- | --- | --- | --- |
>
> [se houver contestação:]
> **Achados que contestei em vez de corrigir** — não são bugs pela minha leitura do código:
>
> | # | Achado | Meu argumento |
> | --- | --- | --- |
>
> {se houver: "Observações não bloqueantes desta rodada (registradas, não corrigidas): {N} — ver `review.md`, rodada {N}."}
>
> **Status:** pausada — handoff em `.doninha/HANDOFF.md`, achados abertos registrados como blockers
> em `.doninha/STATE.md`. {se `modo: ado`: "O work item ficou em '{estado em progresso}'; não finalizei."}"

Then ask for the decision. **Use the `AskUserQuestion` tool if available; otherwise output the
options as plain text and stop until the user responds.** One question, three options, the
recommended one first:

| Option | Label | What it means |
| --- | --- | --- |
| `[C]` | Continuar corrigindo (Recomendado) | A new cycle, `review_rodadas` reset to 0. Restarting the counter is a deliberate human decision — which is exactly what the cap exists to force. |
| `[A]` | Aceitar os achados e fechar | Outcome becomes fully complete. **Every accepted finding is logged as a Blocker** in `.doninha/STATE.md`, naming that the user accepted it and when. Accepting a finding records it; it does not erase it. |
| `[E]` | Encerrar e tratar depois | Stays `paused` exactly as written above. |

The table of open findings goes **before** the question, as text — it is evidence, and it does not
fit inside an option's description.

---

## SUCCESS METRICS

- Entry state confirmed (`stepsCompleted` includes `[1, 2, 3, 4]`, `proxima_fase: 'fechamento'`) before doing anything else
- Between review rounds only the scoped gate ran (Build-tier for touched repos + `per-task` on the corrected files); the full gate was not re-run per round
- Session outcome correctly classified as fully complete vs. pausing mid-PBI, based on `task.md`'s actual checklist state — not assumed
- For a fully-complete PBI, the Build-tier gate ran green for every touched repo before done-marking (step 2b.1) — or a red result was confirmed pre-existing and logged as a Blocker; a fully-complete PBI was never marked done on an unexplained red build
- The full quality gate ran **once**, in §2d, after the review approved — never before §2c and never per round — at scope `full` with the PBI's changed-file list, Gate 1 reusing §2b.1's Build-tier result instead of re-running build+lint; every finding was either resolved or confirmed pre-existing and logged as a Blocker
- Gates 3 and 5 ran only when enabled in `quality-gate.yml` (resolution from step-02); when off they were reported as DISABLED — never run, never SKIP, never a Blocker
- An enabled Gate 5 (SonarQube) was never skipped for cost — `sonar-run` then `get-sonar-issues` ran with `projectKey` from `sonar_project_key` or `sonar.projectKey` and `filters.directories` scoped to the PBI's directories; only newly-introduced issues/hotspots/duplication were treated as blocking
- Any gate that could not run was reported as SKIP with its reason (skill absent, MCP unavailable, Docker missing, Sonar credentials unset) — never reported as PASS, never omitted from the summary, and never used as grounds to block done-marking
- Decisions, blockers, lessons learned, and deferred ideas from steps 1–4 captured into `.doninha/STATE.md` — via `doninha-memory` when installed (checked at runtime, never assumed), via direct append following the generalized Decisions/Blockers/Lessons/Deferred-Ideas record shapes when it isn't
- A handoff record produced only when work is pausing mid-PBI, never when the PBI is fully done; a fully-done PBI marked as such instead
- Tracker status sync attempted only when `modo: ado`; skipped silently (no error) when `modo: local-only`
- A terminal/finalized-state transition ran through the integration skill's own confirm-before-finalize gate before being pushed (never applied automatically, never re-worded locally); a declined confirmation left the tracker state untouched and was reported in the closing summary
- Tracker sync is strictly local→tracker: the outcome determined locally is pushed to the work item; nothing read back from the tracker overwrites `sessao-dev.md`, `task.md`, or `.doninha/STATE.md`
- A failed tracker sync is reported but never blocks the rest of closeout
- No literal tracker org/project name, integration-tool name, or work-item state name hardcoded anywhere in this step — all resolved from `.doninha/integrations/azure-devops.yml` at runtime
- `sessao-dev.md` closed last, only after memory/handoff/sync already landed — `status: 'done'` + `stepsCompleted: [1, 2, 3, 4, 5]` + `proxima_fase` cleared to a terminal marker when fully complete; `status: 'paused'` with `stepsCompleted` and `proxima_fase` left at where the work actually stopped when pausing
- `status: 'done'` never written for partial work — same rule as the terminal tracker state, and the field the doninha engine counts as a finished PBI
- A closing summary presented to the user covering PBI status, commits made, the quality-gate result table (fully-complete PBIs), deferred items, where memory was recorded, tracker sync result (if applicable), and handoff pointer (if pausing) — with no further step file to route to
- A review verdict obtained before done-marking, or the PBI explicitly reported as closed unreviewed because `doninha-code-review` is not installed — never marked done on the silent assumption that green gates are a review
- `doninha-code-review` loaded as a skill in this context, never dispatched to a sub-agent — its five-pass fan-out and its two agent invocations both survived
- At most **two** review rounds triggered automatically from this flow; a third only ever after the user chose it at the cap
- A cap outcome closed as `paused` with a handoff, the open findings logged as Blockers, and the work item left non-terminal — never `done`, and never a summary claiming completion
- `status` written exactly once, in §6, after §2c reached an outcome — §2c itself wrote none
