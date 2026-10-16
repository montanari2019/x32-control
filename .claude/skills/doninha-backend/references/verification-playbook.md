# Verification playbook

Read this file when choosing verification commands for a backend change.

Verification is governed by the target project's own declared policy (in `DONINHA.md` and `.doninha/docs/codebase/*`). This playbook is about **how to discover the right commands and how much to run at each risk level** — it never mandates a specific test framework, coverage tool, or coverage number. Any tool named below is one option in a discovery list, not a requirement.

## Command discovery

Prefer commands **declared by the repository**. Inspect build files and project documentation before inventing any command.

- Read the project's declared test/build commands from its documentation, task scripts, or CI config first.
- Inspect the build/manifest file for the ecosystem in use before running anything. Examples of where declared commands live, across ecosystems (illustrative, not exhaustive): a build tool's targets, a package manifest's script section, a `Makefile` or task-runner file, a CI pipeline definition.
- Illustrative build/test entry points you might discover include, among many others: `mvn`/`gradle` targets (JVM), `npm`/`pnpm`/`yarn` scripts (Node), `pytest`/`tox` (Python), `go test` (Go), `cargo test` (Rust), `dotnet test` (.NET). Discover which one this project actually uses — do not assume.
- When the project declares a coverage tool (JaCoCo, `coverage.py`, `nyc`, and the like are examples only), run the command that measures coverage for the scope the project's policy names.

Use the project's documentation whenever it defines a narrower or mandatory command. Never claim a command is "the" test command until you have found it declared in the repo.

## Risk-based verification

Match verification depth to the risk tier established during classification (step 1 of the routine).

**Low risk** — pure-local computation or a mapping change:

- Run targeted tests for the class/module touched.
- If the project declares a coverage bar for this scope, confirm it for the changed unit.

**Medium risk** — business-layer orchestration, a data-access query, DTO mapping, an isolation filter, error translation, logging with an identifier, or a validation change:

- Run targeted tests plus the package/module's tests when practical.
- Cover external dependencies, data access, producers/consumers, idempotency mechanism, and any context/isolation the change touches with the project's testing approach (mocks/stubs or the project's declared style).

**High risk** — a migration, authentication, data isolation, an API contract, an event/message payload, an idempotent async process, a terminal-failure path, an external client, a shared DTO, secrets/configuration, or cross-module sync:

- Run targeted tests, the package/module tests, and coverage measurement when the project provides it.
- Provide manual-validation steps for anything that cannot be proven by automated tests at this stage.

## Test rules

- Create or adjust tests for new implementation, following the project's declared testing conventions and frameworks.
- Cover the behavior the change touched: local rules, the persisted shape (the reused-write-path gate), contract edges, isolation/idempotency/error-translation behavior when those policies are declared.
- Meet the coverage scope and bar the project declares — the project owns the number and the scope, not this skill.
- Do not add integration or end-to-end tests, or real database/broker dependencies, unless the project's policy calls for them or the user explicitly changes the policy.

## Reporting

Report verification in the final handoff:

- Command executed.
- Result: passed, failed, or blocked.
- Coverage achieved for the scope the project declares, when measurable.
- If it failed: the first relevant failure and whether it looks related to the change.
- If it was blocked: the missing dependency or permission, and the remaining manual validation.

**Do not claim the harness was verified if only static inspection was performed.** Inspection is not verification; say so plainly when that is all that was possible.
