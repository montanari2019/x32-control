# Reference Docs Reconciliation

**Purpose:** Consume the team's own documentation as an input to research, without ever letting unverified prose become a generated fact.

Teams often keep a hand-written catalog of their systems (a repo `INDEX.md`, a wiki export, an ADR set, an onboarding page). It carries knowledge the code cannot state: business purpose, internal nicknames (`v3`, `FLEX`), obsolescence status, which system consumes which, and *why* a module exists. Throwing that away and regenerating everything from the code loses it. Copying it verbatim ships stale claims as truth. Reconciliation is the middle path.

## Authority split

| Source | Authoritative for |
|--------|-------------------|
| **The code** | structure, stack, module list, dependencies, integrations — anything mechanically checkable |
| **The reference doc** | intent, business purpose, nicknames, status (legacy/migrating), cross-system relations, historical context |

When the two disagree about something checkable, **the code wins** and the disagreement is recorded. When the doc asserts something not checkable (a business rationale), it is usable as-is, attributed.

## Procedure

1. **Declare the sources.** Read `research.referencias` from `DONINHA.md`'s YAML frontmatter — a list of paths relative to the workspace root. If the key is absent, ask once whether such a doc exists; record the answer (a path list, or `[]` so it is not asked again).

2. **Extract claims, scoped and capped.** Read at most **2** reference docs, at most **600 lines each**. For a larger doc, index it first and read only the sections that name the repo being researched:

   ```bash
   grep -n '^#' <doc> | head -60
   ```

   Never read a wiki export end-to-end. Walk only the sections you selected and bucket each claim by target: workspace-level, `repo`, or `repo/module`. Only claims for the repo being researched this pass matter — ignore the rest.

   Extract at most **20 checkable claims** per repo per pass, in this priority order:

   1. module/unit existence
   2. cross-system relations (consumes / is consumed by)
   3. status and obsolescence
   4. named topics, queues and contracts
   5. capability claims
   6. class/symbol claims — the lowest value per token; only if budget remains

3. **Verify by claim *shape*, not claim by claim.** One search per shape, not one per claim. Total budget for the entire reconciliation: **5 searches**.

   | Claim shape | Check | Cost |
   |-------------|-------|------|
   | "module `X` exists" | the pass inventory's declared units and top-level directories already list every unit | **zero searches** |
   | "consumes system `S`" | one alternation over the system names: base URL, client, credential or contract | 1 search |
   | "listens to topic `T`" | one alternation over the topic names/constants | 1 search |
   | "handles `<capability>`" | one alternation over the domain terms, against handler/job/service **paths** | 1 search |
   | "class `C` does Y" | one alternation over the symbol names | 1 search |

   Shape by shape, build a single pattern and run it once:

   ```bash
   rg -l --max-count 1 -e 'RendimentoCapital' -e 'Averbacao' -e 'MargemReserva' | head -30
   ```

   Use the tool degradation in [code-analysis.md](code-analysis.md) (`sg` → `rg` → `grep`). **Never open a file to confirm a claim** — one search hit is enough for `✓`.

4. **Mark every claim.**

   | Mark | Meaning | Where it goes |
   |------|---------|---------------|
   | `✓` | asserted in the doc **and** confirmed in the code | becomes normal content — no mark in the output |
   | `⚠` | asserted in the doc, **not** located in the code | `## Divergências` in `OVERVIEW.md` |
   | `+` | present in the code, **absent** from the doc | `## Divergências` in `OVERVIEW.md`, plus documented normally |

   A claim left over the 20-claim budget is **not** silently dropped and **not** promoted to content. It gets a `⚠` line that says so explicitly, so nobody mistakes "not checked" for "checked and missing":

   ```
   ⚠ INDEX.md §<seção> afirma <claim> — não verificado nesta passagem (limite de claims).
   ```

   Record the same claims as pending in the pass's `.research-state.md` so a later pass verifies them instead of re-discovering that they exist. Under-verifying and saying so is cheaper than exhausting the session; a truncated research pass is the only outcome that is not honest.

5. **Write.** `✓` content flows into `OVERVIEW.md` / `modules/*.md` / the technical files as ordinary prose. `⚠` and `+` are listed in `## Divergências` with one line each, naming the doc and the section.

## Rules

- **Never copy unverified prose into a generated doc as fact.** If it is checkable and did not check out, it is a `⚠` line — not a capability bullet.
- **A `⚠` is a finding, not a failure.** It usually means the doc is stale or the code moved. Report it; do not "fix" the reference doc, and do not delete the claim silently.
- **Do not mirror the reference doc's shape.** Its structure is the team's; the output structure is `overview-reference.md` + `module-reference.md`. In particular, do not carry over endpoint-level inventories — see the depth rule in [module-reference.md](module-reference.md).
- **Keep the domain vocabulary** exactly as the doc and code use it. Reconciliation checks facts, not wording.
- **Reference docs are read-only inputs.** Never edit or regenerate a file listed in `research.referencias`.
- **Omit `## Divergências`** entirely when there is no reference doc, or when nothing diverged.

## Example

Reference doc says:

> `csg-mxt-backend`/`rendimento-capital`: Rendimento de capital — relatórios e importações.

Checks: `rendimento-capital` absent from the inventory's declared units (zero searches); `rg -l --max-count 1 "RendimentoCapital" | head -30` → hits under `contrato/src/main/java/.../rendimento/`.

Output:

- `modules/contrato.md` gains a `### Rendimento de capital` capability group (the business meaning came from the doc, the location from the code).
- `OVERVIEW.md` `## Divergências` gains:
  `⚠ INDEX.md lista rendimento-capital como módulo próprio; no código é um pacote dentro de contrato/.`
