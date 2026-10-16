# Backend harness gates

Read this file when a backend change touches persistence, queries, indexes, layering, messaging, external APIs, authentication, data isolation, error handling, logging, dependency wiring, asynchronous processes, secrets, generated contracts, or shared DTOs.

Gates fall into two groups:

- **Universal gates** (always apply): scope & ownership, contract impact, and reused-write-path. These hold for any stack because they are about correctness of the change itself, not about a project policy.
- **Policy gates** (apply only when the project declares them): tenant/data isolation, idempotency, logging/observability, migrations, error translation, async terminal-failure handling, dependency-injection style, secrets, layering strictness, and verification/coverage policy. Each is **optional when not declared** — pull its exact rule from `DONINHA.md` and `.doninha/docs/codebase/*`. If the project is silent on a policy, do not invent a threshold or framework; note the absence in the handoff and follow the closest local pattern.

No fixed numbers, frameworks, or tools appear as mandates below. Any tool named is one of several possible discovery examples, nothing more.

---

## Universal gate: Scope & ownership

- Identify the owning module/service before editing.
- Locate the first entry boundary the change lives behind: an HTTP handler/controller, a queue consumer, a scheduled job, a CLI, a listener, or a public method of the business layer.
- Locate the exit boundary: data access, an HTTP client, a queue producer, a cache, a file, a third-party API, or another module.
- Confirm the change belongs to the current owner. Do not move business rules across boundaries unless the task requires it and the impact is highlighted.
- Follow the project's declared layering: keep entry-point adapters thin and delegate; keep business rules and data access in the layers the project designates.

Use [ownership-and-context.md](ownership-and-context.md) when the owner or boundary is not obvious from local evidence.

---

## Universal gate: Contract impact

**Fires when the change touches an API, DTO, event, schema, or authentication.** Check every affected contract edge:

- Request and response DTOs.
- Mapper behavior and null/absent-field handling.
- API specs or generated clients, when they exist.
- Event/message payload schemas and event names.
- Public methods of the business layer consumed by other modules.
- Error shape, status codes, and business-exception behavior.
- Authentication/authorization expectations on the endpoint.

**Rule:** if a contract changes, update **both producer and consumer in the same work item**, **or** explicitly document why the consumer stays compatible (for example: additive optional field, tolerant reader on the consumer side). Silence is not compatibility — state the reasoning.

---

## Universal gate: Reused-write-path — BLOCKING

**Fires when a new field enters a DTO on a reused update/upsert path** (an endpoint or method that already existed and handled other fields). This is the single highest-value correctness check in backend work: a new field is accepted at the edge, looks wired, and is silently dropped on save because the persistence method never writes it on the update branch.

This gate is **BLOCKING** — do not consider the change complete, and do not report success, until it passes.

Procedure:

1. Trace the field from the DTO through the mapping layer to the persistence method that runs on the **update/upsert** path (not only the create path).
2. **Read the body of that persistence method.** Confirm the new field is actually written on the update branch — assigned to the entity, included in the update statement/column set, and not skipped by null/absent-field handling that treats "unset" as "leave unchanged".
3. Watch for the common failure modes: a mapper that ignores nulls or unmapped fields; an update that enumerates a fixed column set omitting the new one; a partial-update/patch path that copies only a whitelist of fields; a create path that writes the field while the update path does not.
4. Add or extend a test that asserts the field's value **after** an update — cover the persisted shape, not just that the request was accepted.

If you cannot read the persistence body (generated, external, or unavailable), stop and report it as a blocker rather than assuming the write happens.

---

## Policy gate: Tenant / data isolation — optional when not declared

Apply only if the project declares a multi-tenant or data-isolation model (in `DONINHA.md` or codebase docs). When declared, follow the project's own mechanism and identifier names:

- New entities carry the project's isolation field, per its declared convention.
- Object and list lookups triggered by an endpoint filter by the session-scoped isolation value using the project's context mechanism — never trust an isolation identifier taken from the request body when the session already provides one.
- Check repositories, specifications, native queries, filters, pagination, projections, and reports for correct scoping.
- Add a test proving the query/service scopes correctly and does not leak across isolation boundaries.

If the project declares no isolation model, skip this gate and note it.

---

## Policy gate: Idempotency — optional when not declared

Apply only when the project declares idempotency expectations for asynchronous or retryable processing. When declared:

- Validate idempotency before executing side effects, using the project's declared mechanism and store.
- Derive a stable idempotency key from event/message/order/entity identifiers.
- Set a retention window compatible with reprocessing and follow the local lock/marker pattern.
- Preserve idempotency across reprocessing; avoid side effects before the check passes.

---

## Policy gate: Logging & observability — optional when not declared

Apply per the project's declared logging conventions. When declared:

- Log at the boundaries of new or changed methods with a useful correlation/request/message identifier.
- For consumers, schedulers, and async processes, include topic/queue, idempotency key, and message identifier when available.
- Never log secrets, tokens, credentials, sensitive personal data, or full payloads without operational need.
- Declare a logger following the project's local pattern when a compatible one is absent.

---

## Policy gate: Migrations — optional when not declared

Apply per the project's declared schema-change tooling and conventions. When declared:

- Make schema changes exclusively through the project's declared migration mechanism (whatever it is) — no ad-hoc SQL or manual DB edits outside that mechanism.
- Prefer additive migrations; provide defaults or a backfill strategy for non-null fields.
- Preserve any isolation columns when the table is scoped.
- For a new query, review selective filters, ordering, and pagination, and check whether an adequate index exists; if not, add one through the declared mechanism and justify it in the handoff.

For a data change with **no** migration, explain why the current schema supports the behavior and add a test that covers the persisted shape.

---

## Policy gate: Error / exception translation — optional when not declared

Apply per the project's declared error-handling convention. When declared:

- Translate exceptions returned on an HTTP (or equivalent) response through the project's declared error-handling mechanism.
- Do not return raw stack traces, raw exceptions, sensitive technical messages, or inconsistent payloads to the client.
- Cover the relevant exception-to-response mapping with a test.
- When the module lacks the declared translator, create one following the project's pattern.

---

## Policy gate: Async terminal-failure handling — optional when not declared

Apply when the project declares how terminal failures in queue/stream processing are recorded. When declared:

- Record a terminal error through the project's declared failure-capture mechanism before discarding/ending the failed message.
- Point the log at the same identifier captured by that mechanism.
- Follow any declared exceptions to this rule.

---

## Policy gate: Dependency-injection style — optional when not declared

Apply per the project's declared wiring convention. When declared (for example, constructor injection over field injection, or reuse of a shared serializer instance instead of constructing one per call):

- Follow the declared style for new implementation.
- Leave legacy wiring as-is unless the change touches it directly.

---

## Policy gate: Secrets & environment configuration — optional when not declared

Apply per the project's declared secret-handling convention. When declared:

- Never expose a secret value directly in code, tests, or versioned config.
- Declare the key in the project's declared per-environment configuration, always as an environment-variable reference, never as a literal value.
- If a required environment variable is not present in local documentation/config, record the follow-up in the handoff.

---

## Policy gate: Layering strictness — optional when not declared

Apply per the project's declared architectural boundaries. When declared, keep business rules, data access, and entry-point adaptation in the designated layers; do not collapse them. When the project declares no strict layering, follow the dominant local pattern and avoid introducing a new one.

---

## Policy gate: Verification / coverage policy — optional when not declared

Apply per the project's declared verification and coverage policy. When declared:

- Use the test frameworks and command(s) the project declares.
- Meet the coverage bar the project declares, for the scope it declares (module, layer, or changed classes). The project defines the number and the scope — this skill imposes neither.
- Cover the behavior the change touched: local rules, the persisted shape, contract edges, and any policy behavior exercised.
- If coverage measurement is blocked by a missing tool or broken local command, document the blocker and provide the remaining manual checklist.

If the project declares no coverage policy, follow the verification playbook's risk tiers and report what you ran — do not invent a threshold. See [verification-playbook.md](verification-playbook.md).
