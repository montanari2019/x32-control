# Step 2A: Discovery Brainstorming (Low Context)

## MANDATORY RULES

- This is an exploration space — no judgment, no premature filtering
- Your role is to facilitate divergence, not to converge yet
- Rotate creative domain every ~10 ideas (anti-bias protocol — see [../references/brainstorming.md](../references/brainstorming.md))
- Target: 100+ insights/hypotheses/angles developed in dialogue before synthesizing
- Synthesize into `discovery.md` at the end — not mid-brainstorming
- NEVER jump to a solution — this step is about understanding the problem/opportunity
- **Persist every answer the moment it is given.** Read `{feature_folder}/sessao.md` on entry, and write each answer into it as soon as the user gives it — never accumulate answers in the conversation and flush them at the end of the step. This step targets 100+ insights; a session that ends mid-brainstorming must lose nothing. Corollary: never ask a question whose answer is already recorded in `sessao.md` — confirm it instead.
- **Read code silently, speak business.** You MAY read source files and `.doninha/docs/codebase/*` (start at `OVERVIEW.md` — its module map is the cheapest way to scope which repos/modules a topic touches) to ground yourself — but NEVER cite code symbols, functions, routes/endpoints, DTOs/fields, HTTP status codes, file paths, or type shapes in the facilitation or artifacts, and never pose technical/implementation questions. This step may be run by analysis/business people; keep it at the problem/business level. Technical detail is `doninha-desenvolver`'s job (F3).
- Techniques loaded on demand from `../assets/brain-methods.csv` (via [../references/brainstorming.md](../references/brainstorming.md))

---

## GOAL OF THIS STEP

Explore the opportunity/problem in depth to:
1. Understand the problem space (not the solution)
2. Map who is affected and how
3. Surface hypotheses and uncertainties
4. Assess preliminary feasibility
5. Produce a validation document for the approver

**Quantity target:** 100+ collaborative insights before organizing. Ideas only count when they emerge from dialogue or are accepted and developed by the user.

---

## SEQUENCE

### 1. Initial context

Read `{feature_folder}/sessao.md` first and check `initial_answers`.

**Already filled** (this step is being resumed, possibly in a brand-new session) — do not repeat the questions. Present what is recorded and ask only for a confirmation:

> "Retomando a exploração de **[feature_title]**. Já tenho registrado:
>
> 1. **O que foi observado:** [initial_answers.observado]
> 2. **Quem sente o problema:** [initial_answers.persona_afetada]
> 3. **O que acontece hoje:** [initial_answers.situacao_atual]
> 4. **Por que agora:** [initial_answers.por_que_agora]
>
> **[S]** Confirmar e seguir | **[A]** Ajustar algum item"

**STOP — wait for the decision.** On `[A]`, ask which items change, and rewrite only those keys in `initial_answers` (leave the others exactly as they are).

**Empty** — ask the user:

> "Vamos explorar esta oportunidade. Me conte:
>
> 1. **O que você observou?** (sinal, feedback, dado ou intuição que trouxe esta oportunidade)
> 2. **Quem sente este problema?** (persona afetada — cliente, usuário interno, operador, outro)
> 3. **O que acontece hoje** quando essa pessoa se depara com o problema?
> 4. **Por que agora?** (o que mudou que torna isso relevante hoje)"

**STOP — wait for the answers before continuing.**

As soon as the answers arrive — before moving to section 2 — update `sessao.md`:

```yaml
initial_answers:
  observado: '{resposta 1}'
  persona_afetada: '{resposta 2}'
  situacao_atual: '{resposta 3}'
  por_que_agora: '{resposta 4}'
```

Transcribe the answers as the user gave them, in PT-BR — do not rewrite, summarize, or enrich them. This is the faithful record of the user's opening framing, and section 4 reads it back to fill **Pedido original**. The "read code silently, speak business" rule applies here too: no technical detail enters these fields, even if the user's answer invites it.

Leave `stepsCompleted` at `[1]`. Step 2 has not finished, and that is precisely what makes a resumed session come back to this step instead of skipping ahead.

### 2. Brainstorming approach selection

Check `ideation_technique` in `sessao.md`.

**Already filled** — do not re-ask. State what is in use and move on:

> "Seguindo com a abordagem de brainstorming já escolhida: [ideation_technique]."

**Empty** — ask:

> "Ótimo contexto. Antes de explorar, como prefere conduzir o brainstorming?
>
> **[1] Você escolhe a técnica** — Apresento a biblioteca com 61 técnicas criativas organizadas por categoria
> **[2] Eu recomendo** — Escolho as melhores técnicas com base na sua oportunidade
> **[3] Aleatório** — Surpresa criativa: técnicas escolhidas aleatoriamente
> **[4] Fluxo progressivo** — Começamos amplo (divergente) e vamos estreitando sistematicamente"

**STOP — wait for the selection.**

Immediately after the selection, update `sessao.md`:

- `ideation_technique: '{selected mode + the technique names actually chosen}'`

Follow the mode's execution rules in [../references/brainstorming.md](../references/brainstorming.md) (section "Selection modes — DESCOBERTA").

### 3. Technique execution

For each technique executed, follow its `description` from `brain-methods.csv`, applied to the actual opportunity being discussed.

**Every 10 insights generated:**
- Rotate creative domain (anti-bias protocol — see reference doc)
- Ask: "Quer continuar explorando este ângulo ou mudar para uma nova dimensão/técnica?"

**Dimensions that must be covered over the session** (not necessarily in order):
- The problem in depth (real pain vs. symptom, frequency, severity)
- Impact (who/what is affected, how broadly)
- Value opportunity (for the affected persona(s) and for the business)
- Risks and uncertainties (false hypotheses, worst case, reasons NOT to do this)
- References and market (what competitors/adjacent tools do, what already exists in this project)

**Continue until ~100 insights are reached OR the user indicates satisfaction.**

### 4. Synthesize

Once exploration is sufficient, ask:

> "Chegamos a [N] insights/ângulos explorados. Pronto para sintetizar em um documento de validação? **[S]** Sim | **[+]** Quero explorar mais"

When confirmed, consolidate the session into the sections expected by `doninha-artifact-discovery` (do not write the file yourself — hand off to `doninha-copy-writer`, step 5):

- **Pedido original** — the user's opening framing, transcribed faithfully from `initial_answers` in `sessao.md` (not from your memory of the conversation — that record is the source of truth, and it survives a session restart)
- **Problema e contexto** — the problem/pain and its business context
- **Usuários e personas (inicial)** — who benefits, roles
- **Valor esperado** — hypothetical benefit to user/business
- **Análise de alinhamento** — fit with product goals, overlap with existing features, viability signals
- **Regras de negócio iniciais (candidatas)** — RN-NN candidates surfaced
- **Termos de domínio** — ubiquitous-language seeds, if any surfaced
- **Perguntas em aberto** — uncertainties to resolve later
- **Riscos e restrições (inicial)**
- **Fora de escopo (inicial)**
- **Recomendação** — one of **Go / No-Go / Refinar** (≡ VALE A PENA AVANÇAR / NÃO RECOMENDADO / PRECISA DE MAIS VALIDAÇÃO), with objective justification
- **Registro de perguntas e respostas** — log of the Q&A rounds from this session
- **Referências visuais** — only if the user provided visual references; omit otherwise

### 5. Hand off to `doninha-copy-writer`

Pass:
- **Content** — the synthesized sections above
- **Target path** — `{feature_folder}/discovery.md`
- **Status field** — `stages.discovery = done`
- **Metadata** — `stage: discovery`, `feature: {feature_slug}`, feature directory `{feature_folder}` (no `pbi` field — feature-level)
- **Current stage** — a human-readable label (e.g. `"Discovery (doninha-analisar)"`)

`doninha-copy-writer` picks `doninha-artifact-discovery`, writes `discovery.md`, and updates `status.yml` (initializing it if this is the first artifact for the feature).

### 6. Update session frontmatter

Update `sessao.md`:
- `stepsCompleted: [1, 2]`
- `brainstorming_notes: '{2-3 line summary of the main insights and techniques used}'`

This updates the fields named above and nothing else. `status` stays `analyzing` — only
`step-03-gate` (No-Go) and `step-06-fechamento` (closeout) ever change it.

`initial_answers` and `ideation_technique` were already written in sections 1 and 2 — this section only appends the two fields above and must not rewrite or reword either of them.

### 7. Advance to the gate

Load `./step-03-gate.md`.

---

## SUCCESS METRICS

- The four answers persisted to `initial_answers` and the choice to `ideation_technique` **before** the exploration starts — a session ending mid-brainstorming loses nothing
- A resumed session confirms the recorded answers instead of asking them again
- Technique(s) selected and executed from `brain-methods.csv`
- ~100 insights/angles target explored in dialogue
- Anti-bias protocol applied (domain rotation every ~10 ideas)
- All 5 dimensions covered over the session
- `discovery.md` written via `doninha-copy-writer` (stage=discovery)
- Clear recommendation (Go / No-Go / Refinar)
- `sessao.md` updated: `stepsCompleted: [1, 2]`
