# Step 6: Process Closeout

## GOAL

Close the session's state, then present the full summary of what was produced.

---

## MANDATORY RULES

- **The frontmatter write comes BEFORE the summary.** The summary's "Próximos passos" tells the
  user to run `doninha-desenvolver`, and `status: 'analyzed'` is what makes that step exist. Any
  turn that ends between the two — context exhausted, the user interrupting, the agent simply
  stopping after a long summary — leaves a feature stuck in `analyzing` while the user has already
  been told to move on. `doninha-desenvolver` then answers "não tem alvo", which reads as a broken
  product and is really just an unwritten field. Its sibling `doninha-desenvolver/step-05` closes
  its own tracker before its summary for the same reason.
- Every PBI folder created in step 5 must have its `pbi.md` on disk before `analyzed` lands. A
  folder without the doc is invisible to the doninha engine — it derives no `desenvolver` step —
  so `analyzed` over an undocumented folder produces the same dead end as not closing at all.
- `status: 'analyzed'` is still written **after** the memory record of step 1: it is the release
  signal, and releasing work built on a half-finished analysis is what the ordering prevents.

---

## SEQUENCE

### 1. Record decisions and deferred ideas

If the `doninha-memory` skill (F1) is available in this project, follow its event→action rules to record into `.doninha/STATE.md`:
- Architectural/product decisions made during this analysis that outlive this single feature
- Deferred ideas surfaced but explicitly out of scope for this feature

If `doninha-memory` is not available, write directly to `.doninha/STATE.md` under its own sections (Recent Decisions / Deferred Ideas) — same content, just without the dedicated skill's event routing.

### 2. Verify every PBI folder has its `pbi.md`

For each `pbis/pbi-[NNN]-[slug]/` folder created in step 5, confirm `pbi.md` is actually on disk.

If any folder is missing it, the decomposition did not finish: go back to step 5 for that PBI and
write the doc before closing. Do **not** flip `status` over a folder without its `pbi.md` — the
engine skips such a PBI silently, and the user is left with a closed analysis and no work to do.

### 3. Update final frontmatter

Update `sessao.md`:
- `stepsCompleted`: complete with `6`. If step-05b ran, the list already includes `'5b'`.
  - Full DESCOBERTA run: `[1, 2, 3, 4, 5, '5b', 6]` (or without `'5b'` if UX was skipped)
  - Full SOLUÇÃO run: `[1, 2, 4, 5, '5b', 6]` (or without `'5b'` if UX was skipped)
  - Full EXPRESS run: `[1, '2c', '5b', 6]` (or without `'5b'` if UX was skipped) — express
    produces the PRD and the single PBI inside step 2c, so steps 2/3/4/5 never ran and must not
    be listed as if they had
  - Full INVESTIGAÇÃO run: `[1, 2, 3, 4, 5, '5b', 6]` (or without `'5b'` if UX was skipped) —
    step 2 is `step-02d-investigacao` and step 3 is `step-03b-refutacao`'s evidence gate; the
    numbering is the same because the pipeline is the same
- `status: 'analyzed'`

This is the **last write of the whole skill**. `analyzed` is the state contract's release signal:
the moment it lands, the doninha engine stops deriving `analisar` for this feature and starts
deriving one `desenvolver` step per PBI. It goes here — after the memory record and the `pbi.md`
check, before the summary — so that the instant the user reads "run `doninha-desenvolver`", the
step it names already exists.

Leave every other field as the earlier steps recorded it — this step only completes
`stepsCompleted` and flips `status`.

### 4. Present the summary

> "## ✅ Análise Concluída — [feature_title]
>
> **Modo:** [DESCOBERTA / SOLUÇÃO / EXPRESS / INVESTIGAÇÃO]
>
> ### Documentos locais em `[feature_folder]/`:
> [se modo descoberta: - `discovery.md` — brainstorming e validação]
> [se modo express e o card tinha imagens: - `anexos/` — imagens do card lidas na análise]
> [se modo investigação: - `rca.md` — laudo técnico: causa raiz, evidência, lacunas e confiança]
> [se modo investigação: - `refutacao.md` — veredito do estágio adversarial, por eixo]
> - `feature.md` — PRD completo (problema, solução, RNs, escopo, decisões)
> - `decisions.md` — log de decisões com alternativas rejeitadas
> - `pbis.md` — decomposição em PBIs, dependências, justificativa
> - `sessao.md` — registro completo da sessão
>
> ### Pastas por PBI:
> [para cada PBI criada:]
> - `pbis/pbi-[NNN]-[slug]/`
>   - `pbi.md` — o que entrega, CAs, INVEST
>   [se diagrama gerado: - `diagrama.puml` — fluxo de informação]
>   [se UX rodou: - `DESIGN.md` + `EXPERIENCE.md` — spec UX]
>
> [se tracker configurado:]
> ### Registrado no tracker:
> [lista de work items criados/vinculados]
>
> ### Próximos passos:
> [se modo express: > Origem: {card do tracker / requisitos} — nenhum work item novo foi criado no tracker.]
> [se modo investigação: > A correção não foi feita aqui. Daqui pra frente o caminho é o mesmo de uma feature nova: `doninha-desenvolver` implementa cada PBI e `doninha-code-review` revisa — a diferença é só o alvo, que é o defeito descrito em `rca.md`.]
> 1. PBIs prontas para desenvolvimento — use `doninha-desenvolver` com o **id de cada PBI** (não o da Feature)
> 2. Ordem sugerida de implementação: ver a seção de dependências em `pbis.md`
> [se modo investigação: > As PBIs de **verificação** vêm antes das de correção que elas destravam, e a remediação de dados é a última — a ordem está em `pbis.md`.]
> 3. PBIs com UI já têm spec UX em `pbis/pbi-[NNN]-[slug]/` — entrar diretamente na implementação"

### 5. Close

Workflow complete. Route nowhere.

---

## SUCCESS METRICS

- Decisions/deferred ideas recorded in `.doninha/STATE.md` **first**
- Every PBI folder verified to have its `pbi.md` before the status flip — no folder left invisible to the engine
- `sessao.md` frontmatter completed with the full `stepsCompleted` list
- `status: 'analyzed'` written **before** the summary, after the memory record and the `pbi.md` check — the step the summary points at exists by the time the user reads about it
- Summary presented with all local docs + PBI folders listed
- Tracker registrations listed only when a tracker integration exists
- Next steps point to `doninha-desenvolver` with a **PBI id** (never a Feature id)
- INVESTIGAÇÃO: `rca.md` and `refutacao.md` listed among the local docs, and the handoff says in one line that dev and review run exactly as for any other feature
- Implementation order referenced via `pbis.md`'s dependency info
