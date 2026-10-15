# Headless Mode JSON Schemas

Every headless run terminates with one of these payloads. Omit the keys for artifacts that were not produced. `{doc_workspace}` is the caller-supplied PBI folder — the `design`, `experience`, and `decision_log` paths point inside it.

## Common fields

- `status` — `"complete"`, `"blocked"`, or `"partial"`
- `intent` — `"create"`, `"update"`, or `"validate"` (matches the detected intent)
- `reason` — required when `status` is `"blocked"`; one-sentence explanation
- `assumptions` — array of inferred values not directly confirmed by the inputs
- `open_questions` — array of items needing a human decision before the artifact can be considered final

## Create

```json
{
  "status": "complete",
  "intent": "create",
  "design": "{doc_workspace}/DESIGN.md",
  "experience": "{doc_workspace}/EXPERIENCE.md",
  "decision_log": "{doc_workspace}/.decision-log.md",
  "working_artifacts": ["{doc_workspace}/.working/color-themes-1.html"],
  "promoted_artifacts": {
    "mockups": ["{doc_workspace}/mockups/direction-calm-sage.html"],
    "wireframes": ["{doc_workspace}/wireframes/ia-2026-05-19.excalidraw"]
  },
  "open_questions": [],
  "assumptions": [],
  "external_handoffs": [
    {"directive": "External doc-store upload", "tool": "corp:doc_upload", "url": "https://docs.example.internal/DESIGN/123", "status": "ok"}
  ]
}
```

The `working_artifacts` and `promoted_artifacts` keys are optional and omitted entirely when empty. Headless Create runs do not enable creative tools by default — both keys are usually absent from headless output unless the caller explicitly enabled them.

## Update

```json
{
  "status": "complete",
  "intent": "update",
  "design": "{doc_workspace}/DESIGN.md",
  "experience": "{doc_workspace}/EXPERIENCE.md",
  "decision_log": "{doc_workspace}/.decision-log.md",
  "changes_summary": "1-3 sentences describing what changed and why",
  "conflicts_with_prior_decisions": [],
  "open_questions": [],
  "external_handoffs": [
    {"directive": "External doc-store upload", "tool": "corp:doc_upload", "url": "https://docs.example.internal/DESIGN/123", "status": "ok"}
  ]
}
```

## Validate

```json
{
  "status": "complete",
  "intent": "validate",
  "validation_report": "{doc_workspace}/validation-report.md",
  "findings_summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "offer_to_update": true
}
```

`validation_report` is always generated for Validate intent — the path here is required, not optional.

## Blocked

```json
{
  "status": "blocked",
  "intent": "update",
  "reason": "Ambiguous change signal — could be a visual-identity update or a response to an accessibility audit; no direction inferred"
}
```

Always include the intent (best guess when uncertain) and a one-sentence `reason`.
