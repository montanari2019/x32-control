---
name: doninha-backend
description: "Stack-agnostic backend-work discipline for AI agents that preserves the engineering harness around a change instead of only writing code: context discovery, ownership, contract impact, persistence, messaging, observability, security and a clean handoff. Every stack- or policy-specific detail is derived from the target project's own .doninha/docs/codebase/* and DONINHA.md — never hardcoded. Invoked by doninha-desenvolver whenever a task touches the backend. Use when the work touches a backend, service, API, DTO, endpoint, schema, migration, queue, persistence, or any server-side integration or business logic. Do not use for pure-frontend work, product discovery, visual design, or architecture documents with no implementation intent."
license: CC-BY-4.0
metadata:
  version: 1.0.0
---

# Doninha Backend

Use this skill to make an agent's backend work repeatable and reviewable. The goal is not only to write code; it is to keep the harness intact around the change: ownership, contracts, tests, data safety, observability, and a clean handoff.

This skill is **stack-agnostic by construction**. It carries no fixed language, framework, coverage number, or topology. Everything specific to a project comes from that project's own documentation, discovered at runtime:

- `.doninha/docs/codebase/*` — the repo's context produced by `doninha-project-research`. This is the source of truth for layers, build/test commands, persistence, messaging, tenancy, and every policy this skill can enforce. In a multi-repo workspace, resolve this path **per repo with fallback** per `doninha-workspace-detection`'s Codebase-context resolution: prefer the current repo's `repos/<name>/.doninha/docs/codebase/*`, else the root. Follow that skill's **reading order**: `OVERVIEW.md` (repo role + module map) → the `modules/<slug>.md` of the **one** module you are touching → the technical files (`stack.md`, `architecture.md`, `conventions.md`, `integrations.md`, `concerns.md`, `testing.md`, `risks.md`). Never read the whole `modules/` folder; a missing `OVERVIEW.md` or module doc is normal — fall back.
- `DONINHA.md` — policies and overrides the team declares at the project root.

`doninha-backend` is the domain-execution discipline. It **applies** the cross-cutting principles in `doninha-code-practices` and `doninha-testing-practices` (when installed) to backend work — it does not replace them.

## Operating principles

- Treat the target project's existing conventions as the source of truth. Before editing, read `.doninha/docs/codebase/*` (in the reading order above — `OVERVIEW.md` first, then the module's own doc) and `DONINHA.md`, plus any local `AGENTS.md`, `CLAUDE.md`, README, build files, and nearby tests for the module you are touching.
- Every stack, framework, tool, policy, and threshold named below is **illustrative only**. Never assume a project uses a given language, framework, database, or messaging system — confirm it from the project's own docs or code.
- Keep the change limited to one coherent backend outcome. If the request mixes independent deliverables, split the plan before editing.
- Preserve module/service boundaries. Do not move responsibilities across boundaries unless the task explicitly requires it and the impact is highlighted.
- Respect the project's declared layering. Keep entry-point adapters (HTTP handlers, controllers, resolvers, consumers) thin: adapt input/output and delegate. Keep business rules and data access in the layers the project designates for them.
- Check contracts whenever the change touches an API, DTO, event, schema, authentication, or external integration. See [references/backend-harness-gates.md](references/backend-harness-gates.md).
- Prefer deterministic verification over assertions. Run the smallest meaningful tests first; widen when shared behavior or contracts changed. See [references/verification-playbook.md](references/verification-playbook.md).
- Stop and surface blockers when required context, credentials, generated sources, local services, or migrations are missing. Never claim the harness was verified when only static inspection was performed.

## The 6-step routine

Follow these steps in order for every backend task. For very small mechanical fixes you may keep the plan (step 3) internal, but never skip classification, the harness portrait, verification, or handoff.

### Step 1 — Classify the change

Identify:

- **Type**: feature, bug fix, refactor, migration, integration, performance, security, or test work.
- **Risk**: local logic, shared library, persistence, cross-service/cross-module contract, asynchronous flow, authentication, data isolation, or production data. Risk drives how much you verify (see the verification playbook's tiers).
- **Owner**: which module/service owns the behavior, and which contract or boundary the change lives behind. Read [references/ownership-and-context.md](references/ownership-and-context.md) when the owner or boundary is not obvious from local evidence.
- **Contract surface**: any user-visible behavior or internal contract being altered.
- **Policies in play**: which of the harness gates fire for this change (contract impact, reused-write-path, and whichever project-declared policy gates apply).

### Step 2 — Build the harness portrait

Before editing, gather enough context from the target project itself:

- Current branch and local changes, if it is a git repository.
- The stack, architecture, and conventions from `.doninha/docs/codebase/*`, and any policies/overrides in `DONINHA.md`.
- Build tooling and test commands, discovered from the project's declared commands and build files — never invented. See [references/verification-playbook.md](references/verification-playbook.md).
- Entry points and layers relevant to the change: request handlers, error translation, business layer, data access, producers/consumers, clients, mappers, DTOs, migrations, config.
- Existing tests that cover the behavior you are touching.
- Contract artifacts: API specs, DTOs, event/message payloads, migration changelogs, generated or hand-written clients.
- How the project currently handles the concerns the gates cover (data isolation, idempotency, migrations, error translation, logging, secrets) — so you match the local pattern instead of importing a foreign one.

Read [references/backend-harness-gates.md](references/backend-harness-gates.md) for the full gate checklist whenever the change touches persistence, messaging, external APIs, authentication, data isolation, secrets, error handling, asynchronous processes, or shared DTOs.

### Step 3 — Plan the change

Produce a short implementation plan before editing when the task is non-trivial:

- Files most likely to change.
- Contracts or migrations affected, and which gates fire.
- Verification commands and coverage to run.
- Open assumptions and unresolved risks.

### Step 4 — Implement the smallest coherent slice

Apply the narrowest change that satisfies the request:

- Follow the project's local naming, packaging, error-handling, and transaction patterns. Naming is not a matter of taste here: the contract was resolved before code existed (`doninha-desenvolver` step-03 §4.0, recorded in the PBI's `spec.md` under **Decisões técnicas**). Read it and follow it. Absent that — this skill invoked outside the dev flow — apply `doninha-ubiquitous-language` §0: the project's real code and `conventions.md` outrank every default, and a codebase with no clear pattern is a question, not a free choice.
- Keep business rules out of entry-point adapters; keep data access in the layer the project designates for it.
- Update every affected contract edge in the same slice. When a new field enters a DTO on a reused update/upsert path, confirm it is actually persisted on the update branch — this is the **reused-write-path gate (BLOCKING)** in the gate reference.
- Add or update tests next to the existing coverage.
- Apply the project-declared policy gates that fire (data isolation, migrations, idempotency, error translation, logging, secrets) using the project's own patterns.
- Avoid opportunistic refactors unless they directly reduce risk in the requested change. Do not revert unrelated user changes; work around them or stop if they block the task.

### Step 5 — Verify the harness

Choose commands using [references/verification-playbook.md](references/verification-playbook.md):

- Prefer repo-declared commands; inspect build files before inventing any command.
- Match verification depth to the risk tier from step 1.
- Cover the persisted shape, contract edges, and any policy behavior the change touched, following the project's declared verification/coverage policy.
- If a command cannot run locally, report the exact blocker and provide the most relevant manual-validation checklist. Do not claim verification you did not run.

### Step 6 — Hand off cleanly

Finish with the handoff report below.

## Handoff report schema

Return this to the caller (`doninha-desenvolver` or the user). Keep it concise and factual:

- **What changed and why** — the outcome delivered, in one or two lines.
- **Files touched** — the files created or modified.
- **Verification run + result** — exact command(s) executed and whether each passed, failed, or was blocked. State plainly if only static inspection was done.
- **Coverage or exact blocker** — coverage achieved against the project's declared policy, or the exact reason it could not be measured/run.
- **Residual risks** — anything not proven by the verification run, plus any manual validation still needed.
- **Follow-ups** — migrations, environment variables, credentials, documentation, or deploys still required.

## Worked examples

The domains below (`orders`, `accounts`) are neutral placeholders. In a real task, replace them with the actual modules from the project's codebase docs.

### Example 1 — Backend bug fix

User says: "Fix the backend bug where the cancellation reason on an order is not saved."
Actions:

1. Classify: bug fix, persistence risk. Identify the `orders` module and the entry points that update an order.
2. Build the harness portrait: read the update path (handler → business layer → data access) and nearby tests from the codebase docs and local code.
3. Fire the gates: because a value flows into a reused update path, apply the **reused-write-path gate** — read the body of the persistence/update method and confirm the reason field is written on the update branch (a mapper that ignores unset fields, or an update that omits the column, is the usual root cause).
4. Fix the smallest logical path and add a regression test asserting the field is persisted.
5. Verify with the project's declared test command at the risk tier, then hand off.

Result: a fix that closes the actual save gap, with a regression test and a clear verification result.

### Example 2 — Cross-module API contract change

User says: "Add a new field to the accounts API so another module can consume it."
Actions:

1. Classify: cross-module contract work — the **contract-impact gate** fires.
2. Read the ownership heuristic and the gate checklist; identify producer and consumer.
3. Update the domain/DTO/mapper/handler on the producer side, applying whichever project-declared policy gates fire (data isolation, migrations, error translation, logging) using the project's patterns.
4. Update the consumer expectation in the same work item, **or** explicitly document why the consumer stays compatible.
5. Add or update tests covering the new contract shape and hand off with the contract impact noted.

Result: a change that keeps contract integrity intact and documents its cross-module impact.

## Troubleshooting

### Missing codebase docs

If `.doninha/docs/codebase/*` does not exist, degrade gracefully: apply the **universal gates** (contract-impact and reused-write-path) plus direct inspection of the repo (build files, nearby code and tests), and warn the caller which context is missing. Never block on the docs being absent.

### Local harness absent

If build files or test commands are missing, infer from neighboring modules only after reading local documentation. Tell the user what was inferred and keep verification conservative.

### Tests failing outside the change

If unrelated tests already fail, do not hide it. Report the failing command, the unrelated failure signal, and any targeted verification that still passed.

### Ambiguous ownership

If the request could belong to more than one module, use [references/ownership-and-context.md](references/ownership-and-context.md) and inspect call sites. If ambiguity remains after local evidence, ask one concise ownership question before editing.

## Language

Skill instructions (this file, references, agents) are in **English**. Facilitation with the user and any generated artifacts are in **Portuguese (PT-BR)**, per Doninha convention. Quote user-facing message examples in their original language when relevant.
