# Implement

Use to execute planned or quick work.

Start every Execute phase by listing atomic steps inline. If the list becomes more than 5 steps or has complex dependencies, stop and create `tasks.md`.

Workflow:

1. Load the smallest needed context.
2. Confirm target task and requirement IDs.
3. Edit code.
4. Run task-specific verification.
5. Update task status and local `STATE.md`.
6. Commit atomically when requested or when workflow requires commits.

Rules:

- Do not mix unrelated tasks in one implementation step.
- Record `SPEC_DEVIATION` if implementation intentionally differs from spec.
- Preserve user changes in the worktree.
