# Gap Routing — Backend / Frontend / UX

**Goal**: Decide, for any task, whether it touches backend, frontend, or UI/UX — and which specialist skill (`doninha-backend`, `doninha-frontend`, `doninha-ux`) to invoke — without ever baking a stack-specific keyword table into this skill.

This reference has **no keyword table**. It is a procedure. Every project derives its own stack→skill map at runtime, from its own docs. A project that adds a new language, framework, or layer next month needs zero changes here.

---

## Why No Keyword Table

A hardcoded table ("language X → backend", "framework Y → frontend") only works for the stack it was written for. It rots the moment a project's stack changes, and it doesn't generalize across projects with different languages, frameworks, or architectural styles. Instead, `doninha-desenvolver` reads what the *target project* says about itself and derives the mapping fresh, every time it's needed.

---

## Step 1: Derive the Stack→Skill Map (Runtime, Per Project)

Before routing any task, build a mapping from **task domain** to **specialist skill**, sourced entirely from the target project's own codebase docs.

### Source — Codebase docs

Read `.doninha/docs/codebase/*` — the output of `doninha-project-research` (stack, architecture, and conventions docs describing the project's actual languages, frameworks, layers, and services). Start at `OVERVIEW.md` when it exists: its **module map** already names each module, its path and its role, which is usually enough to classify a task without opening anything else. From these, identify:

- Which layers/modules/services represent backend concerns (APIs, services, databases, queues, schedulers, backend business logic)
- Which layers/modules/services represent frontend concerns (screens, components, UI state, client-side routing)
- Whether the project has a dedicated design/UX layer or process already described

If `.doninha/docs/codebase/*` doesn't exist yet — or `OVERVIEW.md` is absent — treat this as a GAP: recommend running `doninha-project-research` first, or ask the user directly which layers map to which concern before proceeding. There is no project-level override config for this map — if the codebase docs are ambiguous for a given task, ask the user rather than guessing.

**Where that question gets asked depends on when the ambiguity shows up.** At planning time (Checkpoint 1, step-03 §3) it is not asked inline: it goes into step-03 §4's consolidated doubt batch, so the user answers every routing ambiguity in one place instead of one interruption per module. At execute time (Checkpoint 2, step-04 §4.0) the batch has long closed and the codebase may have shifted since — there it stays what it has always been, a per-task stop-and-ask. Either way the rule is the same: never guess a routing.

A missing **module doc** is not a GAP: `modules/` is conditional and incremental, and a map row with `—` in the `Doc` column means that module has not been researched yet. Classify from the map row plus the real code; you may suggest researching that single module, but never block routing on it.

### Result: the derived map

The output of Step 1 is a mapping, held only in the current session (never persisted as a config file, never hardcoded here):

| Task domain | Specialist skill |
| --- | --- |
| Touches an API, service, database, queue, scheduler, or backend business logic | `doninha-backend` |
| Touches a screen, component, client-side state, or other UI-rendering code | `doninha-frontend` |
| Touches a user-facing flow that lacks an approved interaction/visual contract | `doninha-ux` |

The left column is a **domain description**, not a stack keyword — it is evaluated against whatever the project's own codebase docs say its layers/services actually are. **Zero keyword table is hardcoded in this reference file** — the concrete stack→skill correspondence (which language, framework, or folder counts as "backend" or "frontend" for a given project) is derived fresh from that project's `.doninha/docs/codebase/*`, never baked in here.

---

## Step 2: Two Routing Checkpoints

Routing happens twice — the map can shift between planning and execution (codebase evolves, a planning-time guess needs re-confirmation), so never trust a stale routing decision.

### Checkpoint 1 — Planning time

While generating `spec.md`/`task.md` for a PBI:

1. For each task, apply the derived map (Step 1) to determine its domain(s).
2. Record the resulting skill(s) in that task's `Tools`/`Skill` field.
3. Aggregate the full set of skills used across the PBI into the session tracker's `skills_necessarias` list.

A task can map to more than one skill (e.g., a full-stack task spanning backend and frontend) — record all of them.

### Checkpoint 2 — Execute time

At the start of each task's implementation loop, **before reading or writing any code for that task** ("Step 0"):

1. Re-run the routing check for that specific task against the current codebase state.
2. If the result matches the planning-time assignment, proceed and invoke the mapped skill(s).
3. If it diverges (stack shifted, planning-time guess was wrong), invoke the newly-derived skill(s) instead and note the change — don't silently keep executing under the stale assignment.

This checkpoint is mandatory even when planning already assigned a skill — it is a re-check, not a formality.

---

## Rule: Ordering Within a PBI (AD-004)

Within the same PBI, **backend tasks are ordered and executed before frontend tasks**. When building the execution plan/dependency graph, place all backend-domain tasks ahead of frontend-domain tasks, regardless of the order they were originally listed. This applies both to the plan generated at planning time and to the actual execution sequence at execute time.

---

## Rule: UI Gap Requires `doninha-ux` First (AD-004, DEV-06)

Before any frontend task in a PBI is generated or implemented, check whether that PBI/task has a **UI gap** — i.e., it touches a screen or component.

If it does, and the PBI's folder does **not** already contain both a `DESIGN.md` and an `EXPERIENCE.md` (the dual-contract artifact pair):

1. Invoke `doninha-ux` **first**, before generating or implementing any frontend task in that PBI.
2. Wait for `doninha-ux` to produce the `DESIGN.md`/`EXPERIENCE.md` pair.
3. Only then generate/implement the PBI's frontend tasks, using that pair as the contract.

If the pair already exists for the PBI, skip straight to routing the frontend tasks to `doninha-frontend` — don't re-invoke `doninha-ux` redundantly.

---

## Rule: Degradation When a Specialist Skill Is Missing (DEV-10)

If the skill mapped for a task's domain (`doninha-backend`, `doninha-frontend`, or `doninha-ux`) is not installed in the current environment:

1. Warn the user once that the specialist skill is missing and its domain-specific guidance won't be applied.
2. Do **not** block the task.
3. Continue applying the generic implementation discipline described in `implement.md` (RED → GREEN → VERIFY → COMMIT, gate checks, atomic commits) instead.

Missing a specialist skill degrades quality of domain-specific guidance — it never halts delivery.

---

## Explicitly Out of Scope: "Frontend Target Gate"

Discard, and do not reintroduce, any concept of a **"Frontend Target Gate"** — a step that chooses between two or more coexisting frontends by name or path when a project happens to maintain more than one. That concept belonged to a specific predecessor project's fixed pair of named frontend codebases and does not generalize.

This generic skill has no notion of a project having a fixed, enumerable set of named frontends. If a project's codebase docs describe multiple frontend surfaces, resolving which one a task targets is a **codebase-specific detail** to surface via Step 1 above — not a dedicated gate mechanism in this reference.

---

## Tips

- Re-deriving the map is cheap (a few doc reads) — don't cache it across sessions or PBIs, since the codebase can change between them.
- If `.doninha/docs/codebase/*` is thin or missing entirely, prefer asking the user over guessing — a wrong routing decision cascades into the wrong specialist skill's conventions being applied to the wrong code.
- Log which domain/signal drove each routing decision in the task's notes — makes Checkpoint 2's re-check meaningful and debuggable later.
