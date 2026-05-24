# Brownfield Mapping

Use when working in an existing codebase before planning major changes.

Create `.specs/codebase/` docs:

- `STACK.md`: frameworks, runtime, package managers, platform versions.
- `ARCHITECTURE.md`: app shape, layers, data flow, module boundaries.
- `CONVENTIONS.md`: naming, styling, testing, folder patterns.
- `STRUCTURE.md`: important directories and ownership.
- `TESTING.md`: commands, test types, mocks, known gaps.
- `INTEGRATIONS.md`: external APIs, services, native modules.
- `CONCERNS.md`: fragile areas, tech debt, risks.

Verification:

- Docs cite actual files and commands.
- Unknowns are explicit.
- No speculative architecture is presented as fact.
