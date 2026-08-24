# Context Limits

Target less than 40k tokens loaded for planning context.

Rules:

- Load global project memory first.
- Load local feature/domain memory second.
- Load only the active feature spec/design/tasks.
- Do not load multiple feature specs together.
- Summarize large docs instead of pasting them.

When context exceeds target, report:

```txt
Context status: high
Loaded:
Need next:
Will avoid:
```
