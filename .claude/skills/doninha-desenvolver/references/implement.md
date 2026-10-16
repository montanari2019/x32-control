# Execute

**Goal**: Implement ONE task at a time. Surgical changes. Verify. Commit. Repeat.

This is where code gets written. Every task follows the same cycle: check for a specialist → plan → implement → verify → commit. Verification is built into every task, not a separate phase.

---

## MANDATORY: Before Starting Any Implementation

**Load the `doninha-code-practices` skill for the implementation constraints, then state:**

1. **Assumptions** - What am I assuming? Any uncertainty?
2. **Files to touch** - List ONLY files this task requires
3. **Success criteria** - How will I verify this works?

⚠️ **Do not proceed without stating these explicitly.**

---

## Process

**Sub-agent context:** When this task is executed by a sub-agent, the sub-agent receives
the task definition, coding principles, TESTING.md, and relevant spec/design context.
All steps below apply identically whether running in the main context or a sub-agent.
The only difference: sub-agents report results back to the orchestrator rather than
continuing to the next task. A sub-agent here is a **generic worker** running this same
loop — never one of the `doninha-*` agent definitions, which belong to a separate
agent-driven flow and are never invoked from this skill.

### 0. Check for a Specialist Skill

Before touching any code for this task — before reading implementation files, before
writing tests, before anything in the steps below — check whether this task's domain
is mapped to a specialist skill.

1. Read [gap-routing.md](gap-routing.md) (same `references/` folder) and use its
   routing rules to determine whether this task maps to `doninha-backend`,
   `doninha-frontend`, `doninha-ux`, or none of them. This file does not duplicate that
   mapping — `gap-routing.md` is the single source of truth for which stack/domain
   signals route to which skill.
2. If the task maps to one of those skills:
   - Invoke that skill now, before any other step in this document.
   - Follow its handoff instructions and conventions for the remainder of the task
     (its coding standards take precedence over generic guidance in this file where
     they overlap).
   - If the task spans more than one domain (e.g. backend + frontend), invoke each
     mapped skill in turn before proceeding.
3. If the mapped skill is not installed in this project:
   - Print a warning that the specialist skill is missing and proceed anyway.
   - Fall back to the generic discipline in this file — never block the task on a
     missing specialist skill.
4. If the task maps to no specialist domain (e.g. pure config, docs, infra scripting),
   skip this step and proceed directly to Step 1.

⚠️ **Do not skip this check.** It must run before any code for the task is read or
written, even if the mapping turns out to be "none."

### 1. List Atomic Steps (MANDATORY when the task breakdown was skipped)

If there is no task file for this feature, you MUST list atomic steps before writing any code. This is non-negotiable — it prevents the agent from losing focus and doing too many things at once.

```
## Execution Plan

1. [Step] → files: [list] → verify: [how] → commit: [message]
2. [Step] → files: [list] → verify: [how] → commit: [message]
3. [Step] → files: [list] → verify: [how] → commit: [message]
```

**Each step must be:**

- ONE deliverable (one component, one function, one endpoint, one file change)
- Independently verifiable (can prove it works before moving on)
- Independently committable (gets its own atomic git commit)

If listing steps reveals >5 steps or complex dependencies, STOP and create a formal task breakdown instead. The task-breakdown phase was wrongly skipped.

### 2. Pick Task

From the PBI's task file (if it exists) or from the execution plan above. User specifies ("implement T3") or suggest next available.

### 3. Verify Dependencies

If a task file exists, check dependencies. If using an inline plan, follow the order listed.

❌ If blocked: "T3 depends on T2 which isn't done. Should I do T2 first?"

### 4. State Implementation Plan

Before writing code:

```
Files: [list]
Approach: [brief description]
Success: [how to verify]
```

### 5. Write Tests First (RED)

If the task includes tests (per the Tests field in the task file or TESTING.md coverage matrix):

1. Write the test file(s) BEFORE writing any implementation
2. Tests must encode the expected behavior from the task's "Done when" criteria
3. Run the test command — confirm tests FAIL (RED state)
4. If tests pass before implementation exists, the tests are too weak — rewrite them

**Constraints:**

- Tests define correct behavior independently of implementation
- Each acceptance criterion from "Done when" maps to at least one test assertion
- Edge cases from spec.md that apply to this task get test cases too

If the task does NOT include tests (e.g., entity-only, config-only), skip to Step 5b.

### 5b. Implement (GREEN)

Write the minimum implementation needed to satisfy the task's success criteria: pass all relevant tests (when present) and meet the defined verification/gate checks when there are no direct tests.

**HARD CONSTRAINTS:**

- Do NOT modify tests written in Step 5. The tests are the spec — implementation conforms to them.
- Do NOT weaken assertions (making them less specific to pass more easily)
- Do NOT delete or skip test cases
- Do NOT use the test framework's skip/disable/pending mechanism to bypass failing tests
- Minimum code to pass — save structural improvements for a refactor task

If a test is genuinely wrong (tests the wrong behavior per spec), STOP and ask the user
before modifying it. Never silently change a test.

Follow the `doninha-code-practices` skill and any specialist skill invoked in Step 0:

- Simplest code that works
- Touch ONLY listed files
- No scope creep

### 6. Gate Check (VERIFY)

Run the gate check command from the task definition. This is MANDATORY — not "if applicable."

1. Look up the command for the task's Gate level (quick/full/build) in TESTING.md's Gate Check Commands section, then run it
2. Non-zero exit code = STOP. Fix the failure. Re-run. Do not proceed until green.
3. Confirm the test count matches expectations (no tests were silently deleted or skipped)

**Tiered gates (from TESTING.md Gate Check Commands):**

| Task includes                    | Gate level | What runs                |
| --------------------------------- | ---------- | ------------------------- |
| Unit tests only                  | Quick      | Unit test command        |
| E2E or integration tests         | Full       | Unit + E2E commands      |
| Last task in a phase             | Build      | Build + lint + all tests |
| No tests (config, entities, etc) | Build      | Build + lint only        |

The gate check is deterministic. The test runner decides if the code is correct,
not the agent's self-assessment.

### 7. Post-Gate Review

After the gate check passes:

1. Verify test count: Are there at least as many test cases as before? (prevents silent deletion)
2. Verify no SPEC_DEVIATION: If implementation diverged from spec/design, add a marker:

```
// SPEC_DEVIATION: [what diverged]
// Reason: [why the deviation was necessary]
```

3. Altitude read: "Would a senior engineer flag this as overcomplicated?"
   - Yes → Simplify, re-run gate
   - No → Proceed to 7b

   This is a judgment read, not the complexity gate — Step 7b measures complexity deterministically.

### 7b. Scoped Quality Gate (MANDATORY — before the commit)

The gate check in Step 6 proves the tests pass. It does not prove the code is lintable,
non-duplicated, consistent with the project's patterns — or, when the project enabled it,
within complexity limits. Step 7b does.

1. Read [quality-gate.md](quality-gate.md) — it defines which gates run per task, how to
   scope them, and how to degrade when a tool isn't available. This file does not duplicate
   that routing.
2. Invoke the `doninha-quality-gate` **skill** with scope `per-task`, the list of files this
   task changed (`git diff --name-only` against the task's starting point), and the
   `quality_gates` resolution from `sessao-dev.md` (step-02 §5b). Which gates that scope runs
   is defined only by that skill's `## Scoped invocation` table — read it there and run every
   gate it lists; this file deliberately names none of them. A gate the project did not enable
   is reported as DISABLED and is not run. Invoking the skill means
   loading it in this context; never spawn a `doninha-*` agent to run the gate.
3. **Any unresolved finding blocks the commit.** Fix it, re-run the affected gate, and only
   then proceed to Step 8. Never commit a task with an open finding.
4. An enabled gate that can't run (skill not installed, MCP unavailable, Docker missing) is
   reported as **SKIP with its reason** and does not block — apply the degradation cascade in
   `quality-gate.md`. Never report a skipped gate as passing, and never report a DISABLED gate
   as SKIP — they are different states.
5. A finding in code this task did not touch is pre-existing: note it in `.doninha/STATE.md`
   under Deferred Ideas and move on. It does not block this task.

⚠️ **Do not skip this step**, and do not run it after the commit — the point is that no
commit lands with an open finding.

### 8. Atomic Git Commit

Each task gets its own commit immediately after verification. Never batch multiple tasks into one commit.

**Format ([Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)):**

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

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

### 9. Scope Guardrail

During implementation, you will notice things that could be improved, refactored, or added. **Do not act on them.** Instead:

- If it's a bug: note it in STATE.md as a blocker or use quick mode
- If it's an improvement: note it in STATE.md under "Deferred Ideas" or "Lessons Learned"
- If it's related to the current task: only include it if it's in the "Done when" criteria

**The heuristic:** "Is this in my task definition?" If no, don't touch it.

### 10. Update Task Status

Mark the task complete in the PBI's task file. Update requirement traceability in spec.md if requirement IDs are used.

---

## Execution Template

```markdown
## Implementing T[X]: [Task Title]

**Reading**: task definition from the PBI's task file
**Specialist**: [doninha-backend | doninha-frontend | doninha-ux | none — see gap-routing.md]
**Dependencies**: [All done? ✅ | Blocked by: TY]
**Tests**: [unit/e2e/integration/none — an e2e task implements the `E2E-NN` of `spec.md`, it does not invent a scenario; a scenario that turns out wrong is corrected **in the spec**, with the user, and the deviation recorded in `sessao-dev.md`]
**Gate**: [quick/full/build]

### Pre-Implementation (MANDATORY)

- **Assumptions**: [state explicitly]
- **Files to touch**: [list ONLY these]
- **Success criteria**: [how to verify]

### RED: Write Tests

- Test file(s): [paths]
- Test count: [N test cases]
- Confirmed failing: [Yes — all N tests fail as expected]

### GREEN: Implement

[Write minimum code to pass tests]

- Tests modified: None
- Tests skipped/deleted: None

### VERIFY: Gate Check

- Command: [gate check command]
- Result: [X passed, 0 failed]
- Test count: [N — matches RED phase count]

### Post-Gate

- [x] No SPEC_DEVIATION (or markers added)
- [x] No unnecessary changes made
- [x] Matches existing patterns

### Quality Gate (scoped: per-task)

- Files scoped: [changed-file list]
- [one line per gate in the `per-task` scope, per `doninha-quality-gate`'s `## Scoped invocation` table]
  `Gate [N] ([name]): PASS | FAIL | SKIP | DISABLED — [reused tier-gate result | commands run | reason if not PASS | off in quality-gate.yml]`
- Findings resolved: [list, or None]
- Pre-existing findings deferred to STATE.md: [list, or None]

**Status**: ✅ Complete | ❌ Blocked | ⚠️ Partial
```

---

## Tips

- **Check for a specialist first** — Step 0 runs before any code is touched, every task
- **One task at a time** — Focus prevents errors
- **Tools matter** — Wrong MCP = wrong approach
- **Reuses save tokens** — Copy patterns, don't reinvent
- **Check before commit** — Verify all criteria, then commit
- **Quality gate before the commit, not after** — Step 7b runs while the change is still uncommitted; an open finding means no commit
- **Stay surgical** — Touch only what's necessary
- **Commit per task** — Clean git history enables bisect and rollback
- **Never "while I'm here"** — Scope creep during implementation is the #1 quality killer
- **Learn from mistakes** — If something goes wrong, add a Lesson Learned to STATE.md
