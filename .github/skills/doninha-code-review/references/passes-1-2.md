# Reference — Passes 1 and 2 (run by the orchestrator)

Loaded by [steps/step-03-passes.md](../steps/step-03-passes.md). These two passes stay in the main context because both need the whole picture at once — the full set of acceptance criteria against the full set of changes. Passes 3–5 are per-file checklists and fan out to subagents; these do not.

**Pass 1 runs in PBI mode only** — without a `spec.md` there is no criterion to check compliance against. Pass 2 runs in both modes, with a different question in each.

---

## Pass 1 — Spec/Task compliance

The question: **does the code actually do what was agreed?** This is the pass the automated checklists cannot replace, and it is the one that most often changes a verdict.

For every acceptance criterion in `spec.md` that the reviewed tasks claim to satisfy:

1. **Locate the evidence in the code.** Name the file and line that implements it. A criterion whose implementation you cannot point at is not implemented, however confident the task file sounds.
2. **Check the criterion end to end**, not just its happy path. A criterion stating "o usuário recebe um erro quando o CPF é inválido" is satisfied only if invalid CPFs actually reach that path and the error actually surfaces.
3. **Check the edge cases the spec lists.** `references/specify.md` in `doninha-desenvolver` requires an Edge Cases section; unhandled entries there are findings, not omissions.
4. **Mark the result**: `Verificado` or `Falhou`. A failed criterion is at least a `major` — an unimplemented requirement is exactly what that severity means.

This produces the "Cobertura dos critérios de aceite" table that `doninha-artifact-review` expects:

| Critério | Task    | Status              |
| -------- | ------- | ------------------- |
| CA-01    | task-01 | Verificado / Falhou |

**Do not reinterpret the criteria.** They were agreed upstream and are immutable at this stage. If a criterion is genuinely ambiguous, say so as a finding against the spec — do not quietly pick the reading the code happens to satisfy.

**Never rely on the conversation.** If `spec.md` or the task file is missing, stop and tell the user rather than reconstructing the requirements from memory. A review measured against remembered criteria measures nothing.

## Pass 2 — Diff analysis

The question: **do the changes match what was supposed to change, and does anything the change removed still hold?**

### 2a. Scope

Every changed file should trace to a task's declared `Where` (PBI mode) or to the stated purpose of the change (DIFF mode). Flag:

- A file changed that no task declared — either the task breakdown was wrong or something rode along uninvited. `implement.md` states the rule the implementation was supposed to follow: *"Is this in my task definition? If no, don't touch it."*
- A task whose declared files were **not** changed — the task claims work that did not happen.
- Unrelated refactoring, reformatting or renaming mixed into a functional change. It is not wrong in itself, but it hides the real diff and belongs in its own commit; `minor`.

### 2b. Removed behaviour

For every line the diff **deletes or replaces**, name the invariant it enforced, then find where the new code re-establishes it. When you cannot find it, that is a candidate — and one that the per-file passes structurally cannot catch, because they look at what is there, not at what left.

Watch for: a removed guard or validation; a dropped error path; a narrowed check (`!== null` becoming truthiness); a deleted test that covered a real case; a lowered timeout, retry or limit; a removed `await`.

### 2c. Contracts

For every function the change touches whose signature, return shape, thrown errors or ordering changed, find its callers and check each one still holds. A new required parameter, a return that can now be `null`, a new exception, a call that must now happen after something else — each breaks call sites that the diff itself may not include.

Do the same in the other direction: a change to a callee elsewhere in the same diff can make an untouched call unsafe.

### 2d. Design contracts, when the PBI has them

When `DESIGN.md`/`EXPERIENCE.md` exist for the PBI, the UI changes are measured against them: flows, states and screens that were agreed there and are missing, and — just as important — flows or screens the implementation invented that are not in either document. `doninha-frontend`'s dual-contract rule makes those documents the authority, so a divergence is a finding, not a preference.

---

## Output

Both passes emit the same findings block shape the pass subagents use, so consolidation treats every source identically:

```markdown
### Pass 1 — Conformidade com spec/task

| # | Severidade | Arquivo | Linha | Categoria | Descrição | Recomendação |
| - | ---------- | ------- | ----- | --------- | --------- | ------------ |
```

Plus the acceptance-criteria coverage table. When a pass has nothing, write `Nenhum achado.` — an empty pass is a result and it belongs in the report.
