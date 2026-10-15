# TASK-[SERVICE]-[ID] — [Short, precise title] [P]

> Append `[P]` only if this task can run in parallel with other `[P]` tasks of the same feature.
> See `tasks/_overview.md` § Parallel Execution Map.

**Root**: `services/[service-name]/`
**Branch**: `feature/TASK-[SERVICE]-[ID]-[slug]`
**Feature**: `.doninha/specs/module_NNN_<name>/feature_NNN_<name>/`
**Spec**: `spec_context.md`
**Part**: [N of N — label]
**Generated**: `YYYY-MM-DD`

---

## Task Metadata

| Field | Value |
|---|---|
| **Depends on** | _List of TASK-IDs that must complete before this one starts (e.g. `TASK-AUTH-001, TASK-AUTH-002`). Use `none` if there are no prerequisites._ |
| **Reuses** | _Existing files/functions/components this task reuses (e.g. `src/shared/http/client.ts:fetchJson`, `src/components/Modal/index.tsx`). Use `none` if nothing is reused._ |
| **Requirement** | _Traceable IDs from `spec_context.md` covered by this task (e.g. `HU-01, CA-01, CA-02, RN-03`)._ |
| **Tests** | _Required test type — `unit` / `e2e` / `integration` / `none`. Drives the gate command. Cross-check `.doninha/docs/codebase/TESTING.md` Test Coverage Matrix._ |
| **Gate** | _Gate level — `quick` / `full` / `build`. See "Done when" below for the actual command._ |
| **Tools (MCPs / Skills)** | _Doninha MCPs and skills this task will invoke (e.g. `doninha-code-practices`, `doninha-quality-gate`; add `complexity-check` / `sonar-run` only when enabled in `.doninha/integrations/quality-gate.yml`)._ |

---

## Context

[2–3 sentences max. What + why + the single most important constraint.
Link to `spec_context.md` (and `context_decisions.md` if Discuss was triggered).
Do NOT repeat content already in the spec.]

---

## Scope

**In:** [Bullet list of what MUST be done]
**Out:** [Bullet list of what MUST NOT be touched — be explicit]

---

## Ubiquitous Language

> Omit this section if all terms are inferrable from the codebase.

| Business Term | Code Mapping |
|---|---|
| [Term] | [Type / service / enum / endpoint] |

---

## Files

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/components/foo/bar.tsx` | new confirmation modal |
| `modify` | `src/app/.../page.tsx` | integrate new components |
| `create` | `src/components/foo/bar.spec.tsx` | unit tests for modal |

---

## Implementation

> Per-file. State only what **diverges** from the reference pattern.
> Reference existing files instead of re-documenting known patterns.

### `[filename].tsx` *(create)*

**Reference pattern**: `src/components/[closest-existing-pattern].tsx`
**Differences from reference**:
- Props: `[propName]: [Type]` instead of `[other]`
- [Any constraint that cannot be inferred from the codebase]
- [Any non-obvious decision — e.g. "use `decimal`, not `float`, for monetary values"]

### `[filename].tsx` *(modify)*

**Reference pattern**: `src/[path-to-state-pattern].tsx` (state control pattern)
**Changes**:
- Add state: `const [target, setTarget] = useState<{ id: string; name: string } | null>(null)`
- Add conditional render of `<[NewModal]>` after the list block
- [Other specific change — reference line or block, not the full file]

---

## Acceptance Criteria

> Single source of truth for expected behavior. No duplication elsewhere.
> Mapped to CA-XX in `spec_context.md` (see **Requirement** above).

- [ ] **Given** [context], **When** [action], **Then** [verifiable outcome] _(CA-01)_
- [ ] **Given** [context], **When** [action], **Then** [verifiable outcome] _(CA-02)_
- [ ] [Negative case] — `[role]` must NOT see `[element]` (verify by DOM absence, not style)
- [ ] [Error case] — API error → `toast.error(...)`, entity remains in list
- [ ] [Edge case] — [scenario]: [expected outcome]

---

## Done When

Verifiable outcomes. Each item must be testable. Update `tasks/_overview.md` status only when ALL are checked.

- [ ] All acceptance criteria above pass (manual or automated check)
- [ ] All co-located tests are written and pass (no `.skip`, `.only`, or `xfail`)
- [ ] Test count: `[expected_count]` tests pass (no silent deletions vs. baseline)
- [ ] Gate check passes at level **`<quick|full|build>`**:
  - `quick` → the project's own lint/compile + the tests of the touched files pass (commands from `TESTING.md`); scoped `doninha-quality-gate` at `per-task` has no open finding
  - `full`  → all of the above + the full test suite passes
  - `build` → all of the above + project build succeeds
- [ ] _[only when `complexity: true` in `.doninha/integrations/quality-gate.yml`]_ `complexity-check(path, threshold)` reports nothing above threshold in the touched files
- [ ] _[only when `sonar: true` in `.doninha/integrations/quality-gate.yml`]_ No new SonarQube issues at `Blocker` / `Critical` severity (closeout gate)
- [ ] Conventional Commits message drafted (see below)
- [ ] `tasks/_overview.md` updated: status `Pending → InProgress → Done` + commit hash

---

## Commit Message (Conventional Commits 1.0.0)

> One task = one atomic commit. Type prefixes: `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `perf`, `build`, `ci`, `chore`.

```
<type>(<scope>): <description>

Refs: TASK-[SERVICE]-[ID], HU-XX, CA-XX
```

Example:

```
feat(auth): add email validation to login form

Refs: TASK-AUTH-001, HU-01, CA-01, CA-02
```

---

## Authorization

> Only if non-trivial. One line per rule.

- `[role_a] | [role_b]` → can perform `[action]`
- `[role_c]` → [control] not rendered in DOM; backend enforces via `@Roles(...)`

---

## API Notes

> Omit if endpoint is already documented and no divergence exists.

- **Endpoint**: `[METHOD] /[resource]/:id`
- **Input**: [params or "none beyond auth headers"]
- **Success**: `[status]` — `[response shape]`
- **Errors**: `[4xx]` — [when]; `[4xx]` — [when]

---

## Dependencies

> Mirrors the **Depends on** field above. Kept here for narrative readability.

- **Requires**: [TASK-ID] ([what it provides])
- **Blocks**: [TASK-ID] ([what depends on this])
