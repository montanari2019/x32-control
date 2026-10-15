# Step 2: Load Context

## MANDATORY RULES

- Load every artifact already produced upstream — never assume it was already read earlier in this session
- Never reopen or redo Specify/discovery work — that was `doninha-analisar`'s job; this step only loads what already exists
- `feature.md` / `decisions.md` / `discovery.md` / `rca.md` / `pbis.md` / the PBI's own `pbi.md` / `DESIGN.md` / `EXPERIENCE.md` are the primary source of analysis — never copy their content verbatim into a future `spec.md`; reference them by path instead
- `.doninha/STATE.md` and `.doninha/docs/codebase/*` are loaded and summarized here, not duplicated — later steps (spec reuse analysis, gap-routing) read them by reference
- The PBI's own acceptance criteria are immutable / source of truth (`ca_imutaveis: true`) — never silently override them with what the parent `feature.md` says
- Report to the user everything that was loaded and everything that was missing, and why each gap is fine or not, before advancing

---

## SEQUENCE

### 1. Read `sessao-dev.md`

Load `{pasta_pbi}/sessao-dev.md`, seeded in step-01. Extract `item_id`, `ado_id`, `titulo`, `slug`, `tipo`, `pasta_pbi`, `feature_folder`, `modo`.

### 2. Load the parent feature's artifacts

Inside `{feature_folder}` (the same folder `doninha-analisar` wrote into), load — each one only if present:

| File | When | Contains |
| --- | --- | --- |
| `discovery.md` | If DESCOBERTA mode was used upstream | Broad brainstorming, problem exploration, Go/No-Go rationale |
| `rca.md` | If INVESTIGAÇÃO mode was used upstream | The root-cause report — mechanism, `file:line` pinned at a commit, confidence per finding, declared gaps |
| `feature.md` | Almost always | The PRD — problem, solution, business rules, scope, key decisions, rejected alternatives |
| `decisions.md` | Almost always | Detailed decision log with context and rejected alternatives |
| `pbis.md` | Almost always | The full PBI breakdown for the feature — dependencies, rationale, discarded PBIs |

Record each file actually found in `artifacts_loaded`. A missing `discovery.md` is expected whenever the upstream analysis ran in SOLUÇÃO mode — not a gap. A missing `rca.md` is expected in every mode but INVESTIGAÇÃO. A missing `feature.md`/`decisions.md`/`pbis.md` in **ado mode** is not an error either — see step 4 below.

### 2b. When the PBI came out of an investigation

`rca.md` present → this is a **correction PBI**, and the only thing that changes is the direction: the work is still specified, implemented, verified and committed exactly as any other PBI, through the same steps 03→05 and the same `doninha-code-review`. Four rules hold on top of that:

- **The cause is read, not re-derived.** `rca.md` already pins the mechanism at `file:line` and at a commit. Open those lines before writing `spec.md`; re-investigating from the symptom is how a second, quieter theory of the bug gets implemented.
- **The commit `rca.md` pinned is not the branch you are on.** Re-read the cited lines at HEAD before trusting them: a fix may already have landed, or the code may have moved. Diverged → say so and confirm with the user rather than patching a line number that no longer means what the report meant.
- **A conditional requirement stays conditional.** When `rca.md` says "verificar X; se confirmado, corrigir Y", the verification is its own PBI and it comes first. Implementing Y before X is confirmed writes an unverified premise into the code.
- **The regression test is an acceptance criterion, not an extra.** It covers the *class* of the defect, not the single reproduction — that is the difference between the bug not coming back and it coming back through the next field.

`spec.md` references `rca.md` by path and cites the `RF-NN`/`CA-NN` ids it already carries. It never restates the mechanism: two copies of a causal chain drift, and the one in the spec is the copy nobody updates.

### 3. Load this PBI's own artifacts

Inside `{pasta_pbi}` (this specific PBI's folder under `{feature_folder}/pbis/pbi-NNN-slug/`), load — each one only if present:

- `pbi.md` — this PBI's own delivery description, acceptance criteria, and INVEST validation, as recorded by `doninha-analisar`. It may also carry a `Regras de Negócio` section: the analysis session asks where the rules are documented, so they are **either** here **or** in `feature.md`, never split across both. Read whichever exists and treat it as the same input — `spec.md` references the `RN-NN` ids either way, and re-deriving a rule that is already written is how two versions of the same rule start to disagree
- `DESIGN.md` — UI identity/tokens/components, only produced when this PBI touched UI and `doninha-ux` ran during analysis
- `EXPERIENCE.md` — flows/states/interactions/accessibility, same condition as `DESIGN.md`

Record each one found in `artifacts_loaded`. Missing `DESIGN.md`/`EXPERIENCE.md` means this PBI either doesn't touch UI or `doninha-ux` wasn't invoked upstream — not an error here; step-03 is responsible for detecting a UI gap and invoking `doninha-ux` itself if still needed before implementation.

### 4. Handle the ado-only case

If `modo: ado` and none of the folders/files in steps 2–3 exist at all — i.e. there is no local `doninha-analisar` folder for this item whatsoever (a pure ADO-only PBI with no upstream local analysis) — this is a **valid, non-error state**:

- Set `artifacts_loaded: ['ado-only']`
- Rely on whatever the ado work-item itself carried (title, description, acceptance criteria field) from step-01
- Proceed to step 5 without treating this as a gap to fix

Do not attempt to fabricate or reconstruct a local feature/PBI folder in this case.

### 5. Load project memory and codebase knowledge

Load, if present:

- `.doninha/STATE.md` — the project's persistent memory (past decisions, blockers, deferred ideas, lessons)
- `.doninha/docs/codebase/*` — produced by `doninha-project-research`. **Resolve this path via `doninha-workspace-detection`'s "Codebase-context resolution":** when this PBI's work targets a repo under `repos/<name>/`, load that repo's `repos/<name>/.doninha/docs/codebase/*`; otherwise (or if it's absent) fall back to the root location. Never error on a missing per-repo dir — fall back. Follow that skill's **"Reading order inside `CODEBASE_DIR`"**:
  1. `OVERVIEW.md` — the repo's business role and **module map**. Read it first when present.
  2. Use the map (or the paths the PBI touches) to identify the **one** module this PBI lands in, then read only `modules/<slug>.md`. Never enumerate the `modules/` folder.
  3. The technical files (`stack.md`, `structure.md`, `architecture.md`, `conventions.md`, `integrations.md`, `concerns.md`, `testing.md`, `risks.md`) as needed.

Summarize what each says in a few lines for your own working context — do **not** transcribe their content into any artifact this skill writes. Later steps (`step-03-spec-e-tasks.md`'s reuse analysis, gap-routing to a specialist skill) read these by path, not by copy.

### 5b. Resolve the quality-gate configuration

Read `.doninha/integrations/quality-gate.yml` (workspace root, `DONINHA_ROOT`) **once**, here, and carry the result through the rest of the run — step-04's per-task gate, the sub-agent payload, and step-05's closeout gate all use this resolution instead of re-reading the file:

- `sonar: true` → Gate 5 (SonarQube) is enabled for closeout. `complexity: true` → Gate 3 (complexity-check) is enabled per task and at closeout.
- File absent, key absent, or `false` → that gate is **DISABLED** for this project: it is not run, and it is reported as `DISABLED (off in quality-gate.yml)` wherever the gate table appears. Do not treat this as a gap, do not ask the user to enable it, and do not create the file — the team's pipeline owns those checks by default. Mention it in one line of the summary below, nothing more.

Record the resolution as `quality_gates: { sonar: on|off, complexity: on|off }` in `sessao-dev.md` (step 8).

If `.doninha/docs/codebase/*` is missing or incomplete, note it as a gap: gap-routing and reuse analysis in step-03 will have less to work with, but this step does not stop for it — do not trigger `doninha-project-research` from here; that is a decision for the user or a later step, never assumed automatically.

A **missing module doc** (`modules/<slug>.md` absent, or its map row shows `—`) is **not** a gap in the same sense: it means that module has not been researched yet. Note it, work from the technical files and the real code, and let step-03 decide whether to suggest researching that one module. Same rule: never trigger research from here.

### 6. Treat acceptance criteria as immutable — check for conflicts

The PBI's own acceptance criteria — from the work-item (ado mode) or from `pbi.md` (local-only mode) — are the **source of truth** for this development session. Set `ca_imutaveis: true` unconditionally.

Compare them against whatever `feature.md` (the PRD) states for this PBI, when `feature.md` was loaded:

- **Consistent, or `feature.md` simply doesn't go into this level of detail:** proceed — `feature.md` is background context, not a competing source of truth.
- **Genuinely conflicting** (the PRD states something the PBI's own CAs contradict): **STOP**. Do not silently pick one side. Present both to the user:

  > "Os critérios de aceite da PBI **{titulo}** divergem do que `feature.md` descreve:
  >
  > **CA da PBI (fonte de verdade):**
  > {lista dos CAs}
  >
  > **O que `feature.md` diz:**
  > {trecho conflitante}
  >
  > Como devo prosseguir? **[P]** Seguir os CAs da PBI (padrão) | **[F]** Seguir o `feature.md` | **[A]** Ajustar antes de decidir"

  **STOP — wait for the user's decision before continuing.**

### 7. Present the loaded/missing summary

> "Contexto carregado para **{titulo}** (`{pasta_pbi}`):
>
> ✅ Carregados: {lista de artifacts_loaded}
> ⚠️ Ausentes: {lista do que não foi encontrado, com nota se é esperado ou não}
>
> **Fonte primária de análise:** `{feature_folder}` (quando existir)
> **Memória do projeto:** `.doninha/STATE.md` {carregado/ausente}
> **Conhecimento de codebase:** `.doninha/docs/codebase/*` {carregado/ausente/incompleto}
> **Gates de qualidade opcionais:** Sonar {ligado/desligado} · complexity {ligado/desligado} {— `quality-gate.yml` ausente: ficam com o pipeline do time}
>
> Critérios de aceite tratados como imutáveis (fonte de verdade da PBI).
>
> Pronto para gerar spec e tasks? **[S]** Sim | **[Ajustar X]**"

**STOP — wait for confirmation before advancing**, unless the user's original invocation already made continuation implicit for this whole run.

### 8. Update `sessao-dev.md`

Update the frontmatter:

```yaml
artifacts_loaded: ['{list of every file actually found}']   # or ['ado-only']
ca_imutaveis: true
quality_gates: { sonar: off, complexity: off }   # resolved in 5b from .doninha/integrations/quality-gate.yml
stepsCompleted: [1, 2]
proxima_fase: 'spec-e-tasks'
```

This updates the fields shown above and nothing else. `status` stays `developing` — only
`step-01-identificar` (seed) and `step-05-fechamento` (`done`/`paused`) ever write it.

### 9. Route to the next step

Load `./step-03-spec-e-tasks.md`.

---

## SUCCESS METRICS

- `{feature_folder}` artifacts loaded when present: `feature.md`, `decisions.md`, `discovery.md` (only if DESCOBERTA), `rca.md` (only if INVESTIGAÇÃO), `pbis.md`
- With `rca.md` present: the cited `file:line` opened at HEAD and any divergence from the pinned commit raised, never silently assumed still valid
- This PBI's own `pbi.md` (and `DESIGN.md`/`EXPERIENCE.md` if this PBI touched UI) loaded from `{pasta_pbi}`
- `ado-only` correctly recognized as a valid, non-error state when `modo: ado` and no local analysis folder exists at all
- `.doninha/STATE.md` and `.doninha/docs/codebase/*` loaded and summarized, never transcribed verbatim into any artifact
- No Specify/discovery work redone — this step only loads what already exists
- Acceptance criteria treated as immutable (`ca_imutaveis: true`); any genuine conflict with `feature.md` stopped for explicit user decision
- Clear loaded/missing summary presented to the user before advancing
- `sessao-dev.md` updated: `artifacts_loaded`, `ca_imutaveis`, `stepsCompleted: [1, 2]`, `proxima_fase: 'spec-e-tasks'`
- Correct routing to `step-03-spec-e-tasks.md`
