---
name: 'doninha-project-research'
description: 'Two modes, and when the invocation is ambiguous the mode and its scope are decided with the user before anything is read. Index mode (cheap, the default when the ask is clear or there is no way to ask): fills the DONINHA.md repos index — one router line per repo plus the module sub-bullets of a researched repo, from root-level files only, at a cost independent of repo size. Full research: OVERVIEW.md with the business role and module map, the eight technical files (stack, structure, architecture, conventions, integrations, concerns, testing, risks) and optional modules/<slug>.md, reconciled against the team''s own reference docs, under a context budget in resumable passes. Full research covers one repo; a sweep over every repo under repos/ exists only when the user explicitly picks it, and never as a consequence of a detected GAP. Use when the index has pending descriptions, when those files are missing, incomplete or stale, when onboarding a project, or when a codebase GAP is detected. Triggers on: project research, map codebase, codebase analysis, missing codebase files, onboard project, setup doninha, analyze project structure, detect project stack, map modules, map services, what does this repo do, index repositories.'
---

# Doninha Project Research

Maps an existing codebase into the structured knowledge files under `.doninha/docs/codebase/` — the **single source of project/repo information** every other Doninha agent reads to know what the project *is for* and how it is built. Missing or incomplete files (a "GAP") make those agents produce generic output that does not match the project. `DONINHA.md` is workspace-level: repos index and configuration/policies only, never project synthesis.

The output is layered on purpose, so a reader loads only what it needs:

| Layer | File | Answers |
|-------|------|---------|
| Workspace router | `DONINHA.md` repos index | which repos exist, where, roughly what each one is for, and — for a researched repo — which modules it has |
| Repo entry point | `<CODEBASE_DIR>/OVERVIEW.md` | this repo's business role, nicknames/status, cross-repo relations, module map |
| Module detail | `<CODEBASE_DIR>/modules/<slug>.md` | what one module does for the business, by business area |
| Technical detail | the eight `stack`/`structure`/`architecture`/`conventions`/`integrations`/`concerns`/`testing`/`risks` files | how it is built |

Readers go top-down and stop as soon as they have enough — never load an entire layer to find one module.

## Two modes — settle which one before you start

These layers cost wildly different amounts, and conflating them is what burns a session. **Filling the workspace router is not the same job as researching a repository**, and it must never be paid for at the same price.

| | **Index mode** | **Full research** |
|---|---|---|
| Produces | the `DONINHA.md` repos index — one router line per repo | `<CODEBASE_DIR>/*` for **one** repo, plus that repo's module sub-bullets in the index |
| Scope | every repo under `repos/`, or a single one — see [Choosing the mode](#choosing-the-mode) | one repo; every repo only by explicit choice |
| Cost | flat, independent of repo size | bounded per pass (see Context budget) |
| Steps | [Step A](#step-a-index-mode) only | Steps 0 → 11, once per repo in scope |

**Index mode over every repo is the default** — it is what runs when the ask is clearly about indexing, and what runs when there is no way to ask. Full research is never reached by default, and never by iterating over the workspace.

### Choosing the mode

**Ask before reading anything** — before the Step A probe and before Step 0. The two modes differ by orders of magnitude in cost, so which one runs is the user's call whenever the invocation does not already settle it. Two questions, in sequence:

**1. Modo:**

> 1. **Índice** — preenche o roteador do `DONINHA.md`; barato, não entra na árvore de nenhum repo
> 2. **Pesquisa completa** — `<CODEBASE_DIR>/*` (Steps 0 → 11)
> 3. **Ambos** — o índice primeiro, a pesquisa completa depois

**2. Escopo**, per the answer above:

| Answer to 1 | Question 2 |
|---|---|
| Índice | todos os repos de `repos/` (padrão) \| um repo só — qual? |
| Pesquisa completa | um repo — qual? (padrão) \| **todos** os repos de `repos/` (varredura) |
| Ambos | o índice cobre todos; a pesquisa completa: um repo — qual? (padrão) \| todos (varredura) |

Rules:

- **Asked at most once per invocation.** The answer is an **execution choice, not configuration** — it never reaches the `DONINHA.md` YAML frontmatter. (`research.referencias` is the opposite: it *is* configuration, which is why it is asked once per workspace and recorded — see Step 0.)
- **Do not ask when the invocation already answers it.** Asking back what the request already said is friction, not safety:
  - the user names a repo → full research, that repo;
  - "indexa os repositórios" / "what are these repos" / right after `doninha init` or a clone / the index has `descrição pendente` entries → index mode, every repo;
  - a consumer (`doninha-desenvolver`, `doninha-backend`, `doninha-frontend`, `doninha-reviewer-*`, `doninha-ux`) needs `<CODEBASE_DIR>` for a repo somebody is about to work in → full research, that repo.
- **Resuming answers both questions.** "Continue" / "resume" means full research on the repo whose `.research-state.md` has pending work — take the mode and the scope from that pass, never from a fresh question (see Resume and freshness).
- **No way to ask** (non-interactive host): index mode over every repo — the safe default. Never the sweep.
- **Single-repo / legacy workspace** (`repos/` holds no repository sub-directory): neither question is asked. There is one target and no index to fill.
- **Exactly one repo under `repos/`**: question 2 is skipped — the answer is forced.
- **A codebase GAP never picks the mode.** N repos missing `<CODEBASE_DIR>` is normal in a fresh workspace, and it still leads to the index-mode default: fill the index for all of them, then research the one repo the current task actually touches. The only thing that authorises a sweep is the user choosing it **in this invocation**.

#### The sweep (full research over every repo) — explicit opt-in only

- **Confirm the cost once, with the real N, before reading anything:** N passes of up to 17,000 tokens of output each plus their evidence; that it very likely does not fit in one session; that it stops at a repo boundary and resumes there.
- **Strictly sequential, one repo at a time.** Each repo is a complete pass, Steps 0 → 11 — including its index entry (Step 10) and its `.research-state.md` (Step 11). Never fan repos out: the ≤ 4-concurrency budget is **inside** a repo (per file, per module), never across repos.
- Announce `repo <k>/<n>: <name>` when each one starts, and **close a repo before touching the next**. That boundary is the resume point.
- **The queue is derived, not stored:** the repos of the `DONINHA.md` index, in index order, minus the ones already fresh per their own `.research-state.md`. No new artifact, no workspace-level state.
- **Per-repo caps are never widened nor pooled across repos.** A sweep is N bounded passes, not one big pass.
- Stopping midway is a normal outcome: say which repos landed, which remain, and that running the skill again continues from the first repo with pending work.

## Target repository resolution (multi-repo)

Before writing anything, resolve **where** the codebase docs go. A Doninha workspace may hold several repositories under a `repos/` folder at the workspace root (`doninha init` always creates that folder, so its mere existence means nothing — what counts is whether it contains repository sub-directories). Codebase context is **per repository** — each repo owns its own context and must not be mixed with another's:

- **Multi-repo (`repos/` contains at least one repository sub-directory):** research operates on **one target repository at a time**. The target is `repos/<name>/`. Define:

  ```
  <CODEBASE_DIR> = repos/<name>/.doninha/docs/codebase/
  ```

  Write every codebase file into that per-repo directory. Never write a repo's context into the workspace root's `.doninha/docs/codebase/`, and never into another repo's directory. If more than one repo is present and the target is ambiguous, resolve it with the scope question in [Choosing the mode](#choosing-the-mode) — never default to all of them, and never spread findings across the root. During a sweep the target is **one repo at a time**, resolved again at each repo boundary. (Index mode needs no target: it writes only to `DONINHA.md`.)

  Because `<CODEBASE_DIR>` lives **inside** the managed repository (`repos/<name>/.doninha/…`), that directory would otherwise show up as untracked in the repo's own git. Before (or right after) writing the codebase files, ensure the target repo's own `.gitignore` contains a `.doninha/` entry, so Doninha's regenerable context is never accidentally committed into the client's repository. Add the entry if missing; it is idempotent — never duplicate it.

- **Single-repo / legacy (`repos/` absent, or present but with no repository sub-directory — only `README.md`):** behave as before —

  ```
  <CODEBASE_DIR> = .doninha/docs/codebase/
  ```

Everywhere below, `<CODEBASE_DIR>` means the directory resolved by this rule. `DONINHA.md` is **workspace-level** and always stays at the workspace root regardless of this resolution; it never receives project synthesis — only the repos index (see Step 10).

## GAP Detection

Before any Doninha workflow begins, check for these files under the resolved `<CODEBASE_DIR>` (per-repo in a multi-repo workspace, root otherwise — see Target repository resolution):

```
<CODEBASE_DIR>/
├── OVERVIEW.md          ← entry point: business role, status, relations, module map
├── modules/<slug>.md    ← conditional (≥ 4 separable units) — NOT a GAP trigger
├── architecture.md
├── concerns.md
├── conventions.md
├── integrations.md
├── risks.md
├── stack.md
├── structure.md
└── testing.md
```

If the directory or any of the 9 files is missing, that repo has a GAP. In a multi-repo workspace a GAP is evaluated **per repository** — each `repos/<name>/` has its own `<CODEBASE_DIR>`.

**A GAP is closed for the repo at hand, not for the workspace.** Report which repos have one, then run full research on the one that is actually needed now. The others keep their index line and wait. A list of GAPs is a report, never a work queue — only the user explicitly choosing the sweep in [Choosing the mode](#choosing-the-mode) turns it into one.

**A repo with the other files on disk and no `risks.md` is incomplete research, not a repo to research again.** `risks.md` joined this tree after those passes ran, so every repo researched by the earlier version now reports a GAP. Report it as exactly that — **`risks.md` ausente, the rest on disk** — and say that closing it costs one step, not a pass. **This detection runs nothing**, here as everywhere else in this section. When the user later invokes this skill on that repo, the closing is the partial-pass shape Step 11 already handles: the files on disk stay *fresh*/`adopted` and only Step 7.5 runs, the repo never re-read for the files that are already there — re-deriving them is the whole waste this skill exists to avoid.

`modules/` is **conditional and incremental**: its absence is never a GAP, and a module map row without a doc means "not researched yet", not "nothing there" (see Step 9).

### Three states, not two

"Exists or does not exist" is two states, and a file written by an earlier version of this skill passes straight through them: it exists, so it is not a GAP, so nothing ever looks at it again. The vocabulary has three:

| State | Means | What it authorizes |
|---|---|---|
| `ausente` | the file does not exist | a GAP — full research of that step |
| `desatualizado` | it exists, but was written by an earlier version: no header trace, or a section that never legitimately goes missing | **the offer** to complete it — never an automatic rewrite |
| `fresh` | it exists, carries the current version's sections, and `.research-state.md` lists it as done at the current `commit` | skipped without being read |

**A GAP is a file that does not exist.** A file on disk without the header trace of Step 0.4 is `desatualizado`, never `ausente`. The distinction carries a consequence: a GAP authorizes researching that step from scratch, while `desatualizado` authorizes at most the offer. Collapsing the two rewrites, unasked, a file that needed one section.

**This detection reports the three states and does not open the offer.** It runs before any Doninha workflow, and the consumers reading it only want context — asking a question in the middle of another agent's work is noise, where reporting is information. The offer belongs to this skill's own invocation, and how a `desatualizado` file is detected without opening it is in [Resume and freshness](#resume-and-freshness).

## Step A: Index mode

An index line is a **router**: one sentence of business role plus a short stack. It needs no architecture, no conventions, no testing, no module docs — and it must never trigger them.

The **repos in scope** are the ones the scope question settled ([Choosing the mode](#choosing-the-mode)): every repo under `repos/` by default, or the single one the user named. Everything below applies once per repo in scope, and to no other repo.

### 1. Get the mechanical half from root-level files only

One probe per repo in scope, reading nothing below its root. A 40,000-file monolith costs the same as a 20-file utility because the tree is never entered:

```bash
R=repos/<name>
ls -1 "$R" | head -40
sed -n '1,40p' "$R/README.md"
git -C "$R" remote get-url origin
```

Then **one** root manifest — whichever the listing showed — for the stack and the declared-unit count:

```bash
sed -n '/<modules>/,/<\/modules>/p' "$R/pom.xml" | head -40
```

(or `name`/`dependencies`/`workspaces` from `package.json`, or `go.mod` / `Cargo.toml` / `requirements.txt` / `*.csproj` / `settings.gradle`.)

**3 files per repo, hard cap.** Never open source code in index mode; never walk the tree; never read a lock file. No root manifest at all? Take the stack from the extension mix of the root listing and mark it `(inferido por extensão)`.

### 2. Write the one sentence a machine cannot

The probe already gave you the stack. You supply the business role, from the README lead, the team's reference docs (Step 0's `research.referencias`), and the remote/repo name. Then write the entry per [Step 10](#step-10-doninhamd--index--config-only-no-project-synthesis)'s format and rules.

- **A missing or boilerplate README means the role is not on disk.** Ask the user, or write `_(papel de negócio a confirmar)_` — never infer a purpose from the folder name. A wrong router line is worse than an admitted gap, because every downstream agent routes on it.
- **A stack marked `(inferido por extensão)` is a guess, not a finding.** Keep the marker or drop the stack half; do not launder it into a confident claim.
- A repo whose `<CODEBASE_DIR>/OVERVIEW.md` already exists takes its role from there instead — that is strictly better than the README, and free.
- Cap the entry at ~250 characters. Omit the `→ docs:` continuation line for a repo with no `<CODEBASE_DIR>` yet; it gets one when full research runs.

### 3. Close the pass

Index mode is **done** when no `descrição pendente` placeholder remains for any repo in scope — every repo under `repos/` in the default scope, the single named repo otherwise (the placeholders of out-of-scope repos stay untouched, and you say which they are). Then state which repos have no `<CODEBASE_DIR>` yet and that full research is available per repo, on request — do **not** start it.

## Context budget

Research reads a codebase; a codebase is unbounded. Without a ceiling this skill consumes the whole session on a large repository, and a session that dies mid-pass leaves nothing behind. The budget is what makes a pass finish, and Step 11 is what makes an unfinished pass resumable.

**A pass is a unit of work, not "the whole repo".** A big repository is researched in several passes, each one complete in itself. That is the design, not a degradation.

Output ceiling for `<CODEBASE_DIR>` excluding `modules/`: **18,000 tokens** — overview 1,750 + stack 1,750 + structure 1,500 + architecture 2,750 + conventions 2,250 + integrations 2,000 + concerns 2,500 + testing 2,000 + risks 1,500. `modules/` has no folder ceiling because a reader opens exactly one file from it.

The input rules — the escalation ladder, the at-the-wire search caps, the parent-manifest rule, and where the ceiling sits in delegated vs inline mode — are in [context-budget.md](references/context-budget.md). The numeric caps that a worker must obey are inlined in each step below, because a cap behind a link is a cap a worker skips.

**The `## Guia de mudança` costs nothing to derive.** Its entries come out of the evidence the step already read — migrations, generated clients, contract tests, lint config, path aliases, environment variables. No step opens an extra file to hunt for a consequence, and **no `Input cap` rises because of it**. Knowing a consequence is not a licence to read the repository: the input budget is the expensive one, and "just check what breaks" is what would blow it first.

**Hitting a ceiling is a resume, not a failure.** Write what you established, record what is pending in `.research-state.md` (Step 11), tell the user what remains, and end the pass. A cap is never raised during a pass.

### Size verification — the unit is the whole rule

Every template declares its ceiling in **both** units: `**Size limit:** 2,750 tokens (~1,650 words)`. The only measurement a pass can afford is `wc -w`, so the rule is one line long:

**Compare words against the word figure, never against the token figure.** The declared ratio is 1.667 tokens per word, so measuring `wc -w` against the token number loosens every ceiling by ~40% — the check would then approve exactly the files it exists to stop. Measured before this rule existed: 15 of 144 technical files were over their own ceiling, and comparing words to tokens would have passed all 15.

Two ends, and the whole thing costs one `wc`:

1. **Before writing** — dimension the content against the template's word figure and cut until it fits, in the order § Output Quality Rules sets. The file never reaches disk at its original size.
2. **After writing** — `wc -w "<path>"` on the file, the path quoted, and the count travels back in the worker's return (see [delegation-contract.md](references/delegation-contract.md)). The orchestrator already knows the ceiling — it built the payload — so it compares the number and sends the file back to be reduced when it is over. It **never opens the file** to do this: it receives a number, not a file, and that is what keeps the evidence out of its context.

**Reduced and still over: write it anyway and record the ceiling in `caps_hit`.** The rule is that nothing reaches disk at its original size, not that it fits at any price — and `.research-state.md` already treats a hit ceiling as a finding, not a failure.

No `Input cap` rises because of this verification. Measuring what this pass just wrote is not a licence to read the repository, and a file this pass did **not** write is never opened to be measured — a fresh output is still skipped without being read.

## Delegation

Full research is expensive because of the **evidence**, not the output — and evidence that lands in the orchestrator's context stays there for the rest of the session. So the orchestrator coordinates and writes what spans the pass; sub-agents do the reading.

| Work | Who |
|---|---|
| Step 0 (reference docs), Step 0.5 (inventory) | orchestrator — compact, shared by every worker |
| Steps 1–7.5 (the eight technical files) | one sub-agent **per file**, ≤ 4 concurrent |
| Step 8 (`OVERVIEW.md`) | orchestrator — zero new code reads |
| Step 9 (module docs) | one sub-agent **per module** in the batch, ≤ 4 concurrent |
| Steps 10–11 (index, pass state) | orchestrator |

A worker receives its step, the inventory, its reference template, its output path, **its caps inlined**, and the relevant reference-doc slice — and returns **only** the path written, the file's **word count** from `wc -w`, and one ≤ 20-word line. The orchestrator compares that count against the ceiling it inlined and hands the file back to be reduced when it is over, without ever opening it. The orchestrator therefore never holds a line of the repo's code.

Steps 1–7.5 are independent because a later step consumes an earlier one's **file on disk**, never its working context — with **one** ordering constraint: Step 3 reads `structure.md`, so dispatch Step 2 in the first wave and Step 3 only after it returns. Steps 1, 4, 5, 6, 7 and 7.5 have no such dependency.

**Run inline instead** when the repo has ≤ 200 tracked files, or when the host has no sub-agent mechanism — same caps, one step at a time, discarding each step's working context after its file is written. The payload rules, the return rules and the inline fallback are in [delegation-contract.md](references/delegation-contract.md).

## Full research workflow (one repo per pass)

Only for the repo somebody is about to work in — or, during a sweep, the one repo of the current boundary. If the ask was "index the repositories" or "what are these repos", you are in the wrong section — go to [Step A](#step-a-index-mode). If the invocation never said, go back to [Choosing the mode](#choosing-the-mode) before opening a single file.

Follow this order — a later step consumes an earlier step's **written output on disk**, never its working context.

**Skip a step whose output file already exists and is fresh** (see Step 11 for what "fresh" means), unless this pass was explicitly asked to refresh it. Re-deriving a file that is already on disk is the largest single waste available in this skill. When you skip, say so. What you may never skip is the evidence discipline: a file you *do* write is grounded in what you read this pass, never in assumption.

Read [code-analysis.md](references/code-analysis.md) for techniques on how to analyze the codebase effectively — and for the search caps the budget above requires.

### Step 0: Reference Sources

Before writing anything, find out whether the team already documents this ecosystem by hand. Read the YAML frontmatter of `DONINHA.md` at the workspace root:

```yaml
research:
  referencias: ['INDEX.md'] # paths relative to the workspace root
```

- **Key present with paths** → those docs are inputs for every step below.
- **Key present and empty (`[]`)** → the team already said there is none. Do not ask again.
- **Key absent** → ask **once**: is there a reference doc for these repos (a repo index, wiki export, onboarding page, ADRs)? Record the answer in the frontmatter — a path list, or `[]` — so the question is asked at most once per workspace. This is configuration, which is exactly what `DONINHA.md` is allowed to hold (see Step 10).

Authority split: **the code** is authoritative for anything mechanically checkable (structure, stack, module list, dependencies); **the reference doc** is authoritative for intent — business purpose, internal nicknames, obsolescence status, which system consumes which. When the two disagree about something checkable, the code wins and the divergence is recorded.

Nothing from a reference doc reaches a generated file without passing through the verification and marking procedure in [reference-docs-reconciliation.md](references/reference-docs-reconciliation.md) (`✓` confirmed / `⚠` in the doc but not found in code / `+` in code but absent from the doc). Reference docs are **read-only** — never edit or regenerate them.

**Budget:** read each declared doc **once**, at most 2 docs, at most 600 lines each, and only the sections that name the repo of this pass. Index a larger doc with `grep -n '^#' <doc> | head -60` and read the selected sections only. Claim verification is capped at 20 claims and 5 searches for the whole pass — see [reference-docs-reconciliation.md](references/reference-docs-reconciliation.md).

### Step 0.4: The pass trace (two lines, every pass)

Two values, captured before anything else is read:

```bash
REPO=<REPO_ROOT>

date -u +%Y-%m-%d
git -C "$REPO" rev-parse --short HEAD
```

They are the `analisado_em` and the `commit` of **every file this pass writes** — the trace the reference templates open with (see the reference templates), so they have to exist before the first output is written, not after.

**This step runs on every pass, resumed ones included**, and its two values are **never read back from `.research-state.md`**. That is the whole reason it is not part of the Step 0.5 inventory: the inventory is expensive and cacheable, and a resumed pass reuses it verbatim, but a cached trace is last pass's date stamped on this pass's files. A pass resumed on another day, or over another `HEAD`, has its own trace; the recorded pair belongs to the pass that wrote the files already on disk.

**Not a git work tree?** The pass then has no commit: the `commit` field is omitted from every header, with the reason said in one line, and no sha is invented.

**Budget:** the two commands above, once per pass. No file read. No `Input cap` anywhere rises because of this step — the commit is the same `rev-parse` the pass already ran, and the date costs nothing.

### Step 0.5: Inventory (one bounded scan)

This is the **only** place the directory tree is walked. Every step below reads this inventory instead of re-globbing, so the same tree is never traversed twice. `git ls-files` comes first because it already honours `.gitignore` — build output and dependencies never enter the scan.

```bash
REPO=<REPO_ROOT>

git -C "$REPO" ls-files | wc -l
git -C "$REPO" ls-files | awk -F/ 'NF>1 {print $1}' | sort | uniq -c | sort -rn | head -40
git -C "$REPO" ls-files | awk -F. 'NF>1 {print $NF}' | sort | uniq -c | sort -rn | head -25
git -C "$REPO" ls-files | grep -E '(^|/)(package\.json|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|pnpm-workspace\.yaml|lerna\.json|go\.mod|Cargo\.toml|requirements\.txt|Pipfile|Gemfile|[^/]+\.csproj|Dockerfile|docker-compose\.ya?ml|\.env\.example)$' | awk -F/ 'NF<=4' | head -80
git -C "$REPO" ls-files | grep -E '(^\.github/workflows/|^azure-pipelines|^\.gitlab-ci|^Jenkinsfile|^sonar-project\.properties|^\.editorconfig|^\.prettierrc|eslint\.config|^tsconfig\.json)' | head -30
TESTS='(^|/)(tests?|__tests__|spec)/|\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|(^|/)test_[^/]+\.[a-z]+$|Tests?\.(java|kt|cs)$'
git -C "$REPO" ls-files | grep -Eic "$TESTS"
git -C "$REPO" ls-files | grep -Ei "$TESTS" | head -20
git -C "$REPO" log --oneline -20
```

The test pattern matches **test-file naming**, not any path containing the word. A bare `grep -Ei '(test|spec)'` counts a `.specs/` folder and every doc with "test" in its name as tests, and Step 7 then reports a suite that does not exist — a wrong footprint is worse than no footprint.

Then read **one** file to get the declared units — the parent manifest the scan above found, never a recursive glob:

```bash
sed -n '/<modules>/,/<\/modules>/p' "$REPO/pom.xml" | head -60
```

(or the `include` lines of `settings.gradle`, `workspaces` in `package.json`, `packages` in `pnpm-workspace.yaml`.)

The trace of this pass — the date and the commit every generated file opens with — is **not** part of this inventory. It is captured in Step 0.4 and lives there for a reason: this scan is cached in `.research-state.md` and a resumed pass reuses it verbatim, which is exactly what a trace must never be.

**Not a git work tree?** Same caps, explicit prune:

```bash
find <REPO_ROOT> -maxdepth 3 -type d \( -name node_modules -o -name target -o -name dist -o -name build -o -name vendor -o -name .git \) -prune -o -type d -print | head -60
```

The step produces a compact inventory — total tracked files, top-level directories with counts, the extension histogram, manifest and CI paths, the declared units with their paths, the test footprint and the commit-subject sample. That inventory, **not the raw tree**, is what Steps 1–3 and the Step 8 module map consume. It is recorded in `.research-state.md` (Step 11) so a resumed pass never repeats the scan.

**Budget:** the commands above, once. No file read beyond the one parent manifest. Never re-run the inventory mid-pass; a step needing a path the inventory lacks may glob **once**, scoped to its own module or config family, and that glob counts against its search cap.

This is also what makes the Step 8 claim that the module map is cheap true by construction: the map is `declared_units` plus top-level directories, both already in hand.

### Step 1: Identify the Stack

Research the project's technology stack by examining:

- **Package manifests**: `package.json`, `requirements.txt`, `Pipfile`, `Gemfile`, `go.mod`, `pom.xml`, `build.gradle`, `Cargo.toml`, `*.csproj`
- **Lock files**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `poetry.lock`
- **Runtime configs**: `.node-version`, `.nvmrc`, `.python-version`, `.ruby-version`, `.tool-versions`
- **Build configs**: `tsconfig.json`, `webpack.config.*`, `vite.config.*`, `esbuild.*`, `rollup.config.*`, `tsup.config.*`
- **Container configs**: `Dockerfile`, `docker-compose.yml`, `.dockerignore`

**Budget:** the root/parent manifest + up to 6 config files, 2 searches, 40 results each. Lock files are never read — confirm existence with `ls` to name the package manager, and grep one line if a pinned version matters.

Write findings to `<CODEBASE_DIR>/stack.md` following the reference template: [references/stack-reference.md](references/stack-reference.md)

### Step 2: Map the Structure

Analyze the project's directory layout and understand how code is organized:

- List the top-level directories and their purpose
- Identify the entry point(s)
- Map path aliases (e.g., `~/` → `src/`, `@/` → `src/`)
- Identify how separable units are declared if applicable (workspaces, packages, Maven/Gradle modules) — the unit-by-unit map belongs to `OVERVIEW.md` (Step 8), not here
- Note any code generation or scaffolding patterns

**Budget:** the Step 0.5 inventory + up to 4 files (entry-point manifest fields, alias config), 2 searches, 40 results each. Do not re-list the tree — the inventory already carries the top-level layout and the declared units.

Write findings to `<CODEBASE_DIR>/structure.md` following the reference template: [references/structure-reference.md](references/structure-reference.md)

### Step 3: Discover the Architecture

Research the architectural patterns in use:

- **Pattern identification**: Layered, hexagonal, clean architecture, MVC, CQRS, event-driven, microservices, monolith
- **Component boundaries**: How are domains/modules/features separated?
- **Data flow**: How does data move through the system? (request → controller → service → repository → database)
- **State management**: How is application state handled? (Redux, Zustand, Context, Vuex, MobX, signals)
- **API style**: REST, GraphQL, gRPC, tRPC, WebSocket

Look for these clues:
- Folder structure (e.g., `domains/`, `modules/`, `features/`, `layers/`)
- Base classes or interfaces that define contracts
- Dependency injection patterns
- Middleware chains or pipelines

**Budget:** up to 8 source files — **one representative per detected layer**, never N implementations of the same layer — plus 6 searches, 30 results each. The pattern is read off the shape of the folders and the base classes a capped search reveals, not off the bodies of the implementations. Tracing one real request end-to-end beats sampling twenty files. The complete unit-by-unit map belongs to `OVERVIEW.md` (Step 8) — never restate it here.

Write findings to `<CODEBASE_DIR>/architecture.md` following the reference template: [references/architecture-reference.md](references/architecture-reference.md)

### Step 4: Map Conventions

Identify the coding conventions enforced or adopted by the project:

- **Linting & formatting**: ESLint rules, Prettier config, Biome, EditorConfig
- **Naming patterns**: File naming (kebab-case, camelCase, PascalCase), variable naming, function naming
- **File organization**: Where do tests go? Where do types go? Co-location vs centralized?
- **Import patterns**: Absolute vs relative, barrel files (index.ts), path aliases
- **Commit conventions**: Conventional commits, branch naming, PR templates
- **Code style**: Functional vs OOP, immutability preferences, error handling patterns

**Budget:** up to 10 source files spread across layers + 6 config files, 3 searches, 30 results each. `git log --oneline -20` for the commit convention. The 5–10 file range in the template is a ceiling, not a target — naming and import conventions are claims about what predominates, which a handful of files across layers already settles.

Write findings to `<CODEBASE_DIR>/conventions.md` following the reference template: [references/conventions-reference.md](references/conventions-reference.md)

### Step 5: Catalog Integrations

Map all external dependencies and integrations:

- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, SQLite, DynamoDB
- **External APIs**: Third-party services, payment gateways, auth providers (OAuth, SAML)
- **Message brokers**: RabbitMQ, Kafka, SQS, Redis Pub/Sub
- **Cloud services**: AWS, Azure, GCP services in use
- **Monitoring & observability**: Sentry, Datadog, New Relic, Prometheus, Grafana
- **CI/CD**: GitHub Actions, GitLab CI, Azure DevOps, Jenkins
- **Infrastructure as code**: Terraform, Pulumi, CloudFormation

Look for:
- **Declared dependencies** in the manifests the inventory listed — this is the primary source for which SDKs and clients exist
- Environment variables (`.env.example`, `.env.sample`)
- Configuration files for external services
- Docker compose services

**Budget:** `.env.example` + `docker-compose.yml` + up to 4 CI/IaC files, 10 files total, 6 searches, 30 results each. The SDK inventory comes from **declared dependencies**, not from a repo-wide import sweep. When you must confirm a declared package is actually wired up, use **one** alternation over the package names (`rg -l --max-count 1 -e '<pkg-a>' -e '<pkg-b>' | head -30`) — never one search per package.

Write findings to `<CODEBASE_DIR>/integrations.md` following the reference template: [references/integrations-reference.md](references/integrations-reference.md)

### Step 6: Identify Concerns

Map cross-cutting concerns — aspects that affect the entire application rather than a single module:

- **Authentication & authorization**: How are users authenticated? Role-based access? Token management?
- **Logging**: Structured logging? Log levels? Where do logs go?
- **Error handling**: Global error handlers, error response formats, custom error classes
- **Validation**: Input validation approach (Zod, Joi, class-validator, custom)
- **Caching**: Cache strategies, cache invalidation, where caching is applied
- **Internationalization (i18n)**: Multi-language support, translation approach
- **Security**: CORS, CSP, rate limiting, input sanitization, HTTPS enforcement
- **Performance**: Lazy loading, code splitting, pagination strategies

**Budget:** up to 6 files — at most **one per category** — 10 files total, 6 searches (one per category), 30 results each. Declared dependencies already name the auth, validation, logging and security libraries before any code is read. A category with no hit in its one search is **omitted** from the output; proving an absence costs more than it is worth, and the template's omit-empty-sections rule already covers it.

Write findings to `<CODEBASE_DIR>/concerns.md` following the reference template: [references/concerns-reference.md](references/concerns-reference.md)

### Step 7: Map Testing

Research the testing approach and infrastructure:

- **Test framework**: Jest, Vitest, Mocha, pytest, RSpec, xUnit, JUnit
- **Test location**: Co-located (`*.spec.ts` next to source) vs centralized (`tests/` folder)
- **Naming conventions**: `*.test.ts`, `*.spec.ts`, `*_test.go`, `test_*.py`
- **Mocking approach**: Jest mocks, msw, nock, factory patterns, fixtures
- **Coverage tools**: Istanbul/nyc, c8, coverage.py, SimpleCov
- **E2E tools**: Cypress, Playwright, Selenium, Detox

**Three tables are the mandatory output of this step** — without them the file describes the tooling and leaves the operational question unanswered, and whoever develops here rebuilds them by asking the user:

- **Matriz de cobertura** — one row per layer: path, the type of test the layer requires, and the command. Derive the rows from **every layer the Step 0.5 inventory and the manifest name**, not from the test folder — the matrix covers the whole project, **not only the ones that have tests**. A layer with no test is marked as such, never omitted; a repo with no test at all is a finding, and the section is written anyway.
- **Avaliação de paralelismo** — one row per layer: isolation model, safe or not, and the evidence on the same line. Both markings need their evidence; what the read cap did not settle is marked as undetermined, never as safe.
- **Comandos de gate** — the three levels (rápido, completo, build), each with its command and when it runs. **Never invent a command**: it comes from the manifest, the test config or the CI file, or **the cell stays empty**. A level with no declared script keeps the empty cell instead of borrowing the level above.

If the established content exceeds this file's declared ceiling, **reduce the file before writing it**: **the three tables survive**, and the descriptive prose around them is what gets cut.

**Budget:** the test config + the manifest's test scripts + **2–3** test files, 7 files total, 3 searches, 30 results each. Never enumerate the suite: the test count, location and naming convention all come from the Step 0.5 inventory; only the mocking/fixture style needs a file opened.

Write findings to `<CODEBASE_DIR>/testing.md` following the reference template: [references/testing-reference.md](references/testing-reference.md)

### Step 7.5: Map Risks

Steps 1–7 answer how the repo is built. None of them answers **what is risky to touch** — the question every agent has before it changes anything. Map it:

- **Débito técnico**: `TODO`, `FIXME`, `HACK`, `XXX`, deprecation markers and legacy folders — the debt the team already named
- **Bugs conhecidos**: skipped, disabled or quarantined tests; bugs recorded in an in-tree `CHANGELOG` and never closed
- **Falhas de segurança**: advisories declared in-tree, permissive configuration, dependencies pinned behind a known CVE
- **Gargalos medidos**: the operation with a measured number — from a benchmark script, a load-test config or an APM dashboard that already exists in the repo
- **Limites de escala**: what saturates, with the unit and the load at which it was measured
- **Dependências em risco**: unmaintained packages, majors behind, advisories — read from the manifests Step 1 already opened
- **Lacunas de cobertura de teste**: the coverage config's exclusions and the suites the CI does not run — both already on disk from Step 7
- **Áreas frágeis**: the named list, **one file path per line**, each with the number that makes the fragility checkable

**This step runs in every pass, like the seven before it.** A risk register that exists only when somebody asks for it cannot tell a reader "no risk here" from "nobody looked" — which is the reason the file exists.

Two rules decide what goes in, and both are refusals: **no item without a concrete file path**, and **no performance or scale claim without a number**. An unmeasured bottleneck leaves the file entirely — it never becomes a "não medido" label. A section with no finding is omitted; the **file** is written regardless, and when nothing was found it carries the one line that says the pass searched and found nothing.

Fragility is named **file by file**. "The persistence layer is fragile" is an impression, and an impression in a risk register is worse than a silence, because the reader acts on it.

**Budget:** 8 files total, 6 searches, 30 results each. Those 8 are **this step's own reads**. It fans out in the same wave as Steps 1 and 7 and a worker never receives another worker's output ([delegation-contract.md](references/delegation-contract.md)), so the manifests and the coverage/CI config are files **this** worker opens — budget them here (≈4) and spend the rest on the hits. Nothing arrives already read. Never open a file to confirm a hit: the hit and its path are the evidence.

Write findings to `<CODEBASE_DIR>/risks.md` following the reference template: [references/risks-reference.md](references/risks-reference.md)

### Step 8: Write the Repo Overview

Steps 1–7.5 answer *how this repo is built*. None of them answers *what it is for* — and that is the first thing any agent (or human) needs. Write `<CODEBASE_DIR>/OVERVIEW.md`, the entry point of the repo's context:

- **Papel no ecossistema** — one business-oriented paragraph: what problem this repo solves, for whom, where it sits in the product flow.
- **Apelidos e status** — internal nicknames (`v3`, `FLEX`, `painel`), lifecycle status (ativo / legado / em migração) and what it replaces or is replaced by. This is how the team actually refers to the system; without it an agent cannot map a request to a repo.
- **Consome / é consumido por** — relations with the other repos in the `DONINHA.md` index and with external parties. Evidence: base URLs, generated clients, shared topic/queue names, file-drop conventions.
- **Mapa de módulos** — one row per separable unit: name, path, one-line role, and a link to its module doc (`—` when none exists yet). Group cohesive shared libraries into a single row.
- **Contexto detalhado** — links to the eight files from Steps 1–7.5.
- **Divergências** — the `⚠` and `+` marks accumulated during reconciliation. Omit the section when there is no reference doc or nothing diverged.

The module map is **always** produced — it is cheap (the Step 0.5 inventory's declared units and top-level directories, plus the reference doc) and it is what makes Step 9 incremental. Group cohesive shared libraries into a single row; past **40 rows**, grouping stops being optional.

The map is also the **only** source of the module sub-bullets Step 10 writes into the `DONINHA.md` entry — one more reason it is never skipped, and the reason its grouping is inherited there instead of re-decided.

Business meaning at **repo** scale only; per-module capabilities go to Step 9. Never restate stack/architecture detail here — link to the file that owns it.

**Budget:** zero new code reads. The sources for this step are the Step 0.5 inventory, the eight files this pass just wrote, the repo's `README.md` (first 200 lines) and the reference-doc sections already read in Step 0. If you find yourself opening a source file here, the business role is not in the code — say so explicitly instead, as [overview-reference.md](references/overview-reference.md) requires.

Follow the reference template: [references/overview-reference.md](references/overview-reference.md)

### Step 9: Write Module Docs (conditional)

**Trigger:** the repo has **≥ 4 separable units with their own boundary** — a Maven/Gradle module, a workspace package, an app, a feature folder with its own entry point. Below that threshold, `modules/` is **not** created and the capability map stays inline in the `OVERVIEW.md` module map's role column.

For each qualifying module, write `<CODEBASE_DIR>/modules/<slug>.md` (`<slug>` = the module's directory name, kebab-cased) describing its **business capabilities grouped by business area** — what the module does, never its call surface. Follow the reference template and its depth rule: [references/module-reference.md](references/module-reference.md)

Rules:

- **The map is the mandatory deliverable; the module docs are incremental.** One pass produces `OVERVIEW.md` with the **complete** map and at most **8** `modules/<slug>.md` files. A row whose `Doc` column is `—` means *not researched yet*; when a later pass researches that module, fill the link. Every consumer already treats `—` that way and is told not to fail on it, so a repo with 32 modules legitimately ends pass 1 with 24 `—` rows.
- **Batch selection**, in this order: modules the user named → modules with the largest code mass per the inventory → modules the reference docs single out. Shared libraries and thin wrappers never enter the batch.
- **Depth is capability-level.** `Aprova contratos em lote.` — not `POST /contratos/aprovacao-massiva`, not a controller/class inventory. Named scheduler lists, consumer/topic tables and step-by-step pipelines belong to `integrations.md` / `architecture.md`, which already own that detail.
- **Skip trivial modules.** A shared utility library or thin wrapper gets one row in the `OVERVIEW.md` map and no file. A cohesive family of libraries may share a single doc (e.g. `core` + `core-messages` + `common-data` + `common-session` → one file, one row). Record each skip **with its reason** in `.research-state.md`, or a later pass re-researches what was deliberately discarded.
- **Budget per module:** at most **8 source files** opened, 12 files total, 4 searches, 25 results each. The business areas come from the **names** in a path listing, not from the contents — see [module-reference.md](references/module-reference.md). A module with 41 controllers is one listing plus up to 8 reads, never 41 reads.
- **Sub-agent delegation.** One sub-agent per module in the batch, at most **4 concurrently**, each receiving the payload defined in [delegation-contract.md](references/delegation-contract.md) — the module's name/slug/path, the ≤ 10 candidate paths from the inventory, [module-reference.md](references/module-reference.md), its output path, its caps **inlined**, and the reference-doc slice about that module. It returns **only** the path written plus one ≤ 20-word line of role for the map. Without a sub-agent mechanism, run inline one module at a time with a batch of **4**, discarding each module's working context after its file is written.
- **Each module doc's ceiling is checked as its sub-agent returns**, at the same point `.research-state.md` is already updated for that module. The return carries the file's **word count** (see [delegation-contract.md](references/delegation-contract.md)), so the orchestrator compares it against the per-module `Size limit` without opening the file, and hands the module back to be reduced when it is over. Checking only at the end of the batch would lose the module that blew its ceiling first.
- The **orchestrator** still owns `OVERVIEW.md` (Step 8) and the `DONINHA.md` index (Step 10) — neither happens for free because module files appeared.
- `<CODEBASE_DIR>/modules/` is repo context. It has nothing to do with `DONINHA_ROOT/docs/modules/`, the workspace-level modules/features of the Doninha pipeline. Never write one into the other.

### Step 10: DONINHA.md — index + config only (no project synthesis)

**Do not write project synthesis into `DONINHA.md`.** The `.doninha/docs/codebase/*` files produced in Steps 1–9 are the single source of project/repo information (business role, modules, stack, architecture, conventions, etc.). `DONINHA.md` is workspace-level and holds only:

- **Configuration/policies** — e.g. the `analise.aprovador` and `research.referencias` YAML frontmatter and any manual team overrides. Leave these untouched unless the user asks to change them (Step 0 may add `research.referencias`).
- **The managed repos index** — the section between `<!-- doninha:repos:start -->` … `<!-- doninha:repos:end -->` (multi-repo only; see below).

This holds in **both** layouts: a single-repo/legacy workspace `DONINHA.md` is also index + config only — no "What is X", "Tech Stack", "Architecture", "Code Rules", "Design System", or "Key Patterns" sections. Readers (`doninha-desenvolver`, `doninha-backend`, `doninha-frontend`, `doninha-reviewer-*`, `doninha-ux`, `doninha-analisar`) get project detail from `<CODEBASE_DIR>` — starting at `OVERVIEW.md` — and read `DONINHA.md` only for policies/config and to find out which repos exist.

In a multi-repo workspace, update the repo's entry inside `DONINHA.md`'s managed index section — from [Step A](#step-a-index-mode) in index mode, or right after finishing full research for `repos/<name>/`. The entry is the routing layer: **business role first, then stack**, a pointer to the repo's `OVERVIEW.md` when one exists, and — after full research — the repo's module map as sub-bullets, so the router routes all the way to the module:

```
- **<name>** — `repos/<name>` — <papel de negócio em uma frase> — <stack curto>
  → docs: `repos/<name>/.doninha/docs/codebase/OVERVIEW.md` (<N> módulos)
  - <módulo> — `<caminho>` — <papel em uma linha>
```

Concretely:

```
- **csg-mxt-backend** — `repos/csg-mxt-backend` — Backend v3 do Consignet (crédito consignado): contratos, margem, folha, integrações banco/RH — Java 21/Spring Boot 3.5, Oracle, Kafka, Keycloak
  → docs: `repos/csg-mxt-backend/.doninha/docs/codebase/OVERVIEW.md` (32 módulos)
  - contrato — `contrato/` — Núcleo de negócio: contratos, margem, folha
  - admin — `admin/` — Configuração, convênios, empresas, conteúdo
  - agendador-processos — `agendador-processos/` — Agendamento de processos internos
  - core, core-messages, common-data, common-session — `core/`, … — Bibliotecas compartilhadas
```

Rules for the index:
- **Source of the entry, cheapest first:** the repo's `OVERVIEW.md` and `stack.md` when they exist (free — already written and capped); otherwise the [Step A](#step-a-index-mode) root-level probe. **An index entry never requires researching the repo.** Requiring `OVERVIEW.md` here would make the router cost a full survey per repo, which is exactly the trap this skill must not fall into.
- Cap the entry line at ~250 characters — it is a router, not a summary. Everything that does not fit belongs in `OVERVIEW.md`.
- Keep the `- **<name>** — \`repos/<name>\` — …` shape intact so the index stays parseable — only the trailing text changes. The `→ docs:` line is an indented continuation and is optional: omit it for a repo with no `<CODEBASE_DIR>` yet, and omit the module count when the repo has no `modules/`.

Rules for the module sub-bullets:
- **Source: the `Mapa de módulos` of the repo's `OVERVIEW.md`, copied verbatim** — the `Módulo`, `Caminho` and `Papel` columns, in the map's own order and with the map's own grouping. The `Doc` column stays out: the index routes, and the link to a module doc is reached through `OVERVIEW.md`. **Zero new reads, zero new derivation** — if you are deciding anything here, you are doing Step 8's job twice.
- **Only full research writes them.** [Step A](#step-a-index-mode) never does: it does not enter the tree, it stays at 3 root files per repo, and it has no module map to copy. An index-mode pass leaves existing sub-bullets exactly as they are.
- Write the block when the map has **≥ 2 rows**; omit it for a repo with no separable units (its role already says everything the router needs).
- **A sub-bullet never carries the module name in bold, and never a `repos/…` path in backticks.** the index parser matches ``- **<name>** — `repos/<name>` `` to find a repo entry; a sub-bullet shaped like that would be parsed as a phantom repo and dropped on the next `doninha init`. The form above (indented, no bold, a repo-relative path) falls into the continuation branch and is preserved verbatim.
- Each sub-bullet ≤ 120 characters; the ~250-character cap applies to the entry line, not to the block.
- Only touch the target repo's entry; never rewrite other repos' entries or any content outside the managed markers.
- If the managed section or the repo's entry is missing, add it rather than failing (keep it consistent with the seeded format).
- In a single-repo/legacy workspace `repos/` holds no repository sub-directory and there is no index to update — leave `DONINHA.md` as-is.

**This index update is REQUIRED, not optional — neither mode is "done" until it lands.** It is the entire reason the multi-repo index exists; skipping it leaves the workspace entry point (`DONINHA.md`) describing the repo as `descrição pendente`. Two failure modes to avoid explicitly:

- **Sub-agent orchestration:** when Steps 1–9 are delegated to research sub-agents, they write `<CODEBASE_DIR>` but the **orchestrator** must still perform this `DONINHA.md` index update after they return — it does not happen for free just because the `codebase/*` files exist.
- **Index mode over several repos:** write every repo in scope's entry before finishing. The whole point of the mode is that the router ends up complete in one pass.

**Completion check before ending the skill:**
- Index mode: no `descrição pendente` placeholder remains for any repo **in scope**.
- Full research: `<CODEBASE_DIR>/OVERVIEW.md` exists with a populated module map, and the repo's index entry shows a real role + stack, its `→ docs:` line, and its module sub-bullets whenever that map has ≥ 2 rows.
- Sweep: the two checks above hold for **every repo already closed**, and the repos still pending are named to the user.

### Step 11: Record the pass state

Write `<CODEBASE_DIR>/.research-state.md`, seeded from [assets/research-state-template.md](assets/research-state-template.md). It lives inside `.doninha/`, already covered by the `.gitignore` entry ensured during target resolution. The dot prefix keeps it out of any reader's file set: it is this skill's own working state, never context for a consumer, and no downstream reader depends on it.

Record: the repo and the pass's commit — the one Step 0.4 already captured, never re-derived here; the Step 0.5 inventory; which output files completed; the module batch done, the ones still pending, and the ones skipped **with their reason**; reference-doc claims left over the 20-claim budget; whether the `DONINHA.md` index update landed; and any cap that was hit.

**Update it after each module returns**, not once at the end of the batch — a session that dies must lose at most one module's work.

`index_updated: false` makes the two failure modes above machine-checkable instead of merely written down: **the pass is not done while that field is `false`.**

#### Resume and freshness

Read this file **first** when it exists. State in one line what is fresh, what is pending and which modules remain, then **run Step 0.4** and jump straight to the first step with pending work. Never replay a completed step to "warm up", never re-ask which repo, never repeat the inventory.

Step 0.4 is the one exception, and it is not a replay: the inventory is reused from this file, the trace is captured anew. Skipping it is how a resumed pass stamps last pass's date on the files it writes today — the two values cost one `git` command and are worth nothing cached.

An output is **fresh** when the file exists, is non-empty, carries the sections of the current version, and `.research-state.md` lists it as done for the current `commit`. Fresh outputs are skipped **without being read** — do not open a file to decide whether to keep it.

**The header trace and freshness are two different things.** Each file carries the date and the commit of the pass **that wrote it**: a pass resumed on another day, or over another `HEAD`, stamps its own trace on the files it writes now and never rewrites the header of a file that was already done.

**One exception, and it is the only one: [the offer](#the-offer) accepted.** A `desatualizado` file completed by this pass **was written by this pass too**, in the sections it just filled — so it takes this pass's trace, like any other file this pass wrote. It is not a counter-example to the rule above: a file needing a section is precisely a file that was *not* already done. Nothing else rewrites a header — not a resume, not a refresh of a neighbouring file, not a re-run of a step whose output is fresh. That is what makes the trace honest in a repo researched across three passes. And the trace never decides freshness — the authority is this file. Reading every header to decide what to keep would cost exactly the economy this section exists to protect, and a file recorded as `adopted` keeps no trace at all: the absence is the sign of where it came from.

##### Detecting `desatualizado` — two layers, N searches, zero reads

**Each probe is one self-contained block**, and each one repeats the four preamble lines. That repetition is the point: **shell state does not survive between tool invocations** — every Bash call is a fresh shell, so a `DIR` or a search command assigned in an earlier block expands to nothing in a later one, and a probe whose search command vanished runs `'^analisado_em:' *.md`, exits 127, and reports its answer from an *absence* that is really a broken command. The preamble is also plain POSIX `sh`: a shell **function**, never an array, because `SEARCH=(…)` is bash-only syntax and fails outright under `sh`/`dash` — the same portability rung as the missing-`rg` case below.

```sh
DIR=<CODEBASE_DIR>
[ -n "$DIR" ] && [ -d "$DIR" ] || { echo 'CODEBASE_DIR não resolvido — a detecção não roda'; exit 1; }
search() { if command -v rg >/dev/null 2>&1; then rg -l --max-count 1 "$@"; else grep -l -m 1 "$@"; fi; }
```

Three things that are not ceremony. `$DIR` resolved to empty turns `"$DIR"/*.md` into `/*.md` and the probe walks the root of the filesystem. `rg` is **not** on every host — `code-analysis.md` documents the ladder for exactly that reason — and a missing command returns empty output, which in this section means `desatualizado` for the whole set. And the path is quoted, so a directory with a space stays one argument.

**Layer 1 — the trace.** One search answers it for the whole set: a file **without** the Step 0.4 header trace was written by an earlier version of this skill.

```sh
DIR=<CODEBASE_DIR>
[ -n "$DIR" ] && [ -d "$DIR" ] || { echo 'CODEBASE_DIR não resolvido — a detecção não roda'; exit 1; }
search() { if command -v rg >/dev/null 2>&1; then rg -l --max-count 1 "$@"; else grep -l -m 1 "$@"; fi; }

set -- "$DIR"/*.md
[ -e "$1" ] || { echo 'nenhum .md em CODEBASE_DIR — o conjunto é `ausente`, e ausente não se classifica aqui'; exit 0; }

traced=$(search '^analisado_em:' "$@"); status=$?
[ "$status" -le 1 ] || { echo "a busca falhou (exit $status) — nenhum arquivo é classificado"; exit "$status"; }
printf '%s\n' "$traced" | head -30
```

**An empty directory is `ausente`, and `ausente` is not this section's question.** An unexpanded `"$DIR"/*.md` reaches the search as the literal glob, which is a path that does not exist, which is exit **2** — and the guard below would read that as "the check did not run" and abort the whole classification. `set --` plus `[ -e "$1" ]` settles it before the search, in the one shape POSIX `sh` has for it.

**Exit 1 is "no match"; anything above it is "the check did not run".** The distinction is the whole safety of this layer: under the rule below, a failed command does not report "no trace found" — it reports the entire set as `desatualizado`, with nothing to say it lied.

The files that search does **not** list are `desatualizado` — **except the ones `.research-state.md` records as `adopted`**. That file is the freshness authority, as [Resume and freshness](#resume-and-freshness) states, and an `adopted` file keeps no trace **by construction**: reclassifying it here would flag every file of every repo researched before the trace existed, on every single invocation — the mass false positive this three-state vocabulary exists to prevent. An `adopted` file stays *fresh*, and the verification it never had is the refresh this skill already offers on request. With no `.research-state.md` on disk there is nothing to except, and the missing trace is the verdict. This is the layer that separates "earlier version" from "section legitimately omitted".

**Layer 2 — sections that never legitimately go missing.** Applied **only to files that do carry the trace**: on a file without one the answer is already known, and every extra search there is waste. The list is deliberately short — it holds a section only when a template forbids its absence outright:

| File | Section | Why its absence is never legitimate |
|---|---|---|
| `testing.md` | `## Matriz de cobertura` | every layer of the project gets a row, and a layer without tests has to appear **marked**, never omitted |

```sh
DIR=<CODEBASE_DIR>
[ -n "$DIR" ] && [ -d "$DIR" ] || { echo 'CODEBASE_DIR não resolvido — a detecção não roda'; exit 1; }
search() { if command -v rg >/dev/null 2>&1; then rg -l --max-count 1 "$@"; else grep -l -m 1 "$@"; fi; }

[ -f "$DIR/testing.md" ] || { echo 'testing.md ausente — é GAP, e a camada 2 não se aplica'; exit 0; }

covered=$(search '^## Matriz de cobertura' "$DIR/testing.md"); status=$?
[ "$status" -le 1 ] || { echo "a busca falhou (exit $status) — testing.md não é classificado"; exit "$status"; }
printf '%s\n' "$covered" | head -30
```

**The file has to exist before it can be searched, and its absence is an answer, not a failure.** Both `grep` and `rg` exit **2** on a path that does not exist, and the guard treats anything above 1 as "the check did not run" — so without the `[ -f … ]` line a repo with **no** `testing.md` aborts the classification of the whole set, which is precisely the `ausente`/GAP case this three-state vocabulary was written to report. Every file this layer ever grows a row for takes the same guard: missing is `ausente`, and `ausente` is settled in [GAP Detection](#gap-detection), never here.

**An absent optional section is not a signal.** Rule 3 of every template orders a section with no finding to be omitted — a `## Guia de mudança` with no entry, a pitfall block with no pitfall, a `risks.md` section with no finding. Treating that omission as staleness would flag practically every correct file: a false positive across the whole set is worse than no check at all, because it teaches the reader to dismiss the report.

**The cost is N capped searches, never N reads.** Every probe above is `rg -l --max-count 1 … | head -30` — or its `grep` rung when `rg` is absent — the capped form [code-analysis.md](references/code-analysis.md) already requires. No file is opened to decide its state: the hit, or its absence, is the evidence. One read per file would spend exactly the economy this section protects.

**When the short list is all there is, say so.** If layer 2 has nothing to check beyond the row above, or layer 1 finds no trace anywhere so nothing reaches layer 2, the check ran nearly empty — report it in those words, naming what went unverified. Never report the set as fresh for want of a criterion: silence here reads as "everything is up to date", and that is the one output failure a reader cannot detect.

**No `.research-state.md` but output files already on disk** — the normal state of a repo researched before this file existed. Do **not** re-derive them: record each one in a new `.research-state.md` as `adopted` at the current `HEAD`, and research only what is actually missing. Then tell the user which files were adopted without verification and that a refresh of any of them is available on request. Adopting a file of unknown provenance is cheap and reversible; re-deriving eight files somebody already has is the whole waste this skill exists to avoid.

When the recorded `commit` differs from the current `HEAD`, do **not** invalidate everything. Run one capped diff and re-run only the outputs whose recorded evidence paths it touches:

```bash
git -C <REPO_ROOT> diff --name-only <recorded-commit>..HEAD | head -200
```

Everything else stays fresh. If the diff exceeds 200 lines, treat the whole pass as stale and start fresh. That turns a refresh on a large monolith from re-researching everything into one diff.

**Ending a pass with work left is a normal outcome.** Close by telling the user what landed, what is pending (the module list from this file), and that running the skill again continues from here.

##### The offer

A `desatualizado` file is **reported, then offered** — this skill **never rewrites a file on its own**. Forcing regeneration discards work that is still valid, which is the whole reason the decision went this way.

**Where the offer happens: when this skill is invoked**, never in [GAP Detection](#gap-detection). That detection runs ahead of any Doninha workflow, for consumers that only want context; an offer there interrupts another agent's work to ask a question nobody in that flow can answer. There it reports the three states and stops.

**Say what is out of date and why, before asking.** One line per file, with the reason the detection actually found — `no trace` (written by an earlier version) or the mandatory section that is missing. A bare "quer completar?" hands the user a decision they have no basis to make.

Then ask, in the form [Choosing the mode](#choosing-the-mode) already uses — numbered options, PT-BR, **asked at most once per invocation**:

> 1. **Completar** — deriva as seções ausentes e as insere, preservando o resto do arquivo
> 2. **Deixar como está** — nada é gravado

**Accepted → only the missing sections are derived and inserted**, preserving the existing content. The step runs scoped to the section that is missing, not to the whole file — cheaper than a full pass and non-destructive by construction. The file's trace is then updated to the completing pass — the one exception [Resume and freshness](#resume-and-freshness) names, because this pass did write part of this file and the file is recorded in `.research-state.md` `completed`, with the sections that were filled; without that record the file carries content from two passes and nothing says which is which.

**Declined → nothing changes: no write, no reorder, no field updated.** Not the file, not its ordering, not `.research-state.md` — with one exception, the record that the offer was made and declined, so the next pass does not ask again inside the same invocation.

**A full rewrite stays available as an explicit request** — the `refresh` this skill already supports. Option 1 is what completing does *by default*; it never removed the ability to re-run a step from scratch when the user asks for exactly that.

## Research Techniques

When investigating a codebase, use these approaches:

1. **Start with the inventory**: Step 0.5 already answers the directory shape, the extension mix and the declared units. Reach for it before any glob.
2. **Then manifests**: package files reveal the stack faster than reading code — and the parent manifest reveals the unit list without touching a unit.
3. **Read configs before code**: build/lint/test configs reveal patterns and conventions with no code read at all.
4. **Search for patterns, capped**: grep for import patterns, decorators and base classes — one alternation covering every name you care about, `-l`/`--max-count`, piped through `head`. Names beat bodies.
5. **Follow one entry point**: trace a single real request end-to-end to understand data flow. One trace beats sampling twenty files.
6. **Check CI/CD pipelines**: they reveal build steps, test commands, and deployment targets.
7. **Read existing documentation**: README, CONTRIBUTING, wiki, ADRs (Architecture Decision Records).
8. **Inspect environment variables**: `.env.example` reveals external dependencies.
9. **Reconcile, don't discard**: the team's own reference docs carry business intent no manifest can state — verify by claim *shape* against the code and mark it, instead of ignoring or copying it.

## Output Quality Rules

- Every claim must be backed by evidence found in the codebase (file paths, configurations, code patterns).
- If something is ambiguous or cannot be determined, state it explicitly rather than guessing.
- Use relative paths from the project root when referencing files.
- Keep each codebase file focused on its domain — avoid duplicating information across files.
- `risks.md` records **that** a file is fragile; a `## Guia de mudança` entry records **what to check** when someone touches it. The same file appearing in both is expected — never the same sentence.
- The `## Guia de mudança` belongs to the six files whose subject is edited daily and whose consequence is the file's own: `architecture.md`, `conventions.md`, `structure.md`, `integrations.md`, `concerns.md` and `modules/<slug>.md`. `stack.md` and `testing.md` deliberately do **not** carry it: a stack consequence is rare and already lives in `structure.md` (generated artifacts) or in the CI, and `testing.md`'s coverage matrix already answers "what to test" per layer, systematically — a guide there would be that same table under a different header. `OVERVIEW.md` is a business entry with a zero-new-reads budget, and `risks.md` is a risk record, not an action guide. **The absence in those four is a decision, not an omission** — do not add the section to them.
- Use consistent markdown formatting across all generated files.
- Business meaning belongs to `OVERVIEW.md` (repo scale) and `modules/*.md` (module scale); the other eight files stay technical.
- Keep the project's domain vocabulary exactly as the code and the team use it — never translate domain terms.
- Claims taken from a reference doc and not confirmed in the code are `⚠` entries in `OVERVIEW.md`'s `## Divergências`, never ordinary content.
- **Say what you did not cover.** A pass that stopped at a cap, batched only part of the modules, or left claims unverified must state that — in `.research-state.md` and to the user. Silent truncation reads as "fully mapped" when it is not, and that is the one output failure a reader cannot detect.
- **Respect each template's `Size limit` — it is a verification, not a request.** Dimension the content against the ceiling before writing and cut until it fits, so the file never reaches disk at its original size; a file over its limit is not more thorough, it is a file the readers will stop reading. The check and the unit it compares are in [Size verification](#size-verification--the-unit-is-the-whole-rule). When a file is over its ceiling, **cut descriptive prose before cutting a `## Guia de mudança` entry** — the description restates what the code still shows, the guide is what a reader acts on at the moment of the edit. What **never comes out**: the header trace and the pitfall block — the top of the file, ~20 and ~60 tokens, so removing them buys nothing and blinds the reader — and `testing.md`'s coverage matrix, which exists to show the layer **without** tests, so dropping a row inverts the signal it carries. The ceiling is **never raised to fit the guide**; the guide displaces description.

## References

Detailed templates and field descriptions for each codebase file:

- [references/overview-reference.md](references/overview-reference.md) — How to document the repo's business role and module map
- [references/module-reference.md](references/module-reference.md) — How to document a module's business capabilities
- [references/reference-docs-reconciliation.md](references/reference-docs-reconciliation.md) — How to consume and verify the team's own reference docs
- [references/stack-reference.md](references/stack-reference.md) — How to document the technology stack
- [references/structure-reference.md](references/structure-reference.md) — How to document project structure
- [references/architecture-reference.md](references/architecture-reference.md) — How to document architecture
- [references/conventions-reference.md](references/conventions-reference.md) — How to document conventions
- [references/integrations-reference.md](references/integrations-reference.md) — How to document integrations
- [references/concerns-reference.md](references/concerns-reference.md) — How to document cross-cutting concerns
- [references/testing-reference.md](references/testing-reference.md) — How to document testing
- [references/risks-reference.md](references/risks-reference.md) — How to document known risk: debt, bugs, security holes, measured bottlenecks and fragile areas
- [references/code-analysis.md](references/code-analysis.md) — Search tooling, the escalation ladder, and the search caps the context budget requires
- [references/context-budget.md](references/context-budget.md) — The input rules and where the ceiling sits in delegated vs inline mode
- [references/delegation-contract.md](references/delegation-contract.md) — What a sub-agent receives, what it returns, and when to run inline instead
- [assets/research-state-template.md](assets/research-state-template.md) — The pass-state file that makes a research pass resumable
