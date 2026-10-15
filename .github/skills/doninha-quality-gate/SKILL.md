---
name: 'doninha-quality-gate'
description: "Doninha Quality Gate Skill — ensures the quality of generated code through a systematic validation workflow. Use this skill after generating or modifying code, when asked to validate code quality, check for code smells, verify standards compliance, review generated code, run quality checks, or ensure code meets project quality standards. Triggers on: validate code, quality check, review code quality, ensure quality, run quality gate, check code standards, verify code."
---

# Doninha Quality Gate

This skill defines a systematic workflow for validating the quality of generated or modified code. It ensures that every piece of code passes through a series of quality gates before being considered complete, reducing defects and maintaining project standards.

The quality gate is not a single check — it is a pipeline of validations, each building on the previous one. If any gate fails, the issue must be resolved before proceeding to the next gate.

## When to Use

- After generating new code or modifying existing code.
- When the user explicitly asks to validate or review code quality.
- As the final validation step of a unit of work, before it is considered done.
- As the pre-commit gate inside a per-task implementation loop (scope `per-task`) and again at the end of the unit of work (scope `full`) — see Caller contract.
- When investigating code smells, complexity issues, or standards violations.

## Rules

- Run **every gate in the requested scope** (see Scoped invocation below). **NEVER** silently drop a gate from the scope.
- Gates 3 (complexity) and 5 (SonarQube) are **opt-in per project** (see Configuration below). A gate the project has not enabled is **not in the scope**: it does not run, and it is reported as **DISABLED** — never as PASS, never as SKIP, and never omitted from the report.
- A gate that is enabled but genuinely cannot run — its tool isn't installed, Docker is missing, credentials aren't configured — is reported as **SKIP with the reason**. Never report a skipped gate as PASS, and never omit it from the report.
- Fill all quality checklist items.
- If any gate fails, identify the issue, fix it, and re-run the gate until it passes.
- **This skill never invokes an agent.** It runs inside the calling flow's own context, uses the scope and file list that flow declared, and returns the report to whoever invoked it. Never route to, hand off to, or "return the report to" any `doninha-*` agent definition — there is no agent in this skill's execution path.

## Configuration

Gates 3 (complexity) and 5 (SonarQube) run external tooling — the `doninha-mcp` tools `complexity-check`, `sonar-run` and `get-sonar-issues`, each in a Docker container — and most teams already run the same checks in their pipeline. They are therefore **off by default** and enabled per project in `.doninha/integrations/quality-gate.yml` (at the workspace root, next to `azure-devops.yml`; `doninha init` writes it when the user opts in):

```yaml
sonar: true         # Gate 5 — SonarQube at closeout
complexity: true    # Gate 3 — complexity-check per task
# sonar_project_key: my-project   # optional; default is sonar.projectKey from sonar-project.properties
```

Resolution rules — read the file once per invocation, and branch only on it:

- File absent, key absent, or key `false` → that gate is **DISABLED**. Report it as `DISABLED (off in quality-gate.yml)`; do not run it, do not apply its manual fallback, and do not record it as a Blocker.
- Key `true` → the gate is enabled and runs whenever its scope is requested. Only then do its prerequisites (Docker, `SONAR_URL`/`SONAR_TOKEN`, `sonar-project.properties`) matter — a missing prerequisite on an enabled gate is a **SKIP with the reason**.
- Never infer "enabled" from anything else: not from `sonar-project.properties` existing, not from `doninha-mcp` being registered (it is always registered — it also renders diagrams), not from `SONAR_URL` being set.
- When the file is absent, mention once per unit of work — one line, in the report — that the project can enable the gates by creating `.doninha/integrations/quality-gate.yml`. Do not ask the user to create it, and do not create it yourself.

Gates 0, 1, 2, 4 and 6 are not affected by this file.

## Scoped invocation

The calling flow declares the scope and the file list; this skill does not guess either.

**This table is the single source of truth for which gates a scope runs.** No calling flow re-states the gate numbers — they reference this table. If a flow's own docs disagree with it, this table wins.

| Scope | Gates that run | Typical caller |
| --- | --- | --- |
| `per-task` | 0, 1, 3\*, 4 | a single task, before its commit — only the cheap, local gates |
| `full` | 0–6 (3\*, 5\*) | end of a unit of work — adds coverage, SonarQube, and checklist verification |

\* Gates 3 and 5 belong to the scope only when enabled in `quality-gate.yml` (see Configuration). Otherwise they appear in the report as DISABLED.

A gate whose result the caller already has from an earlier run in the same unit of work (typically 1, from a per-task run or a build step) is **reported with that result, not re-run** — reusing a result is not the same as dropping the gate.

The caller also passes the **list of changed files** the gates apply to. Every gate scopes its analysis and its findings to that list: a finding in code the caller didn't touch is pre-existing, and belongs in the report as context, not as a blocker.

If no scope is declared, default to `full`.

### Gate 0: Scope Coverage & Diff Analysis

Before starting the quality checks, identify the scope of the changes:

1. Verify if generated/modified files are in the execution plan and match the intended scope.
2. Classify differences as:
   - **Intended changes**: directly related to the execution plan.
   - **Unintended changes**: unrelated modifications that may indicate a problem (e.g., formatting changes, unrelated code modifications).
3. If unintended changes are detected, investigate the root cause before proceeding (e.g., misconfigured formatter, incorrect file paths).

### Gate 1: Static Analysis (Compilation & Linting)

Verify that the code compiles and passes all linting and build-level checks configured in the project.

**Don't run what the caller already ran.** If the calling flow already executed the project's compile/type-check and lint commands (e.g. a task's tier gate, or a Build-tier run at closeout), record that result and skip step 1's discovery — re-running the same commands costs time and proves nothing new. Step 1 exists for the case where the caller has no such coverage to reuse.

**Steps:**

1. **Build system discovery** — Before running any linter, scan the project root for build configuration files and derive the commands to run:
   - `pom.xml` (Maven): read `<plugins>` and `<annotationProcessorPaths>`; run `mvn compile` (executes annotation processors such as Checker Framework, ErrorProne) and, if analysis plugins (SpotBugs, PMD, Checkstyle) are configured, also run `mvn verify -DskipTests`.
   - `build.gradle` / `build.gradle.kts` (Gradle): read applied plugins; run `./gradlew compileJava` and `./gradlew check`.
   - `package.json` (npm/yarn/pnpm): inspect the `scripts` block; run every script named `check`, `validate`, `typecheck`, `lint`, or `build` that is defined.
   - `pyproject.toml` / `tox.ini` / `setup.cfg` (Python): identify configured tools (mypy, pylint, ruff, flake8) and run them.
   - `Makefile`: look for `check`, `lint`, `validate` targets and run them.
   - CI/CD pipelines (`.github/workflows/*.yml`, `azure-pipelines.yml`, `Jenkinsfile`, `.gitlab-ci.yml`): read to identify expected validation/build commands; run the same commands locally to ensure parity.
   - All discovered commands must pass (zero errors) before continuing to the next step.

2. Identify the project's configured linters and compilers from explicit config files (e.g., TypeScript compiler, ESLint, Prettier, Biome, Pylint, Flake8, Rubocop).
3. Run the compiler on the changed files — zero errors is the requirement.
4. Run linters on the changed files — zero errors is the requirement (warnings are acceptable but should be reviewed).
5. If linting auto-fix is available (`--fix`), apply it first, then verify the result.

**How to check:**

- Look for `pom.xml`, `build.gradle*`, `package.json`, `Makefile`, `tsconfig.json`, `eslint.config.*`, `.eslintrc.*`, `.prettierrc`, `biome.json`, `pyproject.toml`, `setup.cfg`, or equivalent configuration files.
- Otherwise, run the project's lint/compile scripts directly (e.g., `mvn compile`, `./gradlew check`, `npm run lint`, `npx tsc --noEmit`).

**Pass criteria:** Zero errors from all discovered build/annotation-processor commands. Zero compilation errors. Zero linting errors.

### Gate 2: Test Execution & Coverage

Ensure that the generated code is properly tested and that existing tests still pass. This gate is part of the `full` scope only — a per-task caller has already run that task's own tests through its tier gate, and a coverage threshold is only meaningful against the complete set of changed files.

**Steps:**

1. Run the full test suite (or the relevant subset for the changed files).
2. Verify all tests pass — zero failures.
3. Check test coverage for the changed files — target at least 80% line coverage.
4. If tests are missing for the generated code, write them before proceeding.

**What to test:**

- Happy path: the expected behavior works correctly.
- Edge cases: boundary values, empty inputs, null/undefined, maximum sizes.
- Error scenarios: invalid inputs, network failures, permission errors.
- Validation rules: all business rules defined in the execution plan.

**Pass criteria:** All tests pass. Coverage on changed files >= 80%.

### Gate 3: Complexity Analysis

Ensure the generated code does not introduce excessive complexity that harms readability and maintainability.

**Opt-in.** This gate runs only when `complexity: true` in `.doninha/integrations/quality-gate.yml` (see Configuration). Otherwise report `DISABLED (off in quality-gate.yml)` and move on — the manual check in step 2 is part of this gate and does not run either; the caller's Post-Gate review still reads complexity as a matter of judgment, which is a different thing from this deterministic gate.

**Steps (enabled gate only):**

1. Use Doninha MCP `complexity-check(path, cyclomaticThreshold)` if available — both arguments are required.
   - `path` must be a **directory**, and it only sets the analyzer's root — everything below it is analyzed. It does **not** scope down to individual files, so pass the narrowest directory containing the changed files, then **filter the returned findings to the caller's changed-file list**. Findings outside that list are pre-existing: report them as context, don't block on them.
   - Returned paths are **relative to `path`**, not to the repo root (`path: src/core` yields `./setup/installers.ts`). Rebase them onto `path` before matching against a repo-relative changed-file list.
   - `cyclomaticThreshold` is what actually filters: pass `10` to match this gate's pass criteria.
   - The tool runs in a Docker container. **No Docker → this gate is SKIP (Docker unavailable)**, not FAIL. Fall back to step 2's manual check when practical.
   - Output is one line per function above the threshold — `[SEVERITY] <path>(<line>) — (<function signature>)  CC:<n> LOC:<n> tokens:<n>` — or `COMPLEXITY: none above threshold (<threshold>)`. Its severity bands (worst metric wins) are: cyclomatic complexity 5/10/15/20/30, lines of code 15/50/100/200/500, token count 50/100/200/500/1000 — small/low/moderate/high/critical.
2. Whether or not the tool ran, check function and file length by hand — the tool reports LOC per function but enforces nothing beyond the cyclomatic threshold, and it says nothing about file length:
   1. Cyclomatic complexity of new/modified functions — target max 10 per function.
   2. Function length — target max 50 lines per function (excluding blank lines and comments).
   3. File length — target max 500 lines per file.

**When complexity is too high:**

- Extract helper functions with descriptive names.
- Use early returns to reduce nesting.
- Apply strategy pattern or polymorphism instead of long switch/if chains.
- Break large files into smaller, focused modules.

**Pass criteria:** Within the caller's changed-file list — no function exceeds cyclomatic complexity of 10, no function exceeds 50 lines, no file exceeds 500 lines.

### Gate 4: Code Pattern Compliance

Verify that the generated code follows the project's existing patterns, conventions, and architecture.

**Steps:**

1. Search the codebase for similar code to identify established patterns (naming, structure, error handling, logging).
2. Verify naming conventions match the project:
   - Variable, function, class, file, and folder naming patterns.
   - Use the doninha-ubiquitous-language skill if available to validate domain terms, measuring against the project's own pattern per its §0 precedence — never against the skill's default. Identifiers in the project's own language are correct; a gate that reports them as violations is reporting the project, not the code.
   - The naming contract itself is **not** decided here. It was resolved before code was written (`doninha-desenvolver` step-03 §4.0, recorded in `spec.md`). This gate only checks that the code kept it.
3. Verify architectural patterns are respected:
   - Folder structure follows the project's conventions.
   - Dependencies flow in the correct direction.
   - No circular dependencies introduced.
4. Verify error handling follows the project's patterns:
   - Errors are caught and handled consistently.
   - Error messages are clear and actionable.
   - Custom error types are used where the project expects them.

**Pass criteria:** Generated code is indistinguishable in style from existing project code.

### Gate 5: SonarQube Analysis

This gate is part of the `full` scope only — it is too slow to run per task (see Scoped invocation).

**Opt-in.** It runs only when `sonar: true` in `.doninha/integrations/quality-gate.yml` (see Configuration). Otherwise report `DISABLED (off in quality-gate.yml)` and move on — the presence of `sonar-project.properties` does **not** turn it on; the team's pipeline owns SonarQube in that case. When enabled, run it every time the `full` scope is requested: never skip it for cost, and never skip it because individual tasks already passed their own gate levels.

**Steps (enabled gate only):**

1. Check for `sonar-project.properties` in the project root. Absent → the gate is enabled but cannot run; report it as SKIP (sonar-project.properties missing).
2. If present, run `sonar-run(repoRoot, targetPath)` via Doninha MCP — both arguments optional (`repoRoot` defaults to the working directory, `targetPath` scopes the scan via `sonar.inclusions`). The scanner reads the project's own `sonar-project.properties`; the tool passes nothing else.
3. After analysis completes, fetch the report with `get-sonar-issues(projectKey, filters)`:
   - `projectKey` (required) comes from `sonar_project_key` in `quality-gate.yml` when set, otherwise from `sonar.projectKey` in `sonar-project.properties` — never invent or guess it.
   - `filters.directories` — scope to the directories that were changed. Optional companions: `filters.components`, `filters.issueStatuses` (`OPEN`/`CONFIRMED`/`FALSE_POSITIVE`/`ACCEPTED`/`IN_SANDBOX`), `filters.ps` (page size).
   - The response has three sections: `ISSUES` (severity, rule, `file:line`, message), `DUPLICATIONS` (path, duplicated-line density, block count), `HOTSPOTS` (`file:line`, message). Read all three — duplication is part of this gate, not a separate concern.
4. Fix any new issues introduced by the generated code:
   - **Bugs**: Fix immediately — these are correctness issues.
   - **Vulnerabilities**: Fix immediately — these are security issues.
   - **Code Smells**: Fix unless they conflict with an intentional design decision (document the rationale).
   - **Duplications**: Extract the shared logic, unless the duplication is deliberate and documented.
   - **Security Hotspots**: Review and address or mark as safe with justification.

**Prerequisites and degradation (enabled gate).** Both steps need Docker, and the analysis needs `SONAR_URL` and `SONAR_TOKEN` (a SonarQube *User Token*) in the MCP server's environment. When either is missing the gate is **SKIP with the reason**, never FAIL and never a silent PASS:

- Credentials unset → `sonar-run` returns `SonarQube URL or token not configured.` without attempting anything → SKIP (credentials not configured).
- Docker unavailable → the container fails to start → SKIP (Docker unavailable).
- `doninha-mcp` not registered at all → SKIP (MCP unavailable).

**Pass criteria:** Zero new bugs. Zero new vulnerabilities. Zero new code smells (or documented rationale for accepted smells). No new duplication introduced. Only findings **newly introduced** by the change count — pre-existing findings are reported as context.

### Gate 6: Checklist Verification

Perform a final review against the project's quality checklist. This gate is part of the `full` scope only.

**Steps:**

1. Read the checklist the calling flow points at — the checklist source is **whatever the caller declares**, never assumed from a fixed path:
   - Called by `doninha-desenvolver`: the PBI folder's `task.md` "Done when" items plus `spec.md`'s Requirement Traceability table.
   - Called by any other flow: that flow declares the checklist path explicitly as part of its invocation.
   - Nothing declared and nothing found: report this gate as SKIP (no checklist provided) rather than inventing one.
2. Evaluate every item in the checklist against the generated code — satisfied by the code, not merely ticked.
3. Mark each item as passed or failed — failed items must be fixed.

**Pass criteria:** All checklist items pass.

## Handling Failures

When a gate fails:

1. Identify the specific issue and its root cause.
2. Fix the issue in the generated code.
3. Re-run the failed gate to confirm the fix.
4. Continue to the next gate only after the current gate passes.
5. If a fix in a later gate could affect an earlier gate (e.g., refactoring to reduce complexity changes test expectations), re-run affected earlier gates.

## Output Format

After completing all gates, produce a quality report:

```markdown
# Quality Gate Report

**Date**: [TIMESTAMP]
**Files Analyzed**: [list of files]

## Results

**Scope**: [per-task | full]
**Files Analyzed**: [the caller's changed-file list]

| Gate | Status | Details |
| --- | --- | --- |
| 0. Scope & Diff | PASS/SKIP/FAIL | [intended vs unintended changes] |
| 1. Static Analysis | PASS/SKIP/FAIL | [build commands discovered: X; linters run: Y; or: reused caller's tier-gate result] |
| 2. Tests & Coverage | PASS/SKIP/FAIL | [coverage % on changed files — out of scope for per-task] |
| 3. Complexity | PASS/SKIP/FAIL/DISABLED | [max complexity found in scoped files — or: off in quality-gate.yml] |
| 4. Pattern Compliance | PASS/SKIP/FAIL | [summary] |
| 5. SonarQube | PASS/SKIP/FAIL/DISABLED | [new issues / duplications / hotspots — out of scope for per-task; or: off in quality-gate.yml] |
| 6. Checklist | PASS/SKIP/FAIL | [items passed/total — out of scope for per-task] |

Gates outside the requested scope are marked as such, not as PASS. Every SKIP carries its reason. DISABLED means the project did not enable the gate in `.doninha/integrations/quality-gate.yml` — it is neither a failure nor a tooling gap.

## Overall: PASS / FAIL

## Issues Found & Resolved
- [description of issues fixed during the quality gate process]

## Pre-existing Findings (outside the changed-file list)
- [reported as context; did not block]

## Remaining Risks
- [any risks or trade-offs that were accepted]
```

## Caller contract

Every caller provides the scope and the changed-file list; no caller expects this skill to derive its own scope. This skill runs in the caller's context and hands the report back there — it never invokes an agent to do the work, and never delegates the report to one.

**`doninha-desenvolver`** — invokes it twice per PBI, at different scopes:

1. `per-task`, in step-04, after the Post-Gate review and **before** each task's commit — Gates 0/1/4 on that task's diff, plus 3 when enabled. An unresolved finding blocks the commit.
2. `full`, in step-05's closeout gate — all gates on the PBI's accumulated diff (3 and 5 only when enabled), after the Build-tier build/type-check already ran. An unresolved finding blocks marking the PBI done. Gate 1 reuses that Build-tier result instead of re-running build+lint.

That skill's `references/quality-gate.md` owns the routing contract (which gate runs when, how to scope it, how to degrade). This skill owns the gate definitions and thresholds. Neither duplicates the other.

**Any other flow** — declares a scope and a changed-file list, and receives the quality report back in its own context. Nothing else is assumed about the caller: this skill has no knowledge of who invoked it beyond what that invocation declared.

If any gate fails and cannot be automatically resolved, escalate to the user with a clear description of the issue and suggested resolution options. If a gate cannot run at all, report it as SKIP with the reason and continue — a missing tool degrades the depth of the check, it never halts delivery. A gate the project turned off in `quality-gate.yml` is DISABLED, not SKIP: nothing is missing, the team chose to keep that check in its pipeline.
