# Context Budget

Research reads a codebase; a codebase is unbounded. Without a ceiling this skill consumes the whole session on a large repository, and a session that dies mid-pass leaves nothing behind. The budget here is what makes a pass finish; `SKILL.md` Step 11 is what makes an unfinished pass resumable.

**A pass is a unit of work, not "the whole repo".** A big repository is researched in several passes, each one complete in itself. That is the design, not a degradation.

## Input rules

- **Escalation ladder** — stop at the cheapest rung that answers the question: inventory → path listing → `rg -l` / `rg -m 3` → a line range → the whole file, last resort. **Never read a file in full to confirm a hint.** Never read a lock file.
- **Every search capped at the wire, not by intention** — `rg -l --max-count 1 <pat> | head -30`. A search that would blow its cap means the pattern is too broad, never that the cap should rise. The ladder, the fixed exclusions and the per-tool forms are in [code-analysis.md](code-analysis.md); they are rules there, not tips.
- **Unit manifests:** in a repo with more than 8 separable units, read the **root/parent** manifest only (`pom.xml` `<modules>`, `settings.gradle` `include`, `package.json` `workspaces`, `pnpm-workspace.yaml`) and take the unit list from there. Read an individual unit's manifest only for the modules in the current Step 9 batch. Never glob `pom.xml` or `*.csproj` recursively.
- **Dominance, not completeness.** Nearly every claim in these documents is about what predominates ("kebab-case is the convention here"), which a capped search settles. The one claim needing completeness — the module list — comes from the Step 0.5 inventory and the parent manifest, both bounded.
- **Per-file input caps** live in each template's `Extract from` block, together with the output `Size limit`. The caps are binding; a template's file range is a ceiling, never a target.

## Where the ceiling sits depends on the mode

| Mode | Binding limit | Why |
|---|---|---|
| Delegated (see [delegation-contract.md](delegation-contract.md)) | the **per-step caps**, enforced inside each sub-agent | the orchestrator never holds a line of the repo's code, so no pass-wide file count applies to it |
| Inline (no sub-agent mechanism, or a small repo) | **40 content files** for Steps 0–8 combined, on top of the per-step caps | every read weighs on the one context doing the work |

Directory listings and search output do not count as files read, but obey their own caps. Step 9 adds its per-module cap on top in both modes.

## Output ceilings

Total for `<CODEBASE_DIR>` excluding `modules/`: **18,000 tokens**.

| File | Size limit |
|---|---|
| `OVERVIEW.md` | 1,750 |
| `stack.md` | 1,750 |
| `structure.md` | 1,500 |
| `architecture.md` | 2,750 |
| `conventions.md` | 2,250 |
| `integrations.md` | 2,000 |
| `concerns.md` | 2,500 |
| `testing.md` | 2,000 |
| `risks.md` | 1,500 |
| `modules/<slug>.md` | 1,500 each |

`modules/` has no folder ceiling because a reader opens exactly one file from it.

## Reallocation log

`risks.md` entered the pass without the total moving: its 1,500 tokens came out of four existing ceilings, and the total stayed at 18,000 — the ceiling is reallocated, never stretched.

| File | Before | After | Δ | Measured p90 | Headroom after |
|---|---|---|---|---|---|
| `OVERVIEW.md` | 2,000 | 1,750 | −250 | 1,770 | **−20** |
| `stack.md` | 2,000 | 1,750 | −250 | 1,725 | +25 |
| `architecture.md` | 3,000 | 2,750 | −250 | 2,990 | **−240** |
| `conventions.md` | 3,000 | 2,250 | −750 | 2,555 | **−305** |
| `risks.md` | — | 1,500 | +1,500 | — | not yet measured |

**Three of the four cuts go past the slack those files had.** That is the deliberate cost of the reallocation, and it is stated here rather than left for a reader to compute: before it, two of eight ceilings sat below measured p90 (`concerns.md` by 490, `integrations.md` by 8); after it, five of nine do. `conventions.md` still pays the largest single cut because it had the most absolute slack to give, not because the cut fits inside it.

`concerns.md` and `integrations.md` were left untouched **on purpose** — they were already the two furthest below their own ceiling, and taking from them would have deepened the worst cases instead of spreading the cost. `testing.md` was left untouched because its ceiling was set deliberately one PBI earlier.

Measured over 18 researched repos, converting each template's own vocabulary (tokens ≈ words × 1.667). These ceilings are what a pass must respect, and **the check that enforces them is `SKILL.md` § Size verification**: dimension against the word figure before writing, `wc -w` after, the count travelling back in the worker's return. The measurement above was taken *before* that check existed — back when a file over its ceiling was written anyway — which is what makes it the honest input to the reallocation, and these five files are where the check now bites first.

## Hitting a ceiling

**Hitting the ceiling is a resume, not a failure.** Write what you established, record what is pending in `.research-state.md` (`SKILL.md` Step 11), tell the user what remains, and end the pass. Never leave an output file half-written without recording it. A cap is never raised during a pass.
