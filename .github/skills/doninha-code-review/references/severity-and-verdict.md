# Reference — Severity, verification and verdict

Loaded by [steps/step-04-consolidar.md](../steps/step-04-consolidar.md). This file is the single source of truth for how a candidate becomes a finding, what severity it carries, and how the verdict follows from the set.

---

## 1. Severity

| Severity     | Criteria                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `critical`   | Directly exploitable, or prevents correct operation: auth bypass, injection, exposed data, guaranteed crash. |
| `major`      | An unimplemented requirement, a security weakness, or a bug likely to reach production.                     |
| `minor`      | Pattern deviation, insufficient coverage, recommended hardening.                                            |
| `suggestion` | Clarity or quality improvement with no current violation.                                                   |

**`critical` and `major` block approval.** Nothing else does.

## 1b. What gets emitted at all

Blocking findings are the reason the review exists. The rest is a budget, and the budget is small
on purpose: in real reviews two thirds of the output has been `minor`/`suggestion`, none of it
blocking anything, and all of it costing generation, dedup, roll-up, report space and the reader's
attention before anyone reaches the two findings that mattered.

| Severity | Default |
| --- | --- |
| `critical`, `major` | Always emitted, no cap. |
| `minor` | At most **5**, already rolled up by cause (§5b). The remainder is one counted line: *"mais N `minor` da mesma família de {causa}, não listadas."* |
| `suggestion` | **Not emitted.** Opt-in only — the reviewer asks for the full report. |

By §1 a `suggestion` has no violation behind it; it is an opinion about code that is already
correct and already conventional. Shipping it by default turns a verdict into an inventory.

**This is enforced at emission, not at assembly.** The orchestrator tells each pass its minimum
severity in the dispatch payload, so the finding is never produced. Cutting it in the report saves
the reader; cutting it at the source saves the run.

The pass subagents assign a severity themselves. Consolidation may **lower** one when verification weakens it, and may raise one only when the evidence is concrete — never to make a point.

## 2. Every finding needs a concrete failure scenario

State the inputs or state that trigger it and the **user-visible consequence**: an error, wrong output, data loss, an exposed record. An intermediate state is not a consequence — "the cached value goes stale" is a mechanism, "a user sees another tenant's price after the cache is invalidated" is a failure.

A candidate that cannot express a failure scenario is not a `major`. It is a `suggestion`, or it is nothing.

For the quality, pattern and coverage lenses the equivalent is the concrete cost: what is duplicated and where the other copy lives, which documented convention is broken and quoted verbatim, which case the missing test would have caught. "Não segue boas práticas" is not a finding.

## 3. Verification of blocking findings

**Every `critical` is re-examined before it enters the report.** A `major` is re-examined only
when its evidence is **not already in what was read** — if the diff plus the file body the pass
already had in front of it are enough to show the failure, the finding stands on that, with the
line cited. When it leans on a caller, a guard in another file, or state nobody looked at, verify
it. `minor` and `suggestion` skip this entirely.

**Why the bar moved.** This ladder was written when a blocking false positive cost a full round
trip through development, so proving every one was cheaper than being wrong. That price changed:
the two-round cap and §6a's frozen blocking scope now bound a wrong `major` to one scoped
correction round. The cost of the error fell, so the cost of the proof can fall with it. What did
**not** change is `critical` — an exploit or a guaranteed crash reported wrongly still burns trust
in the whole report, and reported rightly is the finding the review existed for.

Re-read the actual code around the candidate and reach one of three verdicts:

| Verdict       | Meaning                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `CONFIRMED`   | You can name the inputs/state that trigger it and the wrong outcome that follows.                |
| `PLAUSIBLE`   | The mechanism is real and reachable, but the trigger depends on timing, environment or load.     |
| `REFUTED`     | It is factually wrong, provably impossible, or already handled.                                  |

Keep `CONFIRMED` and `PLAUSIBLE`. Drop `REFUTED`.

**Refute only from the code, never from doubt.** A refutation must cite the line that proves it: the guard that already handles the case, the type or constant that makes the state unreachable, the actual text of the line the candidate misread. "Parece improvável", "provavelmente é intencional" and "depende de estado de runtime" are not refutations — a race condition, a null on a cold-cache path, a zero treated as absent, and an off-by-one on a boundary the code does not exclude are all realistic states, and dismissing them is how real bugs ship.

A `PLAUSIBLE` finding says so in the report. The reader deserves to know which findings rest on a reachable-but-conditional path.

## 4. What is not a finding

Discard these at consolidation. Every one of them is noise that costs the reader's attention and makes the real findings harder to act on.

- **Style a formatter or linter already owns** — spacing, quotes, import order, line length. The project's tooling decides those, and CI runs it.
- **Compile, type and test failures.** Assume the build and the test suite run separately; the review is not a substitute for them.
- **Cosmetic renaming** with no ambiguity behind it.
- **Pre-existing defects on lines this change did not touch or affect** (see [diff-scope.md](diff-scope.md) §3).
- **A rule the code deliberately silenced** with an explicit ignore/suppress annotation — that is a decision, and disagreeing with it is a `suggestion` at most.
- **Intentional behaviour changes** that the spec or the task asked for. Read the requirement before calling a change a regression.
- **Missing tests, docs or hardening in the abstract**, unless the project's own documented conventions require them — in which case quote the convention.

## 5. Deduplication

The passes still overlap, though far less than when they were five: an empty `catch` is a defect (pass 3) and a convention break (pass 4); a missing test for an uncovered branch is pass 5's and the branch itself may be pass 3's. Same file, same line, same underlying mechanism → **one finding**, keeping the wording with the most concrete failure scenario and the category that names the mechanism most precisely.

Same line for **different reasons** stays as two findings. Never let one pass's conclusion silence another's.

## 5b. Roll up by root cause

Deduplication removes repeats of the *same* finding. Roll-up is different and it is what keeps a report readable: **many findings that share one root cause become one finding with an instance table.**

Fourteen places where a doc contradicts another doc is not fourteen findings — it is one finding ("the router and the steps disagree") with fourteen instances, and the fix is one decision applied fourteen times. Listing them separately makes the report look like fourteen problems, buries the two that are genuinely different, and gives the reader no idea where to start.

Roll up when the instances share a cause **and** a fix:

```markdown
| # | Severidade | Categoria | Descrição | Recomendação |
| 3 | major | consistência | O roteador contradiz os steps em 14 pontos — ver instâncias | Uma decisão por par, aplicada nos 14 |

**Instâncias do achado 3**

| Arquivo | Linha | Diz | Contradiz |
| `SKILL.md` | 66 | `{YYYY-MM-DD}-{slug}.md` | `step-05:54` → `{slug}.md` |
```

The severity of a rolled-up finding is the highest among its instances, and the instance table is part of the finding, not an appendix.

## 5c. Size the report

A report nobody finishes reading protects nobody. Target **at most ~15 numbered findings**; past that, the tail is not informing a decision.

Get there by rolling up (§5b) and by discarding non-findings (§4) — **never by silently dropping**. If real findings still exceed the target after both, keep the most severe and close the table with an explicit line: *"mais N achados `minor`/`suggestion` da mesma família de {causa}, não listados individualmente"*. The reader has to be able to tell a short report from a truncated one.

`critical` and `major` are **never** cut — they block approval, so they all appear however many there are. A count of blocking findings that runs high with zero `critical` is itself a signal: re-check §1, because a wave of same-family `major`s usually means one root cause that has not been rolled up yet.

## 6. Verdict

```
APROVADO             — no open critical and no open major
NECESSITA CORREÇÕES  — at least one open critical or major
```

There is no third outcome. "Aprovado com ressalvas" does not exist: either the blocking findings are gone or the work goes back. `minor` and `suggestion` findings are recorded and do not stand in the way.

**Which findings count as blocking depends on the round** — see §6a. On round 1 that is every open `critical` and `major`; from round 2 on it is a narrower set, and the report says which.

A pass recorded as `SKIP` does not change the verdict, but it is stated in the report — an approval that ran five of seven passes is a narrower statement than one that ran all seven, and the reader has to be able to tell.

## 6a. Blocking scope on a re-review

Round 1 has no correction behind it: everything above applies unchanged, and every `critical` and
`major` blocks. **From round 2 on, what blocks narrows — what gets reported does not.**

All seven passes still run, and every finding they produce still enters the report. The
classification below only decides which of them send the work back a second time. Sort each
surviving `critical`/`major` into one bucket, using `escopo_correcao` (the ref the correction pass
started from, recorded in `sessao-review.md`):

| Bucket | Test | Blocks |
| --- | --- | --- |
| **Carregado** | A prior round's finding, still `em aberto` or `parcialmente corrigido` | **Yes** — at its original severity and number (§6b) |
| **Regressão da correção** | New, and it lands on a line or an enclosing function the correction diff (`escopo_correcao..HEAD`) touched, or on a caller of a signature that diff changed | **Yes** — at its own severity |
| **Novo fora da correção** | New, and neither of the above | `critical` → **yes**, anywhere. `major` → **no**: recorded as a non-blocking observation |

**Why a new `major` outside the correction does not block.** An untouched file does not get worse
between rounds. A `major` the first round did not find there is a finding about work that was
already reviewed and accepted — and treating it as a blocker means every correction buys a fresh
list of reasons to correct again, which is how a two-round fix becomes a five-round one. The
finding is not discarded: it is written into the report, it survives in `review.md`, and it is
there for the next PBI or a dedicated round. It just does not send this work back.

This is **not** a licence to review round 1 loosely. Everything the frozen scope declines to block
on round 2 is something round 1 was supposed to catch.

**Standalone fallback.** A round > 1 with **no** `escopo_correcao` — a review a person ran by hand,
not one driven by `doninha-desenvolver`'s cycle — has no correction diff to classify against. It
keeps the unmodified rule: everything blocks. The frozen scope never relaxes a verdict on its own;
it applies only where a correction round is what is actually being checked.

**Say it in the report.** A round that blocked on less has to state so, the same way a round that
read less already does: *"Rodada {N}: bloqueio restrito a {A} achados carregados, {B} dentro do
diff de correção e {C} critical novos; {D} achados novos registrados como não bloqueantes."*

## 6b. A carried finding keeps its identity

A finding that survives into another round is the **same** finding: same number, same severity,
plus a `(rodada de origem: {M})` marker. Never re-number it as fresh and never re-derive its
severity from a new reading.

The reason is legibility, and it is the whole value of accumulating rounds: a report where finding
3 has been open since round 1 tells the reader something a report with three differently-numbered
findings cannot. Silently renumbering hides how many rounds a problem has survived, which is
usually the most important thing on the page.

## 7. Ordering

Findings are numbered sequentially and ordered by severity, `critical` first. When the volume is large, the ordering is what makes the report usable — do not group by pass or by file ahead of severity.
