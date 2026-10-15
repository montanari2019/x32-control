# Step 5B: UX Proposal for PBIs with Interface

## MANDATORY RULES

- Invokes the `doninha-ux` skill as a sub-flow — it drives the whole UX spec process
- UX artifacts are saved INSIDE the PBI's folder: `{feature_folder}/pbis/pbi-{NNN}-{slug}/`
- This step is optional (P2) — if `doninha-ux` is not installed yet, degrade with a notice and move on
- No frontend implementation happens here — that belongs to `doninha-desenvolver` (F3), once it detects the UI gap during development

---

## GOAL OF THIS STEP

For each PBI with a user interface, produce the UX spec — `DESIGN.md` (identity/tokens/components) + `EXPERIENCE.md` (flows/states/interactions/accessibility) — via the `doninha-ux` skill, before development starts.

---

## SEQUENCE

### 1. Identify PBIs with UI

List the PBIs created in step-05. For each, check whether its description/CAs mention UI, screens, or forms.

Present to the user:

> "PBIs com interface de usuário identificadas:
>
> [para cada PBI com UI:]
> - **PBI [N]** — [título] → `pbis/pbi-[NNN]-[slug]/`
>
> Para cada uma vou produzir uma proposta de UX via `doninha-ux`.
> Começamos pela PBI [N]?
> **[S]** Sim | **[Reordenar]** Prefiro outra ordem"

**STOP — wait for confirmation.**

### 2. Check `doninha-ux` availability

If the `doninha-ux` skill is not available in this installation:

> "A skill `doninha-ux` ainda não está disponível neste projeto. Vou pular a proposta de UX — as PBIs seguem para o fechamento sem `DESIGN.md`/`EXPERIENCE.md`. O gap de UI ainda será detectado e tratado por `doninha-desenvolver` durante o desenvolvimento."

Skip to step 4 (confirm coverage) treating all UI PBIs as skipped.

### 3. For each PBI with UI: invoke `doninha-ux`

Repeat for every PBI with UI, in order:

#### 3a. Confirm the PBI folder

The folder was already created in step-05:
```
{feature_folder}/pbis/pbi-{NNN}-{slug}/
```
`DESIGN.md` and `EXPERIENCE.md` are saved directly into it.

#### 3b. Invoke `doninha-ux`

Tell the user:

> "🎨 Iniciando proposta de UX para **PBI [N] — [título]**.
>
> Contexto que levarei:
> - **O que entrega:** [descrição da PBI]
> - **Critérios de aceite:** [lista CAs]
> - **Regras de negócio relevantes:** [das RNs da Feature]
> - **Output path:** `{feature_folder}/pbis/pbi-{NNN}-{slug}/`"

Invoke the `doninha-ux` skill with this context. **Follow `doninha-ux`'s flow through to completion** — it produces `DESIGN.md` and `EXPERIENCE.md` in the given output path.

#### 3c. Confirm the UX spec

After `doninha-ux` finishes:

> "Proposta de UX da PBI [N] concluída:
> - `{feature_folder}/pbis/pbi-{NNN}-{slug}/DESIGN.md`
> - `{feature_folder}/pbis/pbi-{NNN}-{slug}/EXPERIENCE.md`
>
> Aprovado? **[A]** Sim | **[Ajustar X]** para corrigir"

**STOP — wait for approval.**

#### 3d. Register with the tracker (only if configured)

If `.doninha/integrations/azure-devops.yml` exists, append a reference to the UX artifacts on the PBI's tracker work item (paths to `DESIGN.md`/`EXPERIENCE.md`). Skip silently if local-only.

#### 3e. Record in the session

Update `sessao.md` — append to `ux_proposals`:
```yaml
ux_proposals:
  - pbi_n: [N]
    pbi_id: '{pbi-NNN}'
    pasta: '{feature_folder}/pbis/pbi-{NNN}-{slug}'
```

### 4. Confirm coverage

After processing every PBI with UI (or after skipping due to `doninha-ux` being unavailable):

> "Proposta de UX concluída para [X] PBI(s):
> [lista: PBI N — título]
>
> Pronto para fechar a análise? **[S]** Sim — ir para fechamento"

**STOP — wait for confirmation.**

### 5. Update frontmatter

Update `sessao.md`:
- `stepsCompleted`: append `'5b'`

This appends to the field named above and nothing else. `status` stays `analyzing` — only
`step-06-fechamento` closes the analysis.

### 6. Advance

Load `./step-06-fechamento.md`.

---

## SUCCESS METRICS

- `DESIGN.md` + `EXPERIENCE.md` generated for each PBI with UI, via `doninha-ux`, when available
- Artifacts saved at `{feature_folder}/pbis/pbi-{NNN}-{slug}/DESIGN.md` and `EXPERIENCE.md`
- Graceful degradation (notice, no error) when `doninha-ux` isn't installed
- No frontend implementation attempted in this step
- Tracker updated with UX references only when `.doninha/integrations/azure-devops.yml` exists
- `ux_proposals` recorded in `sessao.md`
- `stepsCompleted` includes `'5b'`
