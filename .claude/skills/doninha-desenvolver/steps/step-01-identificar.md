# Step 1: Identify the Work Item

## MANDATORY RULES

- Resolve `.doninha/integrations/azure-devops.yml` presence **before** doing anything else — it decides ado vs local-only mode for the whole session
- Never hardcode a tracker org/project name, an MCP tool/server name, or a work-item type name anywhere in this flow — every type/state/field name comes from the project's own integration config, resolved generically at run time
- If the resolved type diverges from what the user declared, **STOP** and ask for confirmation — never guess past a mismatch
- `pasta_pbi` is always the canonical `.doninha/docs/modules/module_NNN_name/feature_NNN_name/pbis/pbi-NNN-slug/` path — a tracker id is a field, never part of a folder name
- Always check for an existing `sessao-dev.md` before creating a new one, and offer resume instead of restarting
- If the item's own status is already "done"/finished, confirm with the user before reopening it
- Seed `sessao-dev.md` before routing to step-02, **always including `status`** — it is the state-contract field the doninha engine routes on (see `SKILL.md`)
- A resumed `sessao-dev.md` with no `status` is repaired here, before routing — never left for a later step

---

## SEQUENCE

### 1. Resolve config and mode

Check for `.doninha/integrations/azure-devops.yml`:

- **Present** → this session runs in **ado mode**. Read the file's type-map, states, custom-field map, and org/project identifiers — these are the only source of truth for type/state/field names in this flow. Resolve the integration skill to invoke by the name/entry point declared in that config; never hardcode a literal skill or MCP server name here.
- **Absent** → do **not** silently fall to local-only. First **offer to configure the tracker now**:
  > "Não há integração de tracker configurada. Quer configurar o Azure DevOps agora (respondo algumas perguntas sobre sua organização/projeto) ou seguir local-only?"

  **STOP — wait for the answer.**
  - **Configure:** invoke the Azure DevOps integration skill and run its **first-run setup** (org/project + destino (área/sprint) Q&A → writes `.doninha/integrations/azure-devops.yml`; see that skill's "First-run configuration"). Once written, this session runs in **ado mode** — read the just-written config exactly as in the Present branch.
  - **Local-only:** proceed **local-only** and locate the PBI directly on disk. It's information, not an error; the offer can be made again on a future run.

### 2. Identify the item

**Check the invocation for a target first.** When doninha routes this skill it hands the target over
in the prompt, as a `Pasta do alvo: <caminho>` line plus `PBI: <id> — <título>` and
`Feature do PBI: <caminho>`. That path **is** `pasta_pbi`, already resolved against the canonical
layout — take it as given, skip the question below, and go straight to step 4. Asking "qual item?"
when the invocation already said so burns a turn on a question that was already answered.

Otherwise, if the user's own words name a work-item id or a local PBI reference, use that. Failing
both, ask:

> "Qual item você quer desenvolver? Pode ser o ID do work item no tracker (se configurado) ou a referência do PBI local (ex.: `pbi-003-nome-curto` ou o caminho da feature)."

**STOP — wait for the answer before continuing.**

### 3a. ado mode — read the work item

Invoke the configured Azure DevOps integration skill to fetch the work item by id. Extract, using the field names the config maps to (never a literal hardcoded field name):

- `titulo` — the item's title
- `tipo_resolvido` — the item's resolved type, per the tracker
- `estado` — the item's current state/status
- acceptance criteria (if the config maps a field for it)
- parent reference (if any), used to locate/confirm the owning feature

Derive `slug` from the title: lowercase, spaces → hyphens, special characters removed, max 40 chars.

### 3b. Validate type vs the type-map

Compare `tipo_resolvido` against the config's type-map:

- **Matches (or user didn't declare an expected type):** proceed with `tipo = tipo_resolvido`.
- **Diverges from what the user declared or expected:** stop and ask —
  > "O item resolvido é do tipo '{tipo_resolvido}' segundo o type-map configurado, mas isso diverge do que foi indicado. Confirma que devo prosseguir como '{tipo_resolvido}', ou o item/tipo está errado?"
  **STOP — wait for confirmation before continuing.** Never silently pick one side.

### 3c. local-only mode — locate the PBI on disk

No tracker read happens in this mode. Locate the PBI directly under the canonical path:

```
.doninha/docs/modules/module_NNN_name/feature_NNN_name/pbis/pbi-NNN-slug/
```

Resolution order:

1. If the user gave a path or a clear `pbi-NNN-slug` reference, look it up directly.
2. Otherwise, search `.doninha/docs/modules/*/*/pbis.md` and `.doninha/docs/modules/*/*/sessao.md` (both written upstream by `doninha-analisar`, one level below `module_NNN_name/`) for a matching PBI id, slug, or title fragment, and confirm the match with the user before proceeding. Mind the depth: those files live at `.doninha/docs/modules/module_NNN_name/feature_NNN_name/`, so a glob that drops `modules/` matches nothing and looks exactly like "não existe PBI nenhuma".

Extract `titulo`, `slug`, and `tipo` from the PBI's own artifact (e.g. its `pbi.md`) — the type here is whatever `doninha-analisar` already recorded, still resolved through the same project type-map for consistency, never a literal type name invented in this step.

If no matching PBI folder is found, say so plainly and ask the user to point at the right feature/PBI or run `doninha-analisar` first — do not fabricate a folder.

**A `pbi-NNN-slug/` folder without a `pbi.md` inside is not a usable PBI** — the analysis created the
folder and stopped before writing the doc, so there is nothing here to develop against. Say which
folder it is and route the user back to `doninha-analisar` for that feature instead of inventing
acceptance criteria. This is also why doninha itself derives no `desenvolver` step for such a folder,
so it is the state that most often shows up as "a análise disse que era para desenvolver, mas não há
o que desenvolver".

### 4. Resolve `pasta_pbi` and `feature_folder`

- **ado mode:** using the parent reference and the tracker's title for it, locate (or confirm) the matching `feature_NNN_name` folder already produced by `doninha-analisar`, then the specific `pbis/pbi-NNN-slug/` folder inside it. The local `pbi-NNN` sequence and slug are what name the folder — the tracker id is never used to build the folder name.
- **local-only mode:** `pasta_pbi` and `feature_folder` are already known from step 3c.

If the folder truly does not exist yet in either mode, confirm with the user before creating it — this step expects the PBI folder to already exist from `doninha-analisar`; creating it fresh here is the exception, not the norm.

### 5. Detect an existing session and offer resume

Check `{pasta_pbi}/sessao-dev.md`:

- **Exists, with non-empty `stepsCompleted`:** present it —
  > "Encontrei uma sessão de desenvolvimento em andamento para **{titulo}** (`{pasta_pbi}`), no passo {stepsCompleted}. Quer **continuar** de onde parou ou **reiniciar** do zero?"
  **STOP — wait for the decision.** If continue: load the existing `sessao-dev.md`, **repair `status` if absent** (see 5b), then jump to the step indicated by `proxima_fase`/`stepsCompleted` (do not re-run this step's seeding). If restart: proceed below, confirming first that overwriting the existing session state is intended.
- **Does not exist:** proceed below.

### 5b. Repair a tracker written before the state contract

Sessions created by older versions of this skill have no `status` field. The doninha engine
tolerates that as "still developing" — which means a finished PBI is reported as in-flight
forever and never counts toward workflow progress. Repair it **here**, on resume, before routing
anywhere:

If the loaded `sessao-dev.md` has **no** `status` field (or it is empty), write the value that
matches what is already recorded in the file:

| Found in `stepsCompleted` | Write |
| --- | --- |
| includes `5` (closeout ran) | `status: 'done'` |
| anything else | `status: 'developing'` |

Never ask about this — there is no decision to make. Just say it in one line, so the user
understands why the progress reading jumps:

> "Completei o `status` do tracker desta PBI (`{valor}`) — ele foi criado antes do campo existir."

If `status` is already present, leave it exactly as it is: the file's own record wins over
anything inferred from `stepsCompleted`. In particular, a tracker already marked `paused` must
not be rewritten to `developing` by this repair.

### 6. Confirm before reopening a finished item

If the item's own status/state is already "done"/finished — per the tracker's state config in ado mode, or per the PBI's own recorded status in local-only mode — stop and ask:

> "O item **{titulo}** já está marcado como concluído. Quer mesmo reabrir para desenvolvimento?"

**STOP — wait for confirmation before continuing.**

### 7. Seed `sessao-dev.md`

```bash
mkdir -p "{pasta_pbi}"
```

Write `{pasta_pbi}/sessao-dev.md` using the exact frontmatter schema in `assets/sessao-dev-template.md`, filling in everything already known:

```yaml
---
status: 'developing'
stepsCompleted: [1]
item_id: '{local pbi-NNN id}'
ado_id: '{tracker id, only when ado mode — otherwise empty}'
titulo: '{titulo}'
slug: '{slug}'
tipo: '{tipo resolved above}'
pasta_pbi: '{pasta_pbi}'
feature_folder: '{feature_folder}'
modo: '{local-only|ado}'
artifacts_loaded: []
ca_imutaveis: true
spec_construido: false
total_tasks: 0
skills_necessarias: []
proxima_fase: 'carregar-contexto'
riscos: []
---
```

This file is this skill's own session state — written directly, never through `doninha-copy-writer`, and never touching `status.yml`.

`status: 'developing'` is the **state contract** (see `SKILL.md`), not a cosmetic marker: it is the field the doninha engine reads to know this PBI has work in flight. Only two steps ever write it — this one seeds `developing`, and `step-05-fechamento` closes with `done` or `paused`. No other step touches it. Note that it is a different thing from the tracker's own remote state in ado mode: this field is local and always written, whether the project runs local-only or with an external work-item tracker.

### 8. Route to the next step

Load `./step-02-carregar-contexto.md`.

---

## SUCCESS METRICS

- Mode resolved (`ado` vs `local-only`) from `.doninha/integrations/azure-devops.yml` presence, before anything else
- A `Pasta do alvo:` line in the invocation taken as the resolved `pasta_pbi` — never re-asked
- Work item read (ado mode) or PBI located on disk (local-only mode) — no literal tracker org, MCP tool/server, or work-item type name hardcoded anywhere in the process
- A PBI folder without `pbi.md` reported as such and routed back to `doninha-analisar` — never developed against invented criteria
- Resolved type validated against the project's own type-map; any mismatch stopped for explicit user confirmation
- `pasta_pbi` resolved to the canonical `.doninha/docs/modules/module_NNN/feature_NNN/pbis/pbi-NNN-slug/` path — tracker id never used in the folder name
- Existing session detected and resume offered when applicable
- A resumed tracker missing `status` repaired from its own `stepsCompleted`, announced in one line, never asked about — and an existing `status` (including `paused`) left untouched
- An already-"done" item confirmed with the user before reopening
- `sessao-dev.md` seeded with the full template schema, `status: 'developing'` and `stepsCompleted: [1]`
- Correct routing to `step-02-carregar-contexto.md`
