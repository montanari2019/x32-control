# Step 3B: Adversarial Stage and Evidence Gate

## MANDATORY RULES

- **Dispatch the adversarial subagent the moment the chain closes** — before writing a single line of the report.
- **Do not write `rca.md` while it runs.** A thesis written down is a thesis defended; the order is what makes the verdict able to change anything.
- **Read the verdict from `refutacao.md`**, the file the subagent writes — never from the truncated notification.
- **The refutation is not a source.** A verdict that contradicts evidence pinned at a commit gets re-checked against that evidence before it is accepted. The subagent can also be wrong, and it measures outside the window more easily than you do.
- **One subagent, fresh context, once.** Not a fork of this session — the whole value is that it has not seen the reasoning it is asked to break.
- **The thesis survives only if the refutation fails on ≥ 2 axes.** One axis falling downgrades confidence and becomes a line in the gaps.
- **"No actionable conclusion" is not an outcome.** A thesis that dies sends you back to the next candidate — at most twice — and if all of them die, the report ships with the dead theses and what it would take to decide.

---

## GOAL OF THIS STEP

Attack the conclusion with something that has no stake in it, then let the evidence gate decide whether what survived is worth writing down — and write it once.

---

## SEQUENCE

### 1. Check internal divergence first

Before handing anything over, reconcile the contradictions inside your own material: two statuses for the same call, two timestamps for the same event, a count that does not match its own aggregation. Decide them by trace or timestamp. Sending a contradiction to the adversarial stage buys a verdict about your bookkeeping instead of about your thesis.

### 2. Dispatch the adversarial subagent

One subagent, `general-purpose`, fresh context. Dispatch it in a single message and let it work while you do §3.

**Payload — conclusions only, never the reasoning that produced them:**

1. **The thesis**: root cause, `file:line`, the commit everything is pinned at, the confidence assigned, and the rule that confidence came from.
2. **How to reach the code**: the repo and the commit, so it reads the same bytes you read.
3. **The chain**: symptom ← mechanism ← defect, as a short list of claims, each with its citation.
4. **The instruction**:

   > Refute this. Read the code at the pinned commit before asserting anything. Return a verdict per axis — **logic** (does the stated mechanism actually do what is claimed?), **log** (does the cited evidence say what it is said to say?), **window** (do the artifacts match the commit and the period?), **contract** (does the claimed behaviour match what the interface promises?) — each `FALLS` or `SURVIVES`, with the reason and, when it falls, what the evidence supports instead. State the boundary of what you could not check. Write the verdict to `{feature_folder}/refutacao.md`. Never modify code and never write anywhere else.

5. **The output language**: PT-BR.

**What the payload must not carry:** your narrative of how you got there, the hypotheses you already killed, or any sealed answer key if this is a rehearsal. Priming it with your path is how it agrees with you.

### 3. While it runs — the off-script probe

Do only what does not depend on the thesis. One deliberate investigation nobody prescribed: a config no one asked you to read, a neighbouring index, a sibling endpoint, the batch path next to the single-item path, the callers of the setter instead of the readers of the getter.

Record in `sessao.md` what was probed and what it yielded — **including when it yielded nothing**. This is instinct with a receipt, and it is where the findings nobody asked for come from.

Do **not** start writing the report here.

### 4. Read the verdict and verify it

Read `{feature_folder}/refutacao.md`.

For every axis that fell, check the central claim against the pinned evidence yourself before accepting it. Accepting an unverified refutation is the same failure as accepting an unverified thesis, pointed the other way.

| Outcome | What it does |
| ------- | ------------ |
| ≥ 2 axes survive | The thesis stands. Fold any correction into it and continue. |
| Exactly 1 axis falls | The thesis stands at **lower confidence**, and the fallen axis becomes a line in the gaps. |
| ≥ 2 axes fall | The thesis is dead. Return to §3 of step-02d with the next candidate — **at most two cycles**. |
| Two cycles exhausted | Ship the report with the dead theses, what killed each one, and the falsifier that would decide. |

Whatever changes, record **what you believed before and what you believe now**. A thesis that was rewritten is a finding about the investigation, and it belongs in the report.

### 5. Evidence gate

The gate that replaces the product gate for this mode. Close each item or declare it as a gap — an item is never closed by filling in a field.

```markdown
[ ] symptom and objective separated; a blockable objective surfaced at the top
[ ] every file:line pinned at a commit; nothing asserted from an index without a stated gap
[ ] log→code bridge built, or its absence declared with the confidence ceiling applied
[ ] timeline queried by cause and by the path's own strings — not by the symptom alone
[ ] precedent searched in both available sources, queries recorded
[ ] matrix present; nothing marked `discarded` without a concrete candidate correction
[ ] every read-only falsifier executed in this session, with its result
[ ] adversarial stage run, verdict read from refutacao.md, fallen axes verified against the evidence
[ ] off-script probe recorded, including a null result
[ ] confidence per finding, with the rule that produced it; no composite score
[ ] every capability resolved as `none` present as a gap with its ceiling — nowhere claimed as clean
[ ] requirements and acceptance criteria written as specification, with nothing implemented
```

**Confidence is per finding, never averaged.** Two independent surfaces agreeing inside the same window and the same entry point is what earns a high confidence. The lowest ceiling among the capabilities a finding depends on is the one that applies, and a requirement never asserts a Média premise as fact — it says "verify X; if confirmed, correct Y".

### 6. Budget the report before writing it

Cheap here, expensive later: decide the size of each section **before** writing, not by cutting prose after the content is already down. A report rewritten four times to fit costs a quarter of the session and risks corrupting the document in the process.

- Table over narrative; one citation per fact.
- The evidence and the verdicts are what the gate protects — trim prose, never citations.
- Edit by section anchor, never by matching a phrase that also appears inline in the body. That is how a duplicate section gets written on top of a good one.
- After writing, check that no heading appears twice before continuing.

### 7. Assemble and hand off

Assemble the `rca.md` content in the structure `doninha-artifact-rca` defines (single source of truth for that document — do not restate it here), and hand it to `doninha-copy-writer` to write. Include the capability map and the gaps verbatim: a reader has to know what this investigation could not see.

Update `sessao.md`: `stepsCompleted: [1, 2, 3]` and `validation_approved: true` — the evidence gate is what clears this mode, the same way the product gate clears DESCOBERTA.

Report to the user, briefly:

> "**Investigação concluída.** Laudo em `{feature_folder}/rca.md`.
>
> - **Causa raiz:** {1 linha} — confiança {alta/média/baixa}
> - **Estágio adversarial:** {n} de 4 eixos caíram{, e o que mudou na tese}
> - **Lacunas:** {as que importam, com o que cada uma impediu de decidir}
>
> Sigo para a Feature e os PBIs de correção — a correção em si é do `doninha-desenvolver`."

Then load `./step-04-feature.md`. The requirements and acceptance criteria produced here are what step-05 turns into PBIs.

---

## SUCCESS METRICS

- Subagent dispatched as soon as the chain closed, and the report not written before its verdict
- Exactly one subagent, fresh context, verdict read from `refutacao.md`
- Every fallen axis verified against pinned evidence before being accepted
- A rewritten thesis recorded as such — what was believed before, and what changed it
- Off-script probe recorded, null result included
- Evidence gate walked item by item, each one closed or declared
- Confidence per finding with its rule; no composite score; ceilings applied from the capability map
- Report written once, within a budget decided beforehand, with no duplicated heading
- `validation_approved: true` only after the gate
- Nothing implemented, no branch, no commit
