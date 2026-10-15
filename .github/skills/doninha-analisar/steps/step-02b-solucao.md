# Step 2B: Solution Grilling (High Context)

## MANDATORY RULES

- The problem is already clear — the work here is extracting the decided solution from the person, not helping them have ideas
- **Interrogate, don't brainstorm.** Walk the decision tree in [../references/grilling-negocio.md](../references/grilling-negocio.md), in rounds of 3-5 numbered questions, each carrying your recommended answer
- **Ask about the problem; derive the solution's shape.** The asked part of the tree ends at the boundaries (L4). **Functional requirements and acceptance criteria are never questions** — they are derived from the answers and written into the PRD. Asking "quais requisitos o sistema precisa ter?" hands back the work the person came here to have done
- **Never ask for a success metric** — indicator, baseline, target, deadline. Not every feature has a number behind it, and one extracted under pressure is invented. Volunteered, it is recorded; absent, the PRD says so
- **Finding facts is your job; deciding is the user's.** Anything the project can answer (does this capability already exist? was this already decided?) you look up yourself and bring back as a finding — never as a question
- Never accept the first answer as sufficient — push for specificity (who, when, how often, since when) before closing a node
- **Business only.** Never ask about architecture, endpoints, schema, framework, integration protocol, performance budget, infrastructure or test strategy — see the ban list in the reference. Technical detail the user volunteers is recorded as a constraint, never pursued
- Output is a business-level analysis — feeds directly into the Feature
- **Persist every answer the moment it is given.** Read `{feature_folder}/sessao.md` on entry, and write each closed node into it as soon as the user settles it — never accumulate answers in the conversation and flush them at the end of the step. A session that ends mid-interrogation must lose nothing. Corollary: never ask a question whose answer is already recorded in `sessao.md`; confirm it instead
- **Read code silently, speak business.** You MAY read source files and `.doninha/docs/codebase/*` to ground yourself in what already exists (they are a source of truth) — but NEVER surface that technical detail in what you say or write. No code symbols, functions, routes/endpoints, DTOs/fields, HTTP status codes, file paths, or type shapes in the facilitation or the analysis output. Reuse is expressed as **capabilities** ("a note-creation flow and a validation rule already exist and could be reused"), never as code artifacts ("`validateNoteInput`", "`PUT /api/notes/[id]`", "422"). Technical detail is `doninha-desenvolver`'s job (F3)
- This step runs **no** brainstorming techniques: `brain-methods.csv` and the technique-selection modes belong to DESCOBERTA (step-02a), where the opportunity is still nebulous and there is no tree to walk yet

---

## GOAL OF THIS STEP

Reach a **shared, written understanding** of the solution — complete enough that the PRD and the PBIs can be assembled from it with nothing silently assumed:

1. The pain, with a real case behind it
2. The main flow, its rules and its exceptions
3. What is explicitly out, and what could make this fail

From those, **you** derive the capabilities the system needs and how each one is verified — the user is not asked for them.

**Target:** the asked frontier (L1-L4) empty — every branch visited. Not a number of ideas, and not a number of questions.

---

## SEQUENCE

### 1. Confirm the problem

Read `{feature_folder}/sessao.md` first and check `initial_answers`.

**Already filled** (this step is being resumed, possibly in a brand-new session) — do not repeat the questions. Present what is recorded and ask only for a confirmation:

> "Retomando a análise de **[feature_title]**. Já tenho registrado:
>
> 1. **Problema:** [initial_answers.problema]
> 2. **Principal afetado:** [initial_answers.principal_afetado]
> 3. **Restrições:** [initial_answers.restricoes]
>
> **[S]** Confirmar e seguir | **[A]** Ajustar algum item"

**STOP — wait for the decision.** On `[A]`, ask which items change, and rewrite only those keys in `initial_answers` (leave the others exactly as they are).

**Empty** — ask the three questions:

> "Antes de entrar nos detalhes da solução, vamos garantir que o problema está bem articulado:
>
> 1. **Qual é o problema exato?** (em uma frase direta, do ponto de vista de quem é afetado)
> 2. **Quem é o principal afetado?**
> 3. **Existe alguma restrição conhecida?** (integrações obrigatórias, escopo de usuários, prazos)"

**STOP — wait for the answers before continuing.**

There is no fourth question about success criteria. A session resumed from an older `sessao.md` may carry a `criterio_sucesso` key — keep it, use it, and do not ask it again.

As soon as the answers arrive — before moving to section 2 — update `sessao.md`:

```yaml
initial_answers:
  problema: '{resposta 1}'
  principal_afetado: '{resposta 2}'
  restricoes: '{resposta 3}'
```

Transcribe the answers as the user gave them, in PT-BR — do not rewrite, summarize, or enrich them. This is the faithful record of what was said; the synthesis happens later in section 5. The "read code silently, speak business" rule applies here too: no technical detail enters these fields, even if the user's answer invites it.

Leave `stepsCompleted` at `[1]`. Step 2 has not finished, and that is precisely what makes a resumed session come back to this step instead of skipping ahead.

### 2. Ground yourself before asking anything

This is the step's own homework, and it happens **before** the first round — every fact you find here is a question you will not spend on the user.

- `.doninha/docs/codebase/OVERVIEW.md` and the `modules/<slug>.md` docs — does the product already do part of this? Start from the module map to scope which repos/modules the feature touches, then read only those module docs. Do not sweep the folder, and do not dive into the technical files for this: those docs are already written at capability level, which is exactly the language this step needs.
- `.doninha/STATE.md` and the feature folder's own artifacts — was any of this already decided?
- `DONINHA.md` / `doninha-product-context` — the project's own vocabulary: personas, affected dimensions, item types. Never hardcode domain terms from another project.

Report what you found in **one** short block, at capability level, before the first round:

> "Antes de perguntar: olhei o que já existe. **[capacidade A]** já está no produto (módulo [X]) e **[capacidade B]** cobre parte disso. Vou considerar isso nas perguntas abaixo — me corrija se estiver errado."

Nothing found is a legitimate outcome and is said in one line. What is not acceptable is asking the user something the project already answers.

### 3. Walk the tree, in rounds

Load [../references/grilling-negocio.md](../references/grilling-negocio.md) and follow it. In short:

- The asked tree is **L1 pain → L2 main flow → L3 business rules → L4 boundaries (out of scope, pre-mortem, edge cases)**, and stops there.
- The **frontier** is every node whose prerequisites are settled. A question that depends on another still-open question belongs to a later round.
- Each round is **3 to 5 numbered questions**, every one of them carrying your recommended answer (`➡️`). Then **STOP — wait for the answers.**
- Closed decisions may use `AskUserQuestion`; justifications are always free text.
- Push back on vague answers and missing concrete cases before closing a node.
- Drafts are an offer and only where there is a base: **never** for the business rules (L3); out-of-scope candidates (L4) may be offered as candidates.
- No question about requirements, about acceptance criteria, or about a success metric — ever. The first two are derived in section 4; the third is not this skill's to extract.

After **each round**, write what was settled into `sessao.md` — do not wait for the tree to finish:

```yaml
grilling:
  L1_dor: '{síntese confirmada pelo usuário}'
  L2_fluxo: '{síntese}'
  L3_regras:
    - '{regra}'
  L4_fora_escopo: ['{item}']
  L4_premortem: '{cenário de falha}'
  abertos: ['{nó ainda não fechado}']
```

`abertos` is what a resumed session reads to know where the frontier was. A node the user re-opened (an answer that contradicts something already settled) goes back into `abertos` and is re-asked — carrying a contradiction into the PRD is worse than one extra round.

The step continues until `abertos` is empty. Then — and only then — move to the derivation.

### 4. Derive the requirements and the criteria

This is **your** work, from the answers already recorded. It is not a round, it is not confirmed item by item, and none of it goes back to the user as a question.

- **Functional requirements** — read each business rule and name the concrete capability it implies ("o sistema deve permitir/exibir/calcular X"). Every requirement traces back to something the person actually said; one with no source in the conversation is invented and stays out.
- **Acceptance criteria** — for each requirement, how it is verified, in terms someone from the business can check. A criterion that cannot be written plainly signals a vague requirement: rewrite the requirement instead of covering it with a vague criterion.
- **Keep the boundary visible.** A rule is the domain's logic ("se o estoque zerar, ocultar o produto"); a requirement is the capability ("o sistema deve permitir ocultar produtos sem estoque"). They are recorded separately, and the synthesis shows them separately.

Record in `sessao.md`:

```yaml
derivado:
  requisitos:
    - '{capacidade concreta}'
  criterios:
    - '{critério verificável}'
  porte: { requisitos: N, cenarios_previstos: M, quebra: 'aceita|recusada|nao-aplicavel' }
```

If the derivation hits something the answers do not settle — a rule whose exception nobody named, a flow that stops halfway — that node was **not** actually closed. Put it back into `abertos` and ask it. Deriving over a hole produces a confident requirement resting on a guess.

Then count, and **only if** the count overshoots the 3-8 scenarios-per-PBI ruler, ask the single split question from the reference. That is the one question the derivation may produce, it is about splitting the delivery, and "seguir com um só" closes the subject.

### 5. Alternatives — only when a fork actually appeared

The PRD has a section for considered-and-rejected alternatives, and this is where its content comes from. It is **not** an invitation to manufacture options.

- **A real fork appeared** (the questioning surfaced two or more genuinely different ways to solve it, and the user picked one): present them and record the choice.

  > "Apareceram caminhos diferentes ao longo das perguntas:
  >
  > **A:** [nome] — [o que entrega] | Custo: [alto/médio/baixo] | Risco: [alto/médio/baixo]
  > **B:** [nome] — [o que entrega] | Custo: [alto/médio/baixo] | Risco: [alto/médio/baixo]
  >
  > Você seguiu com [A]. Confirma, e quer registrar o porquê da rejeição de [B]?"

  **STOP — wait for the confirmation.**

- **No fork appeared** — the common case when the solution was already decided before the session. Record exactly that:

  ```yaml
  alternativas: 'nenhuma — a solução já chegou decidida e o questionamento não revelou bifurcação'
  ```

  and let `feature.md` say so plainly. An invented rejected alternative is indistinguishable from a real one in the document that comes out, and it fabricates a deliberation that never happened.

### 6. Synthesize the analysis

Consolidate into `sessao.md` (`brainstorming_notes`):
- The solution as it stands, in business terms
- Business rules and derived functional requirements, **separated**
- The derived acceptance criteria
- Affected dimensions (in the project's own vocabulary)
- Constraints identified — including technical ones the user volunteered, in their words
- Alternatives and why they were rejected, or the explicit absence of them
- The size count and the split decision

Present the synthesis **once**, so that nothing reaches the PRD unannounced — the derived requirements and criteria included. Do not open a confirmation round per item: step-04 presents the assembled PRD for review in one piece, and that is where corrections land. Asking the user to approve the same content twice is the friction this design exists to remove.

### 7. Update frontmatter

Update `sessao.md`:
- `stepsCompleted: [1, 2]`
- `brainstorming_notes: '{summary of the solution and main decisions}'`
- `validation_approved: true` (SOLUÇÃO mode never goes through the product gate)

This updates the fields named above and nothing else. `status` stays `analyzing` — only
`step-06-fechamento` ends the analysis in SOLUÇÃO mode (there is no gate step here to reject it).

`initial_answers`, `grilling`, `derivado` and `alternativas` were already written in sections 1, 3, 4 and 5 — this section only appends the three fields above and must not rewrite or reword them.

### 8. Advance to Feature documentation

> "Análise concluída — nada ficou em aberto. Tenho o fluxo, as regras e os limites de escopo, e derivei os requisitos e os critérios a partir deles.
> Vou montar o PRD. **[S]** Continuar"

**STOP — wait for confirmation.**

Load `./step-04-feature.md` (SOLUÇÃO routes directly here — it never loads `step-03-gate.md`).

---

## SUCCESS METRICS

- Problem articulated clearly before the interrogation starts
- The three answers persisted to `initial_answers` **before** the first round — a session ending mid-interrogation loses nothing
- A resumed session confirms the recorded answers and resumes from `grilling.abertos` instead of asking them again
- Product grounding done **before** the first round, reported at capability level, and no question asked that the project's own docs already answer
- Rounds of 3-5 numbered questions, every one carrying a recommended answer
- No technical question asked; technical detail the user volunteered recorded as a constraint
- **No question asked about functional requirements, acceptance criteria or a success metric** — the first two derived in section 4, the third never extracted
- Business rules and derived functional requirements separated, with the separation shown to the user
- Drafts offered only for out-of-scope candidates, never for the business rules
- Every derived requirement traceable to something the user actually said; a hole found during derivation sent back to `abertos` instead of guessed
- Size counted over the derived requirements, and the split raised once — the only question the derivation may produce
- Alternatives recorded only when a real fork appeared; its absence stated explicitly, never filled with invented options
- Asked frontier empty (`grilling.abertos` empty) and `derivado` filled before advancing
- Synthesis presented once, with no per-item approval round before the PRD
- `sessao.md` updated: `stepsCompleted: [1, 2]`, `validation_approved: true`
