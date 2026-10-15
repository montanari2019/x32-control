# Step 4: Feature Documentation (PRD)

## MANDATORY RULES

- A Feature is a complete strategic delivery (e.g. a dashboard, a whole module) — business-level, not a code architecture doc
- Focus on business — do not descend into technical/code architecture
- Fill every mandatory section
- Content is assembled here; `doninha-copy-writer` (stage=feature) is who actually writes `feature.md` + `decisions.md`
- Vocabulary (affected dimension, item types) comes from `DONINHA.md` / `doninha-product-context` config — never hardcode a project's domain terms
- INVESTIGAÇÃO: the input is a gated `rca.md`, not a brainstorming — translate it (§0), never reopen it, and never drop the conditional wording of a requirement the report marked as conditional

---

## GOAL OF THIS STEP

Produce the official Feature document — the PRD — that:
1. Clearly defines what will be delivered
2. Documents business rules and product decisions
3. Serves as the contract between business and development
4. Is recorded locally (and, when a tracker integration exists, referenced there)

---

## SEQUENCE

### 0. INVESTIGAÇÃO — translate the report, do not re-run it

Skip this section in the other two modes.

Arriving from step-03b, the input is not a brainstorming: it is `rca.md`, already gated. **Everything in it is decided** — the cause, the requirements, the acceptance criteria, the gaps. This step translates, it does not reopen. Never re-ask what the investigation answered, and never soften a finding to make the PRD read better.

The mapping, which is the whole job here:

| `rca.md` | `feature.md` |
| -------- | ------------ |
| Sintoma + Objetivo do usuário | **Problema / Oportunidade** — in business terms: who is affected, what they cannot do, since when |
| Causa raiz + Cadeia | one business-level sentence in **Solução Proposta** ("corrigir o {comportamento} de {capacidade}"), never the `file:line` |
| Requisitos (RF-NN) | **Escopo IN** — one line each, in capability language |
| O que o laudo decidiu NÃO ser a causa | **Escopo OUT** + **Alternativas Consideradas e Rejeitadas** |
| Critérios de aceite (CA-NN) | **Critérios de Sucesso** |
| Remediação de dados | **Escopo IN**, as its own item — it is work, not a side effect of the fix |
| Lacunas com impacto no negócio | **Premissas e Decisões**, stated as the risk they are |
| Estágio adversarial: tese reescrita | one `DEC-NN` in `decisions.md` — what was believed, what changed it, what decided |

**The register changes, the content does not.** `feature.md` stays business-level exactly as in the other modes — no `file:line`, no commit, no stack frame, no status code. The technical detail already has a home in `rca.md`, and `feature.md` links to it rather than repeating it. Someone reading only the PRD must still understand what is being fixed and why.

**A gap does not become a certainty in translation.** A requirement the report marked as conditional ("verificar X; se confirmado, corrigir Y") stays conditional in the scope. Dropping the condition here is how an unverified premise reaches the code as a fact.

Add a **Referências** entry pointing at `{feature_folder}/rca.md`, then continue at §1 for whatever the report genuinely left open — normally the title and the IN/OUT boundary, nothing more.

### 1. Collect missing information

Based on what step-02a (brainstorming) or step-02b (grilling) produced — or, in INVESTIGAÇÃO, on the translation in §0 — identify gaps and ask the user what hasn't been defined yet. Under SOLUÇÃO the functional requirements and acceptance criteria already exist in `sessao.md`'s `derivado` — read them from there and do **not** re-ask them; the PRD's own review below is where the user corrects them. At minimum confirm:

- Final Feature title (may differ from the initial topic)
- The affected dimension(s), if relevant to this project (read the label/options from `DONINHA.md` / `doninha-product-context`; skip the section entirely if not applicable)
- Explicit scope: what is IN and what is OUT

### 2. Ask where the business rules go

The rules were consolidated upstream and exist now — this is the moment the user
can decide where they are documented, and the answer is recorded so it is asked **once** per
analysis.

Read `rn_placement` from `sessao.md` first. **Filled → skip this section entirely** (a resumed
session never re-asks). Empty → ask:

> "Consolidei as regras de negócio desta feature. Onde você quer que elas fiquem documentadas?
>
> **[1] Na feature** — uma lista `RN-NN` única no `feature.md`, governando todos os PBIs. É o
> padrão até aqui.
>
> **[2] No PBI** — cada regra fica no `pbi.md` do PBI que ela governa, ao lado dos critérios de
> aceite que a verificam. Quem desenvolve lê a regra sem sair do item.
>
> Digite 1 ou 2."

**STOP — wait for the selection.**

Record in `sessao.md`: `rn_placement: 'feature'` or `rn_placement: 'pbi'`.

Neither is more correct — it is how the person works. Two teams asked for `pbi` because whoever
develops opens the PBI and had to navigate to the feature to find the rule governing the item
in front of them.

**When `pbi`:** also record the consolidated rules in `sessao.md` under `business_rules`, one
entry per rule, keeping the `RN-NN` id assigned here:

```yaml
business_rules:
  - id: 'RN-01'
    rule: '{regra clara e objetiva}'
  - id: 'RN-02'
    rule: '{regra clara e objetiva}'
```

They have to survive the step boundary: step-05 is what distributes them across the PBIs, and
without this field they would only exist in this conversation. Ids are assigned **once**, here,
and never renumbered downstream — they are the link between the rule and the acceptance
criterion that covers it.

### 3. Assemble the PRD content

Assemble the PRD content matching the sections `doninha-artifact-feature` expects (the single source of truth for the `feature.md` structure — do not duplicate it here):

- **Problema / Oportunidade** and **Solução Proposta** — from the step-02 synthesis
- **{dimensão} Afetados** / **Tipos de {item} Envolvidos** — only if the project's config defines this vocabulary; omit otherwise
- **Regras de Negócio** — obeys the `rn_placement` recorded above: with `feature`, the
  consolidated `RN-NN` list; with `pbi`, the section carries only the pointer to the PBIs
  (see `doninha-artifact-feature`'s rule for the two shapes). The section never disappears —
  a PRD with no such heading reads as "this feature has no business rules"
- **Escopo IN/OUT** and **Premissas e Decisões**
- **Critérios de Sucesso** — **only when the analysis actually produced a metric.** Not every
  feature has a number behind it, and SOLUÇÃO deliberately never asks for one. With no metric on
  record, say so in the section instead of inventing an indicator, a baseline or a target — an
  invented metric is indistinguishable from a measured one in the finished PRD, and it is the
  number someone will later be held to
- **Decisões Chave** — summary table; full detail goes to `decisions.md`
- **Alternativas Consideradas e Rejeitadas** — what was explored and discarded upstream. Under
  SOLUÇÃO this section is filled **only** when the grilling surfaced a real fork; when `alternativas`
  in `sessao.md` records that none appeared, say so plainly instead of inventing options — a
  fabricated rejected alternative is indistinguishable from a real one in the finished PRD
- **Dependências**, **Referências** (link `discovery.md` if this came from DESCOBERTA mode)

Assemble the companion `decisions.md` content: one `DEC-NN` entry per relevant decision surfaced upstream (Contexto / Opções avaliadas / Escolha / Motivo / Impactos).

### 4. Validate with the user

Present the assembled content:

> "Feature documentada. Revise abaixo. Algum ajuste antes de salvar?
> [conteúdo montado]
> **[S]** Salvar | **[Ajustar X]** para corrigir algo"

**STOP — wait for confirmation or adjustments.**

### 5. Hand off to `doninha-copy-writer`

Pass:
- **Content** — the validated `feature.md` content + the `decisions.md` content
- **Target path** — `{feature_folder}/feature.md` (copy-writer also writes `{feature_folder}/decisions.md` per the `doninha-artifact-feature` contract)
- **Status field** — `feature_prd_artifact = {feature_folder}/feature.md`
- **Metadata** — `stage: feature`, `feature: {feature_slug}`, feature directory `{feature_folder}` (no `pbi` field — feature-level)
- **Current stage** — a human-readable label (e.g. `"Feature PRD (doninha-analisar)"`)

If a tracker integration exists (`.doninha/integrations/azure-devops.yml`), also update the tracker's Feature-equivalent work item with the PRD content once the local files are saved — this step never writes tracker state before the local files exist.

### 6. Evolve `decisions.md` later if needed

If a later step (e.g. step-05 revealing a new high-level decision) surfaces something decision-worthy, return to `decisions.md` and add a new `DEC-NN` entry through the same `doninha-copy-writer` (stage=feature) hand-off — `feature.md#Decisões Chave` only receives a one-line summary of the new entry.

### 7. Update session frontmatter

Update `sessao.md`:
- `stepsCompleted`: append `4` (i.e. `[1, 2, 3, 4]` for DESCOBERTA and for INVESTIGAÇÃO, `[1, 2, 4]` for SOLUÇÃO)
- `rn_placement`: the choice from section 2, if it was not already recorded there
- `business_rules`: the consolidated rules, **only** under `rn_placement: pbi` — step-05 reads
  this field to distribute them

This appends to the field named above and nothing else. `status` stays `analyzing` — only
`step-03-gate` (No-Go) and `step-06-fechamento` (closeout) ever change it.

Load `./step-05-pbis.md`.

---

## SUCCESS METRICS

- All mandatory sections filled
- Affected dimension(s) made explicit when the project's config defines them
- IN/OUT scope defined
- Success criteria filled only from a metric the analysis actually recorded; its absence stated, never invented
- `feature.md` + `decisions.md` written via `doninha-copy-writer` (stage=feature)
- Rejected alternatives documented in `feature.md`
- `decisions.md` has at least one `DEC-01` entry
- Business-rule placement asked **once** and recorded in `sessao.md` (`rn_placement`), and not
  re-asked on a resumed session
- Under `rn_placement: pbi`, `business_rules` recorded in `sessao.md` with the `RN-NN` ids
  assigned here, and `feature.md` carrying the pointer instead of the list
- INVESTIGAÇÃO: `rca.md` translated, not re-litigated — no `file:line`/commit/status code leaked into `feature.md`, conditional requirements still conditional, and `rca.md` linked under Referências
