---
name: doninha-task-writing
description: >
  Guides the creation of task files (.md) for code agents in the Doninha project.
  Use this skill whenever filling a task file (e.g. pbis/{pbi-slug}/tasks/task-NN.md) created by the planner.
  It defines the required structure, density rules, anti-redundancy constraints,
  and per-section writing instructions to produce optimized, high-signal task files.
---

# Doninha Task Writing

This skill governs how task files are written. Its goal is **maximum information density with minimum token volume** — every sentence must add context the code agent cannot infer from the codebase alone.

---

## Golden Rules

1. **One source of truth per piece of information.** If a constraint is stated in `Scope.Out`, it must not reappear in `Implementation` or `Acceptance Criteria`.
2. **Reference, don't repeat.** If an existing file in the repo demonstrates the pattern, point to it. Do not re-document what the code agent can read directly.
3. **State only divergences.** In `Implementation`, describe only what differs from the reference pattern. Everything inferrable from the reference is omitted.
4. **Acceptance Criteria is the single behavioral contract.** Do not create separate `Validation Strategy`, `Success Criteria`, or `Test Cases` sections — they duplicate what belongs here.
5. **No boilerplate sections.** `Final Considerations`, `Implementation Intent`, and generic architecture reminders belong in `agents.md`, not in task files.
6. **Omit optional sections when empty.** A section with nothing non-obvious to say should not exist.

---

## Required Structure

Use this exact section order. Sections marked `[optional]` must be omitted when they add no value.

```
# TASK-[SERVICE]-[ID] — [Short, precise title]

**Root**: `services/[service-name]/`
**Branch**: `feature/TASK-[SERVICE]-[ID]-[slug]`
**Spec**: `.doninha/specs/[spec-slug]/spec.md`
**Part**: [N of N — label]
**Generated**: `YYYY-MM-DD`

## Context
## Scope
## Ubiquitous Language   [optional]
## Files
## Implementation
## Acceptance Criteria
## Authorization         [optional]
## API Notes             [optional]
## Dependencies
```

---

## Section-by-Section Instructions

### Header block
- `Root` must be the full service path, not just the service name.
- `Branch` follows the convention `feature/TASK-[SERVICE]-[ID]-[slug]`.
- `Part` is required when a spec is split across multiple tasks (e.g. `1 of 2 — Individual Deletion`).

---

### Context
- **Length**: 2–3 sentences maximum.
- **Content**: What is being built + why it exists + the single most important constraint or pre-existing condition.
- **Do not** summarize the full spec here. Link to it instead.
- **Do not** repeat constraints that will appear in `Scope.Out`.

```markdown
## Context
Implement individual artifact deletion in both list and grid views.
The API endpoint and `useDeleteArtifact` hook already exist — frontend only.
See spec: `.doninha/specs/001-delete-artifact/spec.md`.
```

---

### Scope
- `**In:**` — bullet list of what must be delivered.
- `**Out:**` — bullet list of what must NOT be touched. Always present. This is as important as `In`.
- Be explicit about neighboring concerns: other tasks in the same spec, layers not to touch, files not to modify.

```markdown
## Scope
**In:** Deletion button in list view, context menu in grid view, confirmation modal, role guard.
**Out:** Do not touch auth layer. No payment logic (TASK-06). Tests covered in TASK-07.
```

---

### Ubiquitous Language *(optional)*
- Include only when the feature involves domain terms whose code mapping is **non-obvious from the codebase**.
- Omit terms like `toast.success(...)` or `Button` — these are stack-level, not domain-level.
- Omit entirely if all terms are inferrable.

| Business Term | Code Mapping |
|---|---|
| [Term] | [Type / service / enum / endpoint] |

---

### Files
- One row per file. Three columns: `Action`, `Path` (full from service root), `Why` (≤5 words).
- Actions: `create`, `modify`, `delete`.
- Do not describe the file's full purpose here — that belongs in `Implementation`.

| Action | Path | Why (≤5 words) |
|---|---|---|
| `create` | `src/components/artifacts/delete-artifact-modal.tsx` | individual deletion modal |
| `modify` | `src/app/(app)/products/[productId]/artifacts/page.tsx` | integrate new components |

---

### Implementation
- Organized per file, matching the order in `Files`.
- **For each file**, state:
  - `**Reference pattern**`: the closest existing file the agent should mirror.
  - `**Differences from reference**`: bullet list of only what diverges — props, constraints, non-obvious decisions.
- Never re-document the full component. Never list imports the agent can infer from the reference.
- Use inline code snippets only when the divergence is ambiguous without one.

```markdown
### `delete-artifact-modal.tsx` *(create)*
**Reference pattern**: `src/components/products/delete-product-modal.tsx`
**Differences from reference**:
- Props: `artifact: { id: string; name: string } | null` instead of `product`
- Calls `useDeleteArtifact(productId)` from `@/modules/artifacts/hooks`
- Modal body: "The artifact **[name]** will be permanently deleted." (`<strong>` on name)
- Render nothing (early return) when `artifact === null`

### `artifact-card.tsx` *(create)*
**Reference pattern**: inline card block in `artifacts/page.tsx` (grid section)
**Differences from reference**:
- Wrap in `<div className="relative group">` — Link stays inside covering the full card area
- Overlay `DropdownMenu` at `absolute top-2 right-2 z-10`, rendered only when `canDelete`
- Trigger: `Button variant="ghost" size="icon"` with `MoreVertical`, classes `opacity-0 group-hover:opacity-100 transition-opacity`
- Trigger onClick: `e.preventDefault(); e.stopPropagation()` — prevents Link navigation
- Single `DropdownMenuItem` with `className="text-destructive focus:text-destructive"`, calls `onDeleteClick({ id, name })`
```

---

### Acceptance Criteria
- **This is the single behavioral contract.** Do not create Validation Strategy, Success Criteria, or Test Cases sections.
- Use Given/When/Then for behavioral scenarios.
- Negative cases (role restrictions): verify by DOM absence, not by style or visibility.
- Error cases: always specify what remains unchanged after failure.
- Edge cases: one line each.

```markdown
## Acceptance Criteria
- [ ] **Given** user with `role !== "member_viewer"` views the table, **When** rendered, **Then** each row has a `Trash2` delete button in the actions column.
- [ ] **Given** delete button clicked, **When** modal opens, **Then** `artifact.name` appears in the confirmation text.
- [ ] **Given** modal open, **When** user confirms, **Then** artifact removed from list, modal closes, `toast.success` fires.
- [ ] **Given** modal open, **When** user cancels, **Then** modal closes, no API call made, artifact remains.
- [ ] **Given** API returns error, **When** mutation fails, **Then** `toast.error` fires, artifact remains in list.
- [ ] `member_viewer` — delete button and context menu icon must be absent from DOM (not hidden).
- [ ] Grid card hover — `MoreVertical` icon appears with opacity transition; clicking does not trigger Link navigation.
- [ ] Last artifact deleted → list renders existing `EmptyState` component.
```

---

### Authorization *(optional)*
- Omit if authorization is fully expressed in `Acceptance Criteria` and `Scope.Out`.
- Include only when there are multiple roles, backend enforcement details, or non-obvious rules.
- One line per rule.

```markdown
## Authorization
- `account_owner | account_admin | member_editor` → delete controls rendered and functional.
- `member_viewer` → controls not rendered in DOM; backend enforces via `@Roles(...)`.
```

---

### API Notes *(optional)*
- Omit if the endpoint is already documented in `CONTRACT_API_WEB.md` with no divergence.
- Include when: endpoint behavior is non-obvious, response shape affects UI logic, or error codes drive specific UI states.

```markdown
## API Notes
- **Endpoint**: `DELETE /artifacts/:artifactId`
- **Input**: auth headers only, no body.
- **Success**: `200` — `{ success: true, data: null }`
- **Errors**: `404` — artifact not found; `403` — insufficient role.
```

---

### Dependencies
- Always present, even if `none`.
- `Requires`: tasks that must be complete before this one can start, with a note on what they provide.
- `Blocks`: tasks that cannot start until this one is done.

```markdown
## Dependencies
- **Requires**: TASK-WEB-081 (Prisma schema + artifact model), TASK-WEB-082 (auth middleware)
- **Blocks**: TASK-WEB-086 (bulk deletion), TASK-WEB-087 (artifact module tests)
```

---

## Anti-Patterns (Never Do)

| Anti-Pattern | Why It's Wrong |
|---|---|
| Repeat `Scope.Out` constraints in `Implementation` | Creates two sources of truth; agent may follow one and miss the other |
| Add `Final Considerations` section | Generic architecture reminders belong in `agents.md`, not tasks |
| List imports the agent can infer from a reference file | Adds tokens with zero informational value |
| Create `Validation Strategy` or `Success Criteria` as separate sections | Duplicates `Acceptance Criteria`; splits the behavioral contract |
| Write `Why this priority` inside a task | Planning metadata belongs in the spec, not the execution task |
| Document the full component when a reference exists | The reference is the contract; task states only divergences |
| Leave optional sections with placeholder text | Either fill with real content or omit entirely |

---

## Granularity Check

Before finalizing, verify:

- The task is a **cohesive unit of work** — it groups the files that together deliver one capability. **No rigid file-count limit.** Split only when a part is independently shippable or blocks parallelization.
- Every `Acceptance Criterion` is **objectively verifiable** — no "clean", "correct", or "well-structured".
- Every constraint in `Implementation` is something the agent **cannot infer** from the reference file + codebase.
- The task can be implemented **without requiring context from another open task** (dependencies are complete, not in-progress).