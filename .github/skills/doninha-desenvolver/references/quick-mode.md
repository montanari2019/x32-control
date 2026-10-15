# Quick Mode

**Goal:** Execute small, ad-hoc tasks within a PBI with the same quality principles but without full spec+tasks ceremony.

**Trigger:** "Quick fix", "Quick task", "Small change", "Bug fix", "Just do X"

## When to Use

| Use quick mode             | Use full pipeline                   |
| -------------------------- | ------------------------------------ |
| Bug fixes with known cause | New features with multiple stories  |
| Config changes             | Architectural changes               |
| Small UI tweaks            | Features requiring design decisions |
| Adding a field/column      | Multi-component features            |
| One-off scripts            | Anything with unclear scope         |
| Dependency updates         | Features requiring user stories     |

**Rule of thumb:** If you can describe it in one sentence AND it touches ≤3 files, it's a quick task.

## Process

### 1. Describe the Task

User provides a clear, one-sentence description. If vague, ask for specifics:

- ❌ "Fix the login" → Ask: "What's broken? What should happen instead?"
- ✅ "Fix: login button returns 401 because token refresh skips expired check"

### 2. Pre-Implementation Check

Before writing code, state:

```
Quick Task: [description]
Files: [list ONLY files to touch]
Approach: [one sentence]
Verify: [how to prove it works]
```

Get user approval before proceeding. If the pre-implementation check reveals the task is bigger than expected (>3 files, unclear dependencies, design decisions needed), recommend the full pipeline instead.

### 3. Implement

Follow the project's coding practices:

- Simplest code that works
- Touch ONLY listed files
- No scope creep — fix the thing, nothing else

### 4. Verify

Run verification from step 2. Mark done only after verification passes.

### 4b. Scoped Quality Gate (MANDATORY)

Quick mode drops ceremony, not the quality bar — and it is not a way around the quality gate.
Before the commit in step 5, run the same scoped gate the full loop runs: invoke
`doninha-quality-gate` at scope `per-task` with the ≤3 changed files, per
[quality-gate.md](quality-gate.md).

- Unresolved finding → fix, re-run, do not commit.
- Tool unavailable → SKIP with its reason, continue (degradation cascade in `quality-gate.md`).
- Gate off in `.doninha/integrations/quality-gate.yml` (complexity, Sonar) → DISABLED, not run, reported as such — quick mode neither bypasses an enabled gate nor turns on a disabled one.

Same rule as [implement.md](implement.md) step 7b: no commit lands with an open finding.

### 5. Commit

Atomic commit following [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <description>
```

Use imperative mood, lowercase, no period.

**Types:**

| Type       | When to use                                             |
| ---------- | -------------------------------------------------------- |
| `feat`     | New feature or capability                               |
| `fix`      | Bug fix                                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs`     | Documentation only                                      |
| `test`     | Adding or correcting tests                              |
| `style`    | Formatting, missing semicolons, etc. (no code change)   |
| `perf`     | Performance improvement                                 |
| `build`    | Build system or external dependencies                   |
| `ci`       | CI configuration files and scripts                      |
| `chore`    | Maintenance tasks that don't modify src or test files   |

**Scope:** Feature name or module area, lowercase, e.g., `auth`, `cart`, `api`

**Description rules:**

- Imperative mood ("add", not "added" or "adds")
- Lowercase first letter
- No period at the end
- Complete the sentence: "If applied, this commit will _[your description]_"

**Breaking changes:** Append `!` after type/scope AND add `BREAKING CHANGE:` footer:

```
feat(api)!: change authentication endpoint response format

BREAKING CHANGE: login endpoint now returns JWT in body instead of cookie
```

**Examples:**

```
feat(auth): add email validation to login form
```

```
fix(cart): prevent negative quantity on item decrement
```

```
refactor(api): extract token refresh logic into service

Move token refresh from inline handler to dedicated AuthTokenService
for reuse across multiple endpoints.
```

**Rules:**

- One task = one commit
- Description references what was DONE, not what was planned
- Include only files listed in the task — never sneak in "while I'm here" changes
- If tests are part of the task, include them in the same commit

### 6. Track

Update `.doninha/STATE.md` — Doninha's persistent memory file — with a quick task record (Quick Tasks Completed table: `#`, description, date, commit, status).

---

## Structure

Quick tasks do NOT get a separate tree. They live inside the PBI's own canonical folder, alongside its other artifacts:

```
.doninha/docs/modules/module_NNN_name/feature_NNN_name/pbis/pbi-NNN-slug/
├── pbi.md
├── TASK.md       # Description + verification
└── SUMMARY.md    # What was done + commit
```

**TASK.md template:**

```markdown
# Quick Task: [Title]

**Date:** [date]
**Status:** Done | In Progress | Blocked

## Description

[One sentence: what and why]

## Files Changed

- `src/path/to/file.ts` — [what changed]
- `src/path/to/other.ts` — [what changed]

## Verification

- [ ] [How to verify it works]
- [ ] [Expected behavior after fix]

## Commit

`[hash]` — [commit message]
```

---

## Guardrails

- **Max 3 files** — If more, use full pipeline
- **Max ~1 hour** — If longer, scope is wrong
- **No design decisions** — If you're choosing between approaches, use full pipeline
- **No new dependencies** — Adding packages needs full pipeline review
- **Track everything** — Even quick tasks get commits and `.doninha/STATE.md` entries

---

## Tips

- **Quick ≠ sloppy** — Same coding principles and the same scoped quality gate apply, just less ceremony
- **When in doubt, go full** — Better to over-plan than to ship broken code
- **Quick tasks compound** — If you're doing 5+ quick tasks for the same PBI, it's a feature that needs planning
- **Verify before marking done** — The whole point is quality, even for small tasks
