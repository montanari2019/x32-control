# Step 4: Consolidate

## MANDATORY RULES

- **Every `critical` and `major` is verified against the real code before it enters the report.** They send work back to development; a false positive costs a full round trip.
- **Refute only from the code.** A refutation cites the line that proves it. Doubt is not evidence.
- **Never invent, inflate or soften a finding.** The verdict follows from the findings; the findings never follow from a desired verdict.
- **Report what you dropped.** Silent trimming makes a partial review look complete.
- Communicate in **PT-BR**.

---

## GOAL OF THIS STEP

Turn seven blocks of raw candidates into one ordered, deduplicated, verified list of findings, and derive the verdict from it.

The governing rules — the severity table, the verification ladder, what is not a finding — live in [references/severity-and-verdict.md](../references/severity-and-verdict.md). Load it before starting.

---

## SEQUENCE

### 1. Pool

Gather every candidate from passes 1–7 into one list, each still tagged with the pass that produced it. Keep the raw count; step-03 recorded it and the shrinkage from raw to final is worth stating.

### 2. Dedup

Same file + same line + same underlying mechanism → **one finding**. Keep the wording with the most concrete failure scenario and the category that names the mechanism most precisely.

Same line for **different reasons** stays as two. The passes overlap on purpose, and letting one pass's conclusion suppress another's is how the second reason gets lost.

### 2b. Roll up by root cause

Then the step that decides whether the report is readable: **group findings that share one cause and one fix into a single finding with an instance table** (§5b of the reference). Fourteen instances of the same contradiction are one problem with fourteen places to apply the fix — not fourteen problems.

Do this before numbering. A report that lands on fifteen `major`s with zero `critical` almost always failed here, not in the severity call.

### 3. Drop what is not a finding

Apply §4 of the reference. In short: style the formatter owns, compile/type/test failures CI will catch, cosmetic renames, pre-existing defects on lines this change did not touch or affect, deliberately silenced rules, intentional changes the spec asked for, and abstract "faltam testes/docs" without a documented convention behind it.

Count what you dropped and why. It goes in the report's closing note.

### 4. Verify every blocking candidate

For each `critical`, re-read the actual code around it and reach `CONFIRMED`, `PLAUSIBLE` or `REFUTED`. For a `major`, do this **only when its evidence is not already in hand** — if the diff plus the file body the pass already read show the failure, cite the line and keep it. See [references/severity-and-verdict.md](../references/severity-and-verdict.md) §3 for why the bar moved.

Ask the inverted question: **what reading of this code makes this candidate false?** Then look for that reading in the code — a guard earlier in the function, a type that makes the state unreachable, a caller that already validates, a constant that excludes the boundary.

- Found it, and it holds → `REFUTED`. Drop the candidate and note the guard.
- Did not find it → `CONFIRMED` when you can name the triggering inputs and the wrong outcome; `PLAUSIBLE` when the mechanism is real but the trigger depends on timing, environment or load.

Do not refute for being speculative. Races, nulls on cold paths, zero treated as absent, off-by-one on an unexcluded boundary — those are realistic, and dismissing them is how real bugs ship.

`minor` and `suggestion` skip this. They block nothing.

Mark each surviving blocking finding with its verdict in the report; a `PLAUSIBLE` finding says so, because the reader deserves to know which ones rest on a conditional path.

### 5. Check each finding is actionable

Every finding needs a concrete failure scenario — triggering inputs or state, and the **user-visible consequence**. "O valor fica desatualizado" is a mechanism; "o usuário vê o preço de outro tenant" is a consequence.

For quality, pattern and coverage findings the equivalent is the concrete cost: where the duplicate lives, which documented convention is broken and its exact wording, which case the missing test would have caught.

A candidate that cannot express this is demoted to `suggestion` or dropped. Also confirm each has a **specific, implementable recommendation** — "melhorar o tratamento de erro" is not one; "lançar `OrderNotFoundException` quando `findById` retorna null, como em `payment-service.ts:88`" is.

### 6. Order and number

Sort by severity, `critical` first, and number sequentially from 1. Severity ordering comes ahead of grouping by pass or by file — when the list is long, that ordering is what makes it usable.

### 7. Verdict

```
APROVADO             — no open critical and no open major
NECESSITA CORREÇÕES  — at least one open critical or major
```

No third outcome, and no "aprovado com ressalvas". A skipped pass does not change the verdict but is stated alongside it.

Round > 1: a finding carried over and still open counts as open. The work does not get approved because a finding is old.

**Before applying the rule on round > 1, classify.** Sort every surviving `critical`/`major` into its bucket per [references/severity-and-verdict.md](../references/severity-and-verdict.md) §6a — **carregado**, **regressão da correção**, or **novo fora da correção** — and compute the verdict from the blocking ones only. A new `major` outside the correction diff is reported and does not block; a new `critical` blocks wherever it is. With no `escopo_correcao` recorded (a standalone re-review), every bucket collapses and the unmodified rule above applies.

State the counts per bucket in the report. A round that blocked on less has to say so.

### 8. Assemble the report

Body, in PT-BR:

- **Resumo** — 1–2 sentences: what was reviewed, in which mode, which round, and the verdict.
- **Passes executados** — which ran, which were `SKIP` and why, which were `N/A`.
- **Achados** — the numbered table: `#`, Severidade, Arquivo, Linha, Categoria, Descrição, Recomendação.
- **Cobertura dos critérios de aceite** — PBI mode only, from pass 1.
- **Rodada anterior** — round > 1 only: each carried finding as corrigido / parcialmente / em aberto. When the correction pass contested a finding instead of fixing it (`contestacoes` in `sessao-dev.md`), answer the argument here: **mantido**, citing the code that keeps it standing, or **aceito**, and the finding drops. Leaving a contested finding unanswered is what makes the next round repeat it.
- **Observações não bloqueantes** — round > 1 only: new `major`s that fell outside the correction diff, with file:line and the reason they did not block. **An empty list is stated, not omitted** — a missing section reads as "none were found", which is a different claim than "none blocked".
- **Notas de escopo** — files excluded from findings, context that was missing, candidates dropped and why, and whether the fan-out ran.

`doninha-artifact-review` owns the final structure of `review.md`. Assemble the content; do not pre-render its frontmatter or its `Próximo passo` line — the copy-writer adds those in step-05.

### 9. Record

Update `sessao-review.md`: `stepsCompleted: [1,2,3,4]`, `proxima_fase: fechamento`, final `achados` counts (post-dedup, post-verification), `achados_nao_bloqueantes` (round > 1), and `veredito`.

---

## SUCCESS METRICS

- Every candidate deduplicated by location + mechanism; same line for different reasons preserved as separate findings.
- Every `critical` carries a verification verdict, and so does every `major` whose evidence was not already in hand; every `REFUTED` one was dropped citing the line that refutes it.
- Every surviving finding has a concrete failure scenario and a specific recommendation.
- Non-findings dropped, counted, and noted in the report.
- The severity floor held: no `suggestion` outside `--completo`, and at most 5 `minor` with the remainder declared as a counted line.
- Findings numbered sequentially, ordered by severity.
- Verdict derived mechanically from the open blocking findings — not chosen.
- On round > 1 with a correction base, every blocking candidate carries its bucket (carregado / regressão / novo), the verdict used only the blocking ones, and the narrowing is stated in the report.
- Every finding the correction pass contested was answered as mantido or aceito — none left hanging to be re-raised next round.
- `achados` counts in the session match the report's table.
- `stepsCompleted: [1,2,3,4]`.
