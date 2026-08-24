---
name: tlc-spec-driven
description: "Project and feature planning with adaptive Specify, Design, Tasks, Execute phases. Auto-sizes depth by complexity, detects workspace type, places specs co-located with backend domains or frontend/mobile features, and supports project init, codebase mapping, feature planning, implementation, verification, quick fixes, persistent decisions, and pause/resume workflows."
---

# Tech Lead's Club - Spec-Driven Development

License: CC-BY-4.0  
Author: Felipe Rodrigues - github.com/felipfr  
Version: 2.0.0

Plan and implement projects with precision. Granular tasks. Clear dependencies. Right tools. Zero ceremony.

```txt
SPECIFY -> DESIGN -> TASKS -> EXECUTE
required   optional  optional required
```

Design and Tasks are auto-skipped when scope does not need them.

## Workspace Type Detection

Before creating specs or planning work, identify the workspace context. This determines where feature specification files live.

If workspace context is unknown from `.specs/project/STATE.md`, ask:

> Are you working in a monorepo? If yes, which app are we focusing on: backend, frontend web, or mobile?

Record the answer in `.specs/project/STATE.md` under `Preferences` so it is only asked once per project.

## Spec Placement

Backend specs live inside the owning domain:

```txt
src/domains/[domain-name]/.specs/feature/[feature-name]/
  spec.md
  context.md
  design.md
  tasks.md
```

Frontend web and mobile specs live inside the owning feature:

```txt
src/features/[feature-name]/.specs/
  STATE.md
  spec.md
  context.md
  design.md
  tasks.md
```

Standalone/default specs live at root:

```txt
.specs/features/[feature-name]/
  spec.md
  context.md
  design.md
  tasks.md
```

Rule: never create feature spec files in the project root unless the workspace is standalone. The spec lives where the code lives.

## Auto-Sizing

Complexity determines depth:

| Scope | What | Specify | Design | Tasks | Execute |
|---|---|---|---|---|---|
| Small | <=3 files, one sentence | Quick mode | Skip | Skip | Implement + verify |
| Medium | Clear feature, <10 tasks | Brief spec | Inline | Implicit | Implement + verify |
| Large | Multi-component feature | Full spec with IDs | Architecture | Full breakdown | Verify per task |
| Complex | Ambiguous/new domain | Full spec + discuss | Research + architecture | Breakdown + parallel plan | UAT |

Rules:

- Specify and Execute are always required.
- Design is skipped when there are no architectural decisions or new patterns.
- Tasks is skipped when there are <=3 obvious steps.
- Discuss is triggered inside Specify only for ambiguous gray areas.
- Interactive UAT is triggered inside Execute only for user-facing features with complex behavior.
- Quick mode is for bug fixes, config changes, and small tweaks.

Safety valve: even when Tasks is skipped, Execute starts by listing atomic steps inline. If this reveals more than 5 steps or complex dependencies, stop and create `tasks.md`.

## Global Project Structure

Always keep global project memory at root:

```txt
.specs/
  project/
    PROJECT.md
    ROADMAP.md
    STATE.md
  codebase/
    STACK.md
    ARCHITECTURE.md
    CONVENTIONS.md
    STRUCTURE.md
    TESTING.md
    INTEGRATIONS.md
    CONCERNS.md
  quick/
    NNN-slug/
      TASK.md
      SUMMARY.md
```

## STATE.md Scopes

| Scope | Location | Content |
|---|---|---|
| Global | `.specs/project/STATE.md` | Workspace type, cross-feature decisions, architectural blockers, deferred ideas |
| Backend domain | `src/domains/[domain]/.specs/feature/STATE.md` | Domain decisions, progress, blockers, lessons |
| Frontend/mobile feature | `src/features/[feature]/.specs/STATE.md` | Feature decisions, task progress, blockers, lessons |

Always load local `STATE.md` first when working on a domain or feature. Escalate to global `STATE.md` only for cross-cutting concerns or project-wide preferences.

## Workflow

New project:

1. Initialize project: `PROJECT.md` + `ROADMAP.md`.
2. For each feature: Specify -> Design when needed -> Tasks when needed -> Execute.

Existing codebase:

1. Map codebase: create seven brownfield docs.
2. Initialize project: `PROJECT.md` + `ROADMAP.md`.
3. For each feature: same adaptive workflow.

Quick mode:

1. Describe.
2. Implement.
3. Verify.
4. Commit.

## Context Loading

Base load:

- `.specs/project/PROJECT.md`, if it exists.
- `.specs/project/ROADMAP.md`, when planning or working on features.
- `.specs/project/STATE.md`, for global memory.

On-demand load:

- `.specs/codebase/*` docs for brownfield work.
- `.specs/codebase/CONCERNS.md` for fragile areas.
- `.specs/codebase/TESTING.md` for verification gates.
- local `STATE.md` for the target domain/feature.
- target feature `spec.md`, `context.md`, `design.md`, and `tasks.md` as needed.

Never load simultaneously:

- multiple feature specs;
- multiple architecture docs;
- archived documents.

Target context: under 40k tokens. See [context-limits.md](references/context-limits.md).

## Sub-Agent Delegation

Use sub-agents or equivalent task delegation when available and appropriate to keep main context lean. Delegate research, brownfield mapping, large implementation tasks, and parallel tasks. Keep planning, task creation, validation reports, and quick mode in the orchestrating context.

Each delegated task should receive only:

- the specific task definition;
- relevant conventions;
- testing guidance;
- spec/design context directly referenced by the task.

Expected return:

- Status: Complete, Blocked, or Partial.
- Files changed.
- Gate check result.
- `SPEC_DEVIATION` markers, if any.
- Issues encountered.

## Commands

Project-level:

| Trigger | Reference |
|---|---|
| Initialize project, setup project | [project-init.md](references/project-init.md) |
| Create roadmap, plan features | [roadmap.md](references/roadmap.md) |
| Map codebase, analyze existing code | [brownfield-mapping.md](references/brownfield-mapping.md) |
| Document concerns, find tech debt, risky areas | [concerns.md](references/concerns.md) |
| Record decision, log blocker, add todo | [state-management.md](references/state-management.md) |
| Pause work, end session | [session-handoff.md](references/session-handoff.md) |
| Resume work, continue | [session-handoff.md](references/session-handoff.md) |

Feature-level:

| Trigger | Reference |
|---|---|
| Specify feature, define requirements | [specify.md](references/specify.md) |
| Discuss feature, capture context | [discuss.md](references/discuss.md) |
| Design feature, architecture | [design.md](references/design.md) |
| Break into tasks, create tasks | [tasks.md](references/tasks.md) |
| Implement task, build, execute | [implement.md](references/implement.md) |
| Validate, verify, test, UAT | [validate.md](references/validate.md) |
| Quick fix, quick task, small change | [quick-mode.md](references/quick-mode.md) |

Supporting references:

- [code-analysis.md](references/code-analysis.md)
- [coding-principles.md](references/coding-principles.md)

## Skill Integrations

Diagrams: when creating architecture, data-flow, component, or sequence diagrams, check whether `mermaid-studio` is installed. If available, use it. Otherwise, write inline Mermaid and recommend the skill at most once per session.

Code exploration: when mapping or exploring an existing repository, check whether `codenavi` is installed. If available, use it. Otherwise, use built-in code analysis tools and recommend it at most once per session.

## Knowledge Verification Chain

When researching, designing, or making technical decisions:

1. Check the codebase.
2. Check project docs.
3. Use Context7 MCP if available for current library APIs.
4. Use web search against official or reputable sources.
5. Flag uncertainty explicitly.

Never assume or fabricate APIs, patterns, or behavior. If documentation cannot be found, say so.

## Output Behavior

After lightweight tasks such as validation, state updates, or session handoff, naturally mention once that such tasks work well with faster/cheaper models. Track the note in `STATE.md` under `Preferences` to avoid repeating.

For heavy tasks such as brownfield mapping or complex design, briefly state the reasoning requirements before starting.
