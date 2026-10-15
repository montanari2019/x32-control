# Ownership and context

Read this file when the owning module/service or the boundary a change lives behind is not obvious, and to learn how to build the harness portrait from the target project's own documentation.

This skill ships **no concrete service map**. There is no fixed topology of named services here — a topology only fits the one project it was written for and rots the moment that project changes. Ownership is always derived, at runtime, from the target project's own code and docs.

## Building the harness portrait from `.doninha/docs/codebase/*`

Before editing, read the codebase docs produced by `doninha-project-research` and the policies in `DONINHA.md`, and extract:

- **Modules/services and their responsibilities** — what each owns, and where its boundaries are.
- **Layers** — how the project separates entry-point adapters, business rules, and data access, and how strictly.
- **Stack** — languages, frameworks, persistence, and messaging actually in use (so gates are applied with the project's own mechanisms, not imported ones).
- **Contracts** — where APIs, DTOs, events, and schemas are defined, and who produces/consumes them.
- **Policies** — which harness policy gates the project declares (isolation, idempotency, migrations, error translation, logging, secrets, verification/coverage), with their exact rules and thresholds.
- **Commands** — declared build, test, and coverage commands (see [verification-playbook.md](verification-playbook.md)).

Cross-check the docs against the local code you are about to touch: build files, nearby modules, existing tests, and call sites. When the docs and the code disagree, prefer the code as the immediate source of truth and note the drift in the handoff.

If `.doninha/docs/codebase/*` is missing, degrade: inspect the repo directly (build files, module layout, nearby code and tests) to build the portrait, apply the universal gates, and warn the caller which context is unavailable.

## Ownership questions (heuristic)

Ask a concise ownership question **only when local evidence does not already answer it**. First try to resolve ownership from the codebase docs and call sites; ask the user only if ambiguity remains. Useful questions to resolve which module/service owns a behavior:

- Which module currently exposes or persists the field/event/status being changed?
- Is the source of truth the core domain, or an integration/adapter layer?
- Is this an edge/API concern, or a domain-contract concern?
- Is the behavior owned by authentication/identity, or by a business workflow?
- If the answer spans two modules, which one is the producer and which is the consumer of the contract in question?

Resolve ownership from evidence first; a single well-placed question is a last resort, not a first step.
