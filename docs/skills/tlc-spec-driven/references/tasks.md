# Tasks

Use for Large/Complex features or when inline Execute reveals more than 5 steps.

Each task should be atomic:

```txt
- [ ] T-001: Short title
  Reqs: REQ-001, REQ-003
  What: exact outcome
  Where: files/modules
  Depends on: T-000 or none
  Reuses: existing helpers/patterns
  Done when: observable criteria
  Tests: commands or manual checks
  Gate: required pass condition
```

Rules:

- Keep each task independently verifiable.
- Mark parallelizable tasks with `[P]` only when write scopes do not overlap.
- Include verification criteria before implementation starts.
