# Step 2C: Root-Cause Investigation

## MANDATORY RULES

- **Separate the symptom from the objective, in writing, before investigating anything.** What blocks the user's objective is a first-class finding even when it is not the reported symptom.
- **Every `file:line` comes from code pinned at a commit.** Never from memory, never from an index whose freshness is unknown, never from a path you did not open.
- **Bridge in one direction: message → location.** Starting from the code and hunting for the error is the expensive path and it finds the wrong thing first.
- **A capability resolved as `none` is a declared gap.** Never infer what it would have shown. Absence of log is not absence of error.
- **Falsifiers that only read are EXECUTED in this session**, not proposed. Only what needs a write, a state change or a credential stays proposed.
- **Rejecting a hypothesis takes the same evidence as promoting one** — see §7.
- **This step speaks technical.** The "read code silently, speak business" rule belongs to step-02b. Here `file:line`, commits, status codes and stack frames are the product. The translation back to business happens in step-04.
- **Never fix.** No edit, no branch, no commit, no "quick patch while we're here". This step documents; `doninha-desenvolver` corrects.
- **Persist as you go.** Read `{feature_folder}/sessao.md` on entry and write each finding into it the moment it holds. This step is long; a session that dies mid-investigation must lose nothing.

---

## GOAL OF THIS STEP

A causal chain that can be defended: from the reported symptom back to a defect in code read at a commit, with the competing explanations killed by evidence rather than by preference — and with every gap stated instead of papered over.

The output of this step is **not** a report. It is the material step-03b will try to destroy.

---

## SEQUENCE

### 1. Symptom and objective — two lines, written first

Read `sessao.md` (`initial_answers`, `symptom_class`, `capabilities`). Missing the account of what happened, ask for it once:

> "Me conta o que quebrou: o que era esperado, o que aconteceu, desde quando, e como você percebeu."

**STOP — wait for the answer.**

Write both lines into `sessao.md` before anything else:

- `sintoma:` what the system does that it should not
- `objetivo:` what the person was trying to accomplish when it failed

They diverge more often than they look. A user whose objective is "import yesterday's orders" is not unblocked by an explanation of the 500 — and if the objective can be unblocked today, that goes at the top of the report, above the cause.

**What the account says is a hypothesis, not a starting point.** A report naming the culprit commit, endpoint or class is a claim to check, not a place to begin. And any number it states (how many failed, since when, how much slower) is unverified until it is cross-checked against raw data — one number, from one source, in the final report.

### 2. Window

Establish when the symptom starts and what window the investigation covers. Ask if the account does not say.

**Discuss the window out loud, do not inherit it.** The default window is whatever the account implies, and it is frequently too short: a defect can lie dormant for weeks and only surface when load, data volume or a neighbouring change reaches it. Widen it at least once, deliberately, and record both the window used and why:

> "Vou olhar de {data} a {data}. Se a causa for anterior e só tiver aparecido agora, essa janela não alcança — então também vou varrer o histórico sem recorte."

### 3. Log → code bridge

**Requires `logs`.** Take the error message exactly as emitted and find what emits it: the literal string in the source, then the file and line at the pinned commit. Confirm in the log, inside the window, with real values — not a paraphrase of what the account said the log says.

Capability `none` → write `LACUNA: sem capacidade de log — a ponte log→código não foi construída` into `sessao.md`, cap every finding that depends on it at **Média**, and proceed code-first from the symptom's error type and the entry point the user names. Say this to the user in one line; do not silently proceed as if the bridge existed.

**The top of a stack trace is where the error was detected, not where it was caused.** Treat it as the start of the walk back, never as the answer.

### 4. Timeline by cause, not by symptom

**Requires `logs`; applies to `erro-latencia` and `concorrencia`.** Aggregating the symptom's own message returns the echo of the bug. Two queries instead:

1. **Upstream failures** in the window and in a control window — connection/pool/transaction/timeout errors from the infrastructure the path depends on, aggregated by day and by service.
2. **The literal strings of the `catch`/`warn`/`error` branches of the path read in §3.** Those messages exist in the source you just opened; search them as phrases. This is what finds the event on the failing path itself, which the generic sweep misses.

**Requires `metrics` for the load question.** With it, check whether the symptom tracks throughput or tracks a release — they imply different causes and different fixes. Without it, that question stays an explicit hypothesis with its falsifier written down; it is never asserted.

A truncated or timed-out query is **not a result** — narrow the range and run it again.

### 5. Precedent — two sources

a. **Commits.** For every candidate file: the history inside the window, **and** the recent history with no date filter at all. The second is what catches a fix of the same class applied elsewhere — another field, another route, the same method. A window with no commits is itself a finding: nothing shipped, so the trigger was load, data or time, not a deploy.

b. **Sibling items.** **Requires `tracker`.** Search closed items three ways and record all three: the literal error message, the entity or table that owns the broken state, and the business capability. A defect that already happened once carries the strongest argument this step produces — and it only appears if you look for it. Precedent with tests → read what those tests mock; a fix that never covered the real class is why it came back.

Capability `none` → source (a) alone, and say so in the gaps.

### 6. Hypothesis matrix

Build it as soon as there are two explanations, and update it on every finding:

| Hypothesis | Evidence for | Evidence against | How to falsify | State |
| ---------- | ------------ | ---------------- | -------------- | ----- |

- Prefix each title with the module or service it lives in.
- A hypothesis with no falsifier is **not operational** — either write one or drop it.
- **Separate the cause of this incident from any systemic defect you find along the way.** Both are real, both go in the report, and they are not the same finding.
- Layers of one failure do not exclude each other: infrastructure, design and data can all be true at once. The report says which layer each requirement closes.

### 7. Symmetric counter-test

Rejecting a hypothesis takes the same standard as promoting one.

"Even if that were fixed, the symptom would persist" is a causal claim. Making it requires describing the **candidate correction** — what would change in the code you have already read — and why that would not close the symptom. Without that, the state is `not fully tested` and goes to the gaps. It is never `discarded`: the two lead to different next actions.

Promoting requires code read at the commit, not plausibility.

### 8. Falsifiers — execute them

Every hypothesis in the matrix has one. Run every falsifier that only reads: an aggregation, a pinned file, a public request, a history query. Record the command, the result and what it did to the hypothesis.

A falsifier that needs a write, a state change, a credential or someone's authorization stays **proposed**, named, with what it would decide. Nothing with a side effect runs without the user asking for it explicitly.

Falsifiers executed only in the report and never in the session is the single most common way this analysis degrades into a plausible story.

### 9. Budget and boundaries

Every part of this step has a budget. When one runs out, **state the boundary and move on** — a section that silently ran out of room produces a claim of coverage it does not have. Do not re-derive what already converged; spend what is left on divergence: the falsifier, the precedent, the neighbouring service.

### 10. Persist and route

Update `sessao.md`: `stepsCompleted: [1, 2]`, the matrix, the executed falsifiers with results, the chain as it currently stands, and every gap with its ceiling.

Then load `./step-03b-refutacao.md`. **Do not summarize the conclusion to the user yet** — it has not survived anything. The next step exists to try to kill it.

---

## SUCCESS METRICS

- Symptom and objective written separately before the investigation, and a blockable objective surfaced
- Window widened at least once, deliberately, with the reason recorded
- Bridge built message → location, with `file:line` pinned at a commit — or the gap declared and the ceiling applied
- Timeline queried by cause and by the path's own strings, not by the symptom alone
- Precedent searched in both sources available, with the queries recorded
- Matrix present, every hypothesis operational, incident cause separated from systemic defect
- No hypothesis marked `discarded` without a concrete candidate correction
- Every read-only falsifier executed **in this session**, with its result
- Every capability resolved as `none` present as a declared gap, never as an inference
- Nothing fixed, edited or committed
