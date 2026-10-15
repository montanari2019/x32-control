# Specify (Dev Spec for a PBI)

**Goal**: Turn one already-scoped work-item/PBI into a testable, traceable dev spec — WHAT to build for THIS PBI, not a new discovery pass.

This is narrower than a full feature Specify. By the time `doninha-desenvolver` reaches this step, the Acceptance Criteria (CA) already exist — either on the ADO work-item or written into the PBI by the `analisar` phase — and are **immutable, source-of-truth**. This reference's job is to show how to structure those CA (and any edge cases they miss) into `spec.md`, not to interview anyone from scratch.

`spec.md` is written **directly by the skill** — there is no separate copy-writer/doc-pipeline step for it. It lives inside the PBI's own canonical folder, so it should **reference, not duplicate**:

- the PBI's own CA (already loaded — restructure them, don't re-derive them)
- the parent feature's artifacts (problem statement, goals, out-of-scope) — link back, don't re-paste
- `sessao-dev.md` (this skill's own session tracker for the PBI) — for `stepsCompleted`, resume state, and any decisions logged mid-flow

## Process

### 1. Load the Existing CA

Do not ask "what problem are you solving" — that discovery already happened. Pull the CA from wherever they live:

- ADO work-item (via the tracker integration), when configured
- The PBI's own artifact, when running local-only

Treat them as fixed. If they conflict with the parent feature's artifacts, or look incomplete/ambiguous, **stop and flag it** — resolving that conflict is a decision for the user, not something to silently paper over.

### 2. Normalize into WHEN/THEN/SHALL

CA rarely arrive already in testable form. Rewrite each one as:

- WHEN [event/action] THEN [system] SHALL [response/behavior]

If a given CA can't be rewritten this way, it's too vague to implement — push back before moving on.

### 3. Surface Edge Cases

The given CA cover the happy path and whatever the author thought of. Add what they didn't: boundaries, empty/huge input, error paths, unexpected input. These get appended as their own WHEN/THEN/SHALL lines — same format, same traceability treatment — not folded silently into the original CA.

### 4. Assign Requirement Traceability IDs

Every CA and every edge case gets a unique ID, so it can be tracked from spec → task.md → verification.

### 4b. Record the Technical Decisions

The doubt gate (`steps/step-03-spec-e-tasks.md` §4) ran before this file was written. Every answer
it collected — and every decision the codebase settled on its own, with its `file:line` — becomes a
row in the **Decisões técnicas** table below.

This table is what stops the same question being re-opened during implementation, and what makes an
invented choice visible: a row with no evidence and no `EM ABERTO` marker is a guess wearing a
decision's clothes.

### 5. Confirm Before Generating Tasks

There's no separate "discuss" phase here — the CA are already given. Instead, confirm with the user that the CA (as normalized) plus the surfaced edge cases are **complete** before moving on to `task.md`. This is the equivalent checkpoint: not "approve the discovery," but "approve that nothing about this PBI's scope is still fuzzy."

---

## Template: `.doninha/docs/modules/module_NNN_name/feature_NNN_name/pbis/pbi-NNN-slug/spec.md`

```markdown
# [PBI Title] — Dev Spec

**Parent Feature**: [link/reference to feature.md — do not re-paste its Problem Statement/Goals]
**Work-item**: [ADO id, if configured] · **PBI**: pbi-NNN-slug

## Scope

[1-2 sentences: what this PBI covers, scoped to this unit of work. Link out to the parent feature for the broader why.]

## Out of Scope

Explicitly excluded from this PBI (may still be in-scope for the parent feature elsewhere).

| Item     | Reason         |
| -------- | -------------- |
| [Item X] | [Why excluded] |

---

## Decisões técnicas

Decididas antes desta spec (step-03 §4). Cada linha é uma escolha que o codebase não resolvia
sozinho, ou que resolvia com mais de um padrão vivo. **Não reabra nenhuma durante a implementação**
— uma decisão reaberta task a task é como duas partes do mesmo PBI acabam seguindo padrões
diferentes.

| #   | Decisão               | Escolha                | Evidência       | Origem              | Requisitos afetados |
| --- | --------------------- | ---------------------- | --------------- | ------------------- | ------------------- |
| 01  | [o que foi decidido]  | [opção] \| EM ABERTO   | `src/x.ts:88`   | usuário \| assumida | [PBI-SLUG]-02, -05  |

`Origem: assumida` marca o que o usuário delegou ("você decide") — é uma decisão sem dono humano, e
a diferença importa quando alguém for contestá-la. `EM ABERTO` marca o que ficou sem resposta: as
tasks que dependem dela carregam `Bloqueado por: decisão EM ABERTO #{n}` e o step-04 repergunta na
hora de executar.

---

## Acceptance Criteria

Source: [ADO work-item | PBI artifact from `analisar`]. Treated as immutable — normalized here into WHEN/THEN/SHALL, not re-derived.

1. WHEN [event/action] THEN system SHALL [expected behavior]
2. WHEN [event/action] THEN system SHALL [expected behavior]

## Edge Cases

Surfaced while writing this spec — not present in the original CA.

- WHEN [boundary condition] THEN system SHALL [behavior]
- WHEN [error scenario] THEN system SHALL [graceful handling]
- WHEN [unexpected input] THEN system SHALL [validation response]

## Cenários e2e

The end-to-end scenarios for this PBI, written **here** and not at coding time. Each one names
the Requirement IDs it verifies, so the test that gets written later is the test that was
agreed.

| ID     | Requisitos verificados | Cenário                                    |
| ------ | ---------------------- | ------------------------------------------ |
| E2E-01 | [PBI]-01, [PBI]-02     | [fluxo do usuário, de ponta a ponta]       |
| E2E-02 | [PBI]-03               | [caminho de erro que atravessa as camadas] |

Each scenario, in the project's own test vocabulary (read from `TESTING.md`; the
given/when/then below is the fallback when the project has no convention of its own):

**E2E-01 — [título]**
- **Dado** [estado inicial observável]
- **Quando** [ação do usuário, na interface real do sistema]
- **Então** [resultado observável de fora]

**Fora do e2e** — verified by unit test, deliberately not duplicated here:

| Requisito | Por que não é e2e                                          |
| --------- | ---------------------------------------------------------- |
| [PBI]-04  | [regra pura, sem travessia de camada — unitário já cobre]  |

---

## Requirement Traceability

| Requirement ID | Source        | Phase  | Status  |
| --------------- | -------------- | ------ | ------- |
| [PBI]-01        | CA (original)  | Tasks  | Pending |
| [PBI]-02        | CA (original)  | Tasks  | Pending |
| [PBI]-03        | Edge case      | Tasks  | Pending |

**ID format:** `[PBI-SLUG]-[NUMBER]` (e.g., `CART-01`, `AUTH-03`)

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** X total, Y mapped to `task.md`, Z unmapped ⚠️

---

## Success Criteria

- [ ] Every CA (original + edge cases) has a Requirement ID and maps to at least one task
- [ ] Every Requirement ID that describes a user flow appears in an `E2E-NN` scenario, or in the
      "Fora do e2e" table with the reason
- [ ] Nothing here duplicates the parent feature's Problem Statement/Goals — link instead
- [ ] Toda decisão técnica tem evidência (`arquivo:linha`) ou está marcada `EM ABERTO` — nenhuma
      inventada
```

---

## Tips

- **This is one PBI, not a new feature** — no P1/P2/P3 story slicing here; the PBI itself is the unit. If it doesn't fit in one PBI, that's a signal to go back to `analisar`, not to smuggle a second feature into this spec.
- **WHEN/THEN is code** — if you can't write it as a test, rewrite it
- **The e2e scenario is written before the code, and that is the point.** Written afterwards it
  mirrors what was built; written here it verifies what was agreed. The implementation
  implements `E2E-01`, it does not invent a scenario of its own
- **Not everything is e2e.** A pure rule with no layer crossing belongs in a unit test, and
  duplicating it end-to-end buys a slower suite and no coverage. The "Fora do e2e" table is
  where that decision is recorded instead of being silent
- **Requirement IDs are mandatory** — every CA and every edge case maps to a trackable ID
- **Edge cases matter** — the original CA rarely cover them; that's this step's job to add
- **Reference, don't duplicate** — the PBI's CA, the parent feature's artifacts, and `sessao-dev.md` are already loaded; link/summarize, don't re-paste
- **Confirm CA are complete before generating tasks** — there's no separate discuss phase; this is the checkpoint that replaces it
