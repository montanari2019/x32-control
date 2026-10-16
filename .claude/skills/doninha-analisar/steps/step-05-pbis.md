# Step 5: PBI Definition and Creation

## MANDATORY RULES

- Each PBI = an independent delivery the end user can use on its own
- EVERY PBI must pass the INVEST check before being created
- Propose, don't impose — the user validates each PBI individually
- Create/persist ONE PBI at a time, after individual validation
- No tracker write happens inside the PBI loop — registrations are queued and created in one confirmed batch after the loop (step 8)
- Each PBI gets its own folder: `{feature_folder}/pbis/pbi-{NNN}-{slug}/`
- PBI identity is **local-first**: `pbi-NNN` + slug — a tracker id, when one exists, is a field inside the artifact, never in the folder name
- Save `pbis.md` BEFORE routing to the next step
- No technical/code-level spec here — that's `doninha-desenvolver`'s job (F3), not this skill's

---

## INVEST — mandatory check for every PBI

| Letter | Criterion | Validation question |
| --- | --- | --- |
| **I** | Independent | Can this PBI be developed without depending on another PBI of this feature? |
| **N** | Negotiable | Can the scope be adjusted without losing the core value? |
| **V** | Valuable | Does the end user get to use this delivery and perceive value? |
| **E** | Estimable | Can the team estimate the effort with the information available? |
| **S** | Small | Does it fit in 1-2 sprints? (if not, it should be split) |
| **T** | Testable | Does it have clear, verifiable acceptance criteria? |

---

## SEQUENCE

### 1. Propose the PBI breakdown

Based on the documented Feature, propose the breakdown. For EACH proposed PBI, present:

<!-- INVESTIGAÇÃO: read §1b first — the breakdown starts from the report's requirements, not from scratch. -->


> "**PBI [N]: [Título]**
>
> **O que entrega:** [descrição em 1-2 linhas — foco no valor ao cliente final]
>
> **Regras de negócio que este PBI governa:** *(só sob `rn_placement: pbi`)*
> - RN-01: [regra, com o id que o step-04 atribuiu]
>
> **Critérios de aceite:**
> - CA-01: [critério verificável]
> - CA-02: [critério verificável]
>
> **Validação INVEST:**
> - I: [✅/⚠️] [justificativa]
> - N: [✅/⚠️] [justificativa]
> - V: [✅/⚠️] [justificativa]
> - E: [✅/⚠️] [justificativa]
> - S: [✅/⚠️] [justificativa]
> - T: [✅/⚠️] [justificativa]
>
> **[A]** Aprovar | **[Ajustar]** | **[Remover]**"

**STOP after each PBI — wait for a decision before proposing the next.**

If a PBI fails INVEST (any ⚠️ that isn't resolved by discussion), renegotiate — split or adjust — before it can be approved. Never create a PBI with an unresolved ⚠️.

### 1b. INVESTIGAÇÃO — correction PBIs from the report

Skip this section in the other two modes.

The breakdown does not start from a blank page: `rca.md` already produced numbered requirements (RF-NN) and acceptance criteria (CA-NN), gated by the evidence gate. They are the input.

**Grouping.** One PBI per **defect**, not per requirement. Requirements that close the same defect in the same module ship together — splitting them produces a PBI that fails **V**: half a correction delivers no usable value, and a user cannot "use" the first half of a fix. Requirements that close *different* defects stay apart even when they were found in the same investigation, because they can be released and reverted independently.

**Acceptance criteria come from the report, verbatim in substance.** The CA-NN in `rca.md` were written against the evidence; rewriting them here loosens them. Add project-specific ones if something is missing, never replace.

**Three kinds of PBI come out of an investigation, and they are not interchangeable:**

| Kind | When | Watch for |
| ---- | ---- | --------- |
| **Correção** | A requirement the report asserts | Normal INVEST |
| **Verificação** | A requirement the report left conditional ("verificar X; se confirmado, corrigir Y") | Its own PBI, **before** the correction it gates. Its deliverable is a decision, not a change — and it is `T` only if it states what result means "confirmed". Never merge it into the correction: that is how an unverified premise becomes code. |
| **Remediação de dados** | The report describes data already corrupted | Separate from the code fix, always. It has a different risk, a different rollback, and it usually cannot be re-run. Starts with an audit, never with an update. |

**Regression test belongs inside the PBI that fixes the defect**, as an acceptance criterion — the test for the *class* of the defect, not for the one reproduction. When the report says the defect recurred because an existing test mocks the failure, the criterion names that test.

**A PBI never carries the cause.** The mechanism, the `file:line` and the commit live in `rca.md`; the PBI links to it and states what must become true. Keeping the technical rationale in one place is what stops two copies from drifting.

Propose them through §1's format, one at a time, with the same INVEST gate.

### 2. Assign local id and folder

For each approved PBI:
- `pbi_id` = `pbi-{NNN}` — `NNN` = next sequential number among existing `pbi-NNN-*` folders in `{feature_folder}/pbis/` (max existing + 1, zero-padded to 3 digits; `001` if none exist).
- `slug` = PBI title in lowercase, spaces→hyphens, special characters removed, max 40 chars (no numeric prefix, no feature-title suffix).

```bash
mkdir -p "{feature_folder}/pbis/pbi-{NNN}-{slug}/"
```

All artifacts for this PBI live in this folder.

### 3. Attach the business rules this PBI governs

Read `rn_placement` from `sessao.md`.

- **`feature` (or empty):** nothing to do — the rules live in `feature.md` and this section is
  skipped. This is the behaviour of every analysis before the choice existed.
- **`pbi`:** pick, from `business_rules` in `sessao.md`, the rules this PBI governs, and confirm
  the selection with the user:

  > "Este PBI governa estas regras?
  > - RN-01: {regra}
  > - RN-03: {regra}
  >
  > **[C]** Confirmar | **[Ajustar]** quais regras entram"

  **STOP — wait for the confirmation.**

Three rules for the distribution:

- **Ids never change.** `RN-03` stays `RN-03` in the PBI that receives it. They were assigned in
  step-04 and are what the `spec.md` of this PBI will reference later.
- **A rule may govern more than one PBI.** Repeat it in each one instead of picking a favourite:
  a rule the developer cannot see is a rule the developer will violate.
- **Every rule has to land somewhere.** Before leaving the loop (section 7), check that each
  entry of `business_rules` appears in at least one PBI. A leftover rule means either a missing
  PBI or a rule that belongs on the feature after all — ask the user which, and never let it
  fall silently off the end of the analysis.

### 4. Persist the PBI product doc via `doninha-copy-writer`

Pass:
- **Content** — the delivered description, the business rules attached above (when any), acceptance criteria (CA-NN), and the completed INVEST table
- **Target path** — `{feature_folder}/pbis/pbi-{NNN}-{slug}/pbi.md`
- **Status field** — seed `pbis.{slug}` in `status.yml` (all dev-stages `pending`) if this is the PBI's first artifact
- **Metadata** — `stage: pbi`, `feature: {feature_slug}`, `pbi: {slug}`, feature directory `{feature_folder}`
- **Current stage** — a human-readable label (e.g. `"PBI proposto (doninha-analisar)"`)

`doninha-copy-writer` picks `doninha-artifact-pbi` and writes `pbi.md`.

### 5. Generate the information-flow diagram (optional)

Load the `doninha-plantuml-diagram` skill to generate PlantUML source representing this PBI's information flow (actors, services, data). Present the code to the user:

> "```plantuml
> [código]
> ```
> Fluxo correto? **[S]** Sim | **[Ajustar X]**"

**STOP — wait for confirmation.** When confirmed, save it to `{feature_folder}/pbis/pbi-{NNN}-{slug}/diagrama.puml`. Rendering (to PNG/SVG) is delegated to whatever MCP/tooling the `doninha-plantuml-diagram` skill points to — never hardcode a third-party rendering URL.

### 6. Queue the tracker registration (only if configured)

If `.doninha/integrations/azure-devops.yml` exists, **queue** this PBI's work-item registration — do not create anything yet. Record the pending entry (canonical type `pbi`, the PBI title, the parent Feature's work-item id, plus the PBI content and the diagram if generated) and move on. Every queued item is created in one confirmed batch at step 8, after the loop ends.

If the integration file is absent, queue nothing — this session is **local-only**, no work item is created, and this is expected, not an error.

### 7. Continue until the Feature is covered

After each PBI is persisted (and diagram confirmed, if any):

> "PBI [N] criada. Mais uma PBI ou feature coberta?
> **[M]** Mais uma PBI | **[F]** Finalizar"

### 8. Confirm and create the queued work items

Only once the loop is done (`[F] Finalizar`), and only if the queue from step 5 is non-empty. An empty queue (local-only session) skips this step entirely — no message, no error.

Hand the **whole queue at once** to the Azure DevOps integration skill. It owns the mandatory confirm-before-create gate — a single numbered list covering every queued item, one confirmation, nothing written before it clears. Do not restate that gate's wording here and do not create anything directly.

Record what actually came back:

- Items created → keep their tracker id for step 9.
- Items the user adjusted → the adjusted title/type/parent is what got created; carry that back into the local artifact if the title changed.
- Items skipped or declined → they stay without a tracker id. Never invent one, never mark them as synced.

### 9. Generate `pbis.md`

**Run this before routing.** Assemble the decomposition content — feature objective, each PBI (slug, title, short description, dependencies), and the rationale for the decomposition (including what was proposed and discarded, as prose) — and hand off to `doninha-copy-writer`:

- **Target path** — `{feature_folder}/pbis.md`
- **Status field** — `stages.structure = done`
- **Metadata** — `stage: structure`, `feature: {feature_slug}` (feature-level, no `pbi` field)

`doninha-copy-writer` picks `doninha-artifact-structure`.

### 10. Update frontmatter

Update `sessao.md`:
- `stepsCompleted`: append `5`
- `pbis_created`: append `{n, id_local, ado_id?, slug, invest_ok}` for each PBI created this step. `ado_id` is filled **only** for items the tracker actually created in step 8 — a skipped, declined, or local-only PBI leaves it absent.

This updates the fields named above and nothing else. `status` stays `analyzing` even though the
PBIs now exist on disk — they only become actionable work for `doninha-desenvolver` when
`step-06-fechamento` writes `analyzed`, and promoting them early would hand out work built on an
analysis that has not closed.

### 11. Route to the next step

Check the created PBIs. If any mentions UI, screens, or forms:

> "PBIs com UI identificadas. Vamos produzir proposta de UX antes do desenvolvimento.
> **[S]** Produzir | **[P]** Pular — ir para fechamento"

**STOP — wait for the decision.**

- **[S]** → load `./step-05b-ux-proposal.md`
- **[P]**, or no PBI mentions UI → load `./step-06-fechamento.md`

---

## SUCCESS METRICS

- Every PBI validated with INVEST before being persisted
- Folder created per PBI: `{feature_folder}/pbis/pbi-{NNN}-{slug}/` — local id, no tracker id in the name
- `pbi.md` written via `doninha-copy-writer` (stage=pbi) for each PBI
- Diagram (optional) delegated to `doninha-plantuml-diagram`, no hardcoded rendering URL
- Tracker registration only attempted when `.doninha/integrations/azure-devops.yml` exists; local-only otherwise, without error
- Tracker registrations queued during the loop and handed over as a single batch **after** it ends and **before** `pbis.md` — no work item created mid-loop, no per-PBI confirmation prompt
- PBIs the user skipped or declined at the create gate carry no `ado_id` and are never reported as synced
- `pbis.md` generated via `doninha-copy-writer` (stage=structure) BEFORE routing
- `sessao.md` updated with the list of created PBI ids
- Under `rn_placement: pbi`: every entry of `business_rules` landed in at least one `pbi.md`,
  with the `RN-NN` id unchanged, and the leftover case raised with the user instead of dropped
- Correct routing: PBIs with UI → step-05b; none with UI → step-06
- INVESTIGAÇÃO: one PBI per defect (not per requirement); every conditional requirement became its own verification PBI **before** the correction it gates; data remediation split from the code fix; regression criterion present for the class of the defect; no PBI restates the cause
