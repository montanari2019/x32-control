---
name: doninha-code-review
description: 'Autonomous review skill that takes a finished change — a PBI implemented by doninha-desenvolver, or a loose branch/PR/working-tree diff — through five review passes and produces a documented verdict. Sizes the review first — a small change with no risk signal gets the cheap profile, and any risk signal (auth, external input, secrets, money, migration, deletion) forces the deep one whatever the size. Runs passes 1–2 (spec/task compliance, diff analysis) itself and dispatches passes 3–5 to parallel subagents loaded with doninha-reviewer-correctness/-design/-tests, then dedups candidates, verifies every critical against the real code, and decides APROVADO or NECESSITA CORREÇÕES. Never modifies code — it documents findings and hands the fixes back to doninha-desenvolver. Writes review.md through doninha-copy-writer in PBI mode; writes .doninha/reviews/ directly in diff mode. Triggers on: revisar PBI, code review, revisar PR, revisar branch, revisar meu diff, validar implementação, verificar o trabalho, rodar os passes de review, revisão de código, procurar bugs no que foi implementado, aprovar ou reprovar a entrega.'
---

# Doninha Code Review

`doninha-code-review` is an autonomous, step-file skill — invoked directly by the user, or driven by `doninha-desenvolver`'s closeout (`step-05-fechamento.md` §2c), which loads it as a skill and reads the verdict from `sessao-review.md`. Nothing about this skill's contract changes between the two: same modes, same passes, same artifacts. It owns its own flow (steps 01→05) and its own session state (`sessao-review.md`), and it closes the trio `doninha-analisar` → `doninha-desenvolver` → `doninha-code-review`.

It is the **only** review entry point in the harness. The `doninha-reviewer` agent definition it replaced was removed once this skill covered the same seven passes; the three agents that remain are `doninha-copy-writer`, `doninha-documentation` and `doninha-quick`.

## HARD CONSTRAINT — no code, ever

This skill produces a document and a verdict. It never edits, fixes, refactors, or reformats a single line of the code under review, and it never commits. Separating who finds from who fixes is the whole point: a reviewer that patches its own findings has no one left to check them, and it stops being able to say "this is wrong" about work it now owns.

If the user asks for the findings to be fixed — during the review or after it — say so plainly and route the work to `doninha-desenvolver` for the affected tasks. Do not offer a "quick fix while we're here."

## Execution style

This is an evidence-gathering flow, not a conversation and not a code-change task. Two properties carry most of the value and neither is optional:

- **Read the full content of every changed file, not just the diff.** Most real defects live in the interaction between the new lines and the ones around them — a guard that used to run earlier in the function, a caller whose contract just changed. A diff-only reviewer cannot see any of that. The pass subagents are written expecting full file content, so short-changing them here silently degrades all five.
- **A finding that blocks approval gets verified before it is written down.** `critical` and `major` send the work back to development, so a false positive costs a full round trip. Step 04 re-examines each one against the code and drops the ones that do not survive.

## How the review stays fast

The review is expensive by nature — it reads whole files and verifies blocking findings before
writing them. Four mechanisms keep it from costing more than that floor, and each is enforced by
a step file, not by remembering:

| Mecanismo | Onde | Efeito |
| --------- | ---- | ------ |
| **Escopo incremental por rodada** | `references/diff-scope.md` §2 | Rodada N>1 revisa o que mudou desde a rodada N-1, não a branch inteira de novo. Corrigir 2 arquivos passa a custar 2 arquivos. |
| **Rodada de correção é verificação, não review** | `steps/step-03-passes.md` §2 | Rodada com `escopo_correcao` responde "foi corrigido?" e roda só o passe 3 sobre o diff da correção. Medido numa PBI real: as rodadas 2-4 custaram 18 min para achar 2 coisas, re-rodando todo o leque sobre trabalho já revisado. |
| **Perfil por tamanho e risco** | `steps/step-01-escopo.md` §6b | A mudança dita quanto de review ela merece. Diff pequeno e sem sinal de risco roda um passe, inline, sem corpo inteiro. Sinal de risco (auth, entrada externa, segredo, dinheiro, migração, deleção) sobe o perfil por menor que seja o diff. |
| **Piso de severidade** | `references/severity-and-verdict.md` §1b | `suggestion` não é emitida sem `--completo`, `minor` tem teto de 5. E o corte vai no payload do despacho, não na consolidação: achado filtrado no fim já foi pago. |
| **Três passes, não cinco** | `references/subagent-dispatch.md` | Bug e segurança eram a mesma pergunta feita duas vezes; qualidade e padrões se sobrepunham em nome e colocação. Fundidos, some o achado duplicado, o contexto duplicado e dois subagentes de overhead fixo. |
| **Filtro por passe antes da leitura** | `steps/step-02-contexto.md` §1 | O corpo inteiro é lido só dos arquivos que algum passe julga inteiro. O passe 4 julga colocação, e para isso caminho + diff bastam. |
| **Leque primeiro, passes próprios depois** | `steps/step-03-passes.md` §1 | Os subagentes 3-5 são despachados **antes** dos passes 1-2. O orquestrador faz o trabalho dele enquanto eles rodam, em vez de deixá-los parados. |
| **Leque por latência** | `steps/step-03-passes.md` §2b | Cinco passes em paralelo terminam no tempo do mais lento; em série, na soma. Quem espera sente a soma. |
| **Bloqueio congelado por rodada** | `references/severity-and-verdict.md` §6a | Rodada N>1 de correção só devolve trabalho pelo que ficou aberto, pelo que a correção quebrou, e por `critical` novo. O resto é registrado, não devolvido — sem isso cada correção compra uma lista nova de motivos para corrigir. |

They do different things, and it is worth knowing which. Two are pure ordering — they cost nothing
and only shorten the wait. Two cut redundant work without cutting coverage. **Three cut coverage on
purpose**, which is new: the profile reviews a small safe change less, the severity floor stops
producing findings that never blocked anything, and merging the passes trades two independent
lenses for one. Each of those three is a deliberate trade, each declares itself in the report, and
the last mechanism cuts neither — it only decides which findings send work back a second time.

**The floor moved, and this is where it sits now:** the full body of the files pass 3 judges,
outside the `leve` profile; and the verification of every `critical` before it is written down,
plus the `major`s whose evidence is not already in hand.

It used to include every `major` too. That bar was set when a blocking false positive cost a full
round trip through development; the two-round cap and the frozen blocking scope (§6a) since bounded
that to one scoped correction, so the proof got cheaper because the error did. Below this floor the
review stops being worth running — and the honest way to go lower is a narrower scope, declared,
not a pass that pretends to have run.

## The two modes

The mode is **never presumed** — step-01 infers it and asks when the inference is not safe.

|               | **PBI** (default)                                         | **DIFF** (loose)                                            |
| ------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| Entry         | PBI id/slug, or a folder holding `sessao-dev.md`          | branch, PR, commit range, or the working tree               |
| Passes        | 1–5                                                       | 2–5 (pass 1 is `N/A` — no spec to check compliance against) |
| Extra context | `spec.md`, `task.md`, `DESIGN.md`/`EXPERIENCE.md`         | `<CODEBASE_DIR>` only                                       |
| Output        | `review.md` via `doninha-copy-writer` + `status.yml`       | `.doninha/reviews/{slug}.md`, written directly               |
| Verdict       | `APROVADO` / `NECESSITA CORREÇÕES` → `pbis.{slug}.review` | same verdict, no `status.yml`                               |

## Flow overview

```
step-01-escopo        → resolve DONINHA_ROOT · detect mode PBI vs DIFF · resolve the diff scope ·
                        offer resume · DECIDE THE PROFILE (leve/padrao/profundo) ·
                        seed sessao-review.md · number the review round
        ↓
step-02-contexto      → PBI: spec.md + task.md + sessao-dev.md + DESIGN/EXPERIENCE ·
                        both: <CODEBASE_DIR> in budgeted order + FULL content of every changed file
        ↓
step-03-passes        → verification shape when the round follows a correction ·
                        passes 1–2 run here (PBI mode only) ·
                        passes 3–5 dispatched to subagents IN PARALLEL, in a single message
                        (profile `leve`: pass 3 only, inline)
        ↓
step-04-consolidar    → dedup by location+mechanism · verify every critical/major ·
                        drop non-findings · number sequentially · decide the verdict
        ↓
step-05-fechamento    → PBI: hand off to doninha-copy-writer (review.md + status.yml), then
                        doninha-documentation when APROVADO ·
                        DIFF: write .doninha/reviews/ directly · record lessons · report
```

Each step file is self-contained — load only the one the flow currently needs (progressive disclosure). Start every session by reading [steps/step-01-escopo.md](steps/step-01-escopo.md).

## Artifact layout

```
.doninha/docs/modules/module_NNN_name/feature_NNN_name/pbis/pbi-NNN-slug/
  ├─ sessao-review.md   (this skill's own session tracker — written directly)
  └─ review.md          (canonical artifact — written ONLY by doninha-copy-writer)

.doninha/reviews/
  ├─ {slug}.md                 (DIFF mode only — written directly, no status.yml)
  └─ .sessao-review-{slug}.md  (DIFF mode session tracker, one per target)
```

Review rounds **accumulate**. `doninha-artifact-review` models `## Rodada de revisão {N}`, so a second review of the same PBI appends round N+1 instead of overwriting round N — the history of what was found and fixed is part of the artifact's value.

## What this skill owns vs. delegates

- **Owns and writes directly**: `sessao-review.md` (its own working state) and, in DIFF mode only, the report under `.doninha/reviews/`. Neither is a canonical product doc, and neither touches `status.yml`.
- **Delegates the canonical artifact**: in PBI mode, `review.md` and the `status.yml` update go through `doninha-copy-writer`, formatted by `doninha-artifact-review`. See the note below.
- **Delegates passes 3–5**: to subagents loaded with `doninha-reviewer-correctness` (3), `-design` (4), `-tests` (5). Those skills already define their own checklists and output format — this skill supplies context and consolidates, it does not restate their rules. A missing pass skill degrades to `SKIP` with a reason in the report; it never blocks.
- **Delegates the post-approval documentation**: on `APROVADO` in PBI mode, step-05 §1c invokes `doninha-documentation`, which updates the affected project docs and writes `learnings.md` through the copy-writer. This skill never writes those itself.
- **Delegates memory**: lessons and blockers go to `.doninha/STATE.md` via the memory skill when installed, otherwise appended directly under that file's own sections.
- **Never fixes anything**: findings go back to `doninha-desenvolver`.

> **Why agents are invoked here, when `doninha-desenvolver` forbids it.** The rule that matters is not "never call an agent" but "there is exactly one writer of canonical docs and `status.yml`." `doninha-desenvolver` writes `spec.md`/`task.md`/`sessao-dev.md` directly because those are its own working state. `review.md` is different: it is a canonical artifact with its own `status.yml` field (`pbis.{slug}.review`), the same category as `feature.md` and `pbi.md` — which is why `doninha-analisar` also routes through the copy-writer. This skill follows `doninha-analisar`'s precedent.
>
> This holds regardless of who called this skill. When `doninha-desenvolver` drives the cycle it **loads this skill into its own context** rather than dispatching a sub-agent, precisely so the fan-out in step-03 and the two agent invocations below keep working — a review that cannot write `review.md` or update `status.yml` is not a review that happened.
>
> Exactly **two** agents are invoked, both in step-05 and both in PBI mode only: `doninha-copy-writer`, which persists `review.md` and the verdict, and `doninha-documentation`, which owns the stage that follows an approved review. The second exists because a review that ends without documentation leaves the PBI shipping docs that describe the version before it, and the user's memory is not a wiring mechanism. It runs **after** the copy-writer, never before: it reads `pbis.{slug}.review` and refuses unless it is already `approved`. No other `doninha-*` agent is invoked from this flow.

## Configuration this skill reads

- `.doninha/docs/codebase/*` — conventions, architecture, structure, testing; the basis for pass 4 and for judging whether a change fits the project. Resolved **per repo with fallback** per `doninha-workspace-detection` (prefer `repos/<name>/.doninha/docs/codebase/*`, else the root). Missing or empty → warn once; pass 4 falls back to `doninha-project-research`. Never blocks.
- The PBI's own upstream artifacts (`spec.md`, `task.md`, `sessao-dev.md`, `DESIGN.md`, `EXPERIENCE.md`) — read, never rewritten. PBI mode only.
- `DONINHA.md` — team policies when present. No review threshold is hardcoded here.

There is **no tracker dependency**. This skill never reads or writes Azure DevOps; the verdict lives in `status.yml` (PBI mode) and syncing that outward is `doninha-desenvolver`'s job.

## Assets & references

- [references/diff-scope.md](references/diff-scope.md) — how the reviewed diff is resolved in each mode, and what is excluded from it.
- [references/passes-1-2.md](references/passes-1-2.md) — the two passes this skill runs itself: spec/task compliance and diff analysis.
- [references/subagent-dispatch.md](references/subagent-dispatch.md) — the payload contract for passes 3–5.
- [references/severity-and-verdict.md](references/severity-and-verdict.md) — severity table, verification ladder, verdict rule, and what is not a finding.
- [assets/sessao-review-template.md](assets/sessao-review-template.md) — the session tracker's schema.

## Language

Skill instructions (this file + steps + references + assets) are in **English**. All facilitation with the user and every generated artifact are in **Portuguese (PT-BR)**, per Doninha convention.

**File names follow a different split, and it is deliberate** — it matches `doninha-analisar` and `doninha-desenvolver`, so the three orchestrator skills read the same side by side:

| Folder        | Naming                 | Why                                                                                                                      |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `steps/`      | PT-BR                  | A step is a phase of a conversation held in PT-BR (`escopo`, `contexto`, `passes`, `consolidar`, `fechamento`).          |
| `references/` | English                | A reference is named after the concept it teaches, and those are technical terms (`diff-scope`, `severity-and-verdict`). |
| `assets/`     | after what it produces | `sessao-review-template.md` seeds `sessao-review.md`, a PT-BR artifact — the template's name tracks the artifact's.      |

The rule above governs **content**, not file names; the two are independent axes. Do not rename these files to "fix" the mismatch in isolation — the inconsistency would only move, and a maintainer reading `step-05-fechamento.md` in the sibling skills would find `step-05-closeout.md` here. Changing it is a repo-wide decision for all three skills at once, not a per-skill one.
