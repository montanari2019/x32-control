# Step 1: Session Setup

## MANDATORY RULES

- Never presume the mode (DESCOBERTA vs SOLUÇÃO vs EXPRESS vs INVESTIGAÇÃO) — always ask
- Resolve config (`DONINHA.md`, tracker integration) before asking anything
- You are a facilitator — confirm, don't invent, the feature title/topic
- Initialize `sessao.md` before routing to the next step, **always including `status`** — it is the state-contract field the doninha engine routes on (see `SKILL.md`)
- Always check for an existing session before creating new directories
- A resumed session whose `sessao.md` has no `status` is repaired here, before routing — never left for a later step
- INVESTIGAÇÃO only: resolve the capability map **here**, once, and pass it down — a later step that finds a capability missing declares the gap, it never re-asks

---

## SEQUENCE

### 1. Resolve config

Read `DONINHA.md`'s YAML frontmatter, key `analise.aprovador` (generic role / name / "nenhum") — never assume a hardcoded person. If the frontmatter or the `analise` key is absent, treat it as "nenhum" and mention to the user that adding `analise.aprovador` to `DONINHA.md`'s frontmatter lets them name an approver going forward.

Check for `.doninha/integrations/azure-devops.yml`:

- **Present** → tracker work-item creation is available later (step-05); read org/project/type-names when needed.
- **Absent** → do **not** silently go local-only. First **offer to configure the tracker now**:
  > "Sem integração de tracker configurada. Quer configurar o Azure DevOps agora (pergunto sobre organização/projeto) ou seguir local-only nesta análise?"

  **STOP — wait for the answer.** If **configure**: invoke the Azure DevOps integration skill and run its **first-run setup** (org/project + destino (área/sprint) Q&A → writes `.doninha/integrations/azure-devops.yml`; see that skill's "First-run configuration"), after which tracker work-item creation is available in step-05. If **local-only**: docs/PBIs are generated under the canonical path with local ids, no work item is created — the offer can be made again on a future run.

### 2. Get the feature topic

If not already provided in the invocation, ask:

> "Vamos iniciar uma análise. Em uma frase: qual é a oportunidade ou problema que você quer explorar?"

**STOP — wait for the answer before continuing.**

Derive `feature_title` from the answer (ask the user to confirm/refine a short title if the raw answer is long) and `feature_slug` = title in lowercase, spaces→hyphens, special characters removed, max 40 chars.

**The answer is only a work-item id or URL** (e.g. `12345`, `https://dev.azure.com/.../_workitems/edit/12345`) — the express case, where the card *is* the topic. Resolve the title before naming anything: with a tracker integration configured, read that single work item through the Azure DevOps integration skill and propose its title as `feature_title`, confirming with the user. Without an integration (or if the read fails), say so in one line and ask for a short title instead — never derive a folder name from the bare id, which produces `feature_001_12345` and a folder nobody can recognize three weeks later. The full card read (comments, attachments, images) is **not** done here: it belongs to `step-02c-express.md`, which is where its cost is justified.

### 3. Detect an existing session

Search `.doninha/docs/modules/*/*/sessao.md` for a `feature_slug` match (read the frontmatter of any candidate). Also accept a fuzzy title match if the user's topic closely resembles an existing feature.

- **Found, with non-empty `stepsCompleted`:** present it —
  > "Encontrei uma análise em andamento para **[feature_title]** (`[feature_folder]`), no passo [stepsCompleted]. Quer **continuar** de onde parou ou **reiniciar** do zero?"
  **STOP — wait for the decision.** If continue: load `sessao.md`, **repair `status` if absent** (see 3b), then jump to the step indicated by `stepsCompleted`, routing by the **saved `mode`** (`descoberta` → `./step-02a-descoberta.md`, `solucao` → `./step-02b-solucao.md`, `express` → `./step-02c-express.md`, `investigacao` → `./step-02d-investigacao.md`) — never re-ask the mode, the topic, or the module/numbering, all of which are already in the file. In `investigacao`, `symptom_class` and `capabilities` are recorded there too: reuse them, never re-resolve. Do not re-ask anything else recorded there either: the destination step recovers its own partial state (e.g. `initial_answers`, `ideation_technique`, `grilling.abertos`) from `sessao.md` and skips the questions it already has answers for. If restart: proceed to step 4 below as if nothing existed (do not delete the old folder — create the new session content on top of the existing files, confirming with the user first if this would overwrite discovery/feature/pbis content).
- **Not found:** widen the search once before proceeding — glob `.doninha/docs/modules/*/*/feature.md` for a folder that covers this same feature but has **no** `sessao.md` beside it (an analysis produced by some other flow, invisible to the search above). If one matches the topic, present it and ask whether to continue from that feature or to create a new one anyway. **STOP — wait for the decision.** Nothing matches: proceed to step 4.

### 3b. Repair a tracker written before the state contract

Sessions created by older versions of this skill have no `status` field. The doninha engine
tolerates that as "still analyzing" — which means a finished analysis stays reported as
in-progress forever, and its PBIs never become actionable work. Repair it **here**, on resume,
before routing anywhere:

If the loaded `sessao.md` has **no** `status` field (or it is empty), write the value that
matches what is already recorded in the file:

| Found in `stepsCompleted` | Write |
| --- | --- |
| includes `'reprovado'` | `status: 'rejected'` |
| includes `6` (closeout ran) | `status: 'analyzed'` |
| anything else | `status: 'analyzing'` |

Never ask about this — there is no decision to make. Just say it in one line, so the user
understands why the progress reading jumps:

> "Completei o `status` do tracker desta análise (`{valor}`) — ele foi criado antes do campo existir."

If `status` is already present, leave it exactly as it is: the file's own record wins over
anything inferred from `stepsCompleted`.

### 4. Resolve module and feature numbering

List the existing `module_NNN_name` directories under `.doninha/docs/`. Ask the user:

> "Essa análise pertence a qual módulo? [lista dos módulos existentes] ou **[N] Novo módulo**"

**STOP — wait for the selection.**

- **Existing module:** `feature_NNN` = next sequential number among `feature_NNN_*` directories already inside that module folder (max existing + 1, zero-padded to 3 digits; `001` if none exist).
- **New module:** ask for a short module name, derive its slug, and compute `module_NNN` = next sequential number among all `module_NNN_*` directories under `.doninha/docs/` (max existing + 1, zero-padded to 3 digits). `feature_NNN` starts at `001` inside it.

Set `feature_folder` = `.doninha/docs/modules/module_{NNN}_{module_slug}/feature_{NNN}_{feature_slug}/`.

Present:

> "Pasta local será criada em: `{feature_folder}`"

### 5. Ask the mode

Always ask — never presume, never default:

> "Como você descreveria a situação atual desta oportunidade?
>
> **[1] DESCOBERTA** — Ainda é uma ideia nebulosa. Preciso explorar se vale a pena, entender o problema em profundidade, e validar com o aprovador configurado antes de avançar.
>
> **[2] SOLUÇÃO** — O problema já está claro e bem entendido. Preciso analisar como viabilizá-lo e partir para a documentação.
>
> **[3] EXPRESS** — Já tenho o item definido: um card do tracker ou requisitos escritos. Quero o PRD direto, sem brainstorming e sem quebra em PBIs — o item já é o PBI.
>
> **[4] INVESTIGAÇÃO** — Alguma coisa já está quebrada e ninguém sabe por quê. Preciso achar a causa raiz com evidência antes de decidir o que corrigir.
>
> Digite 1, 2, 3 ou 4."

**STOP — wait for the selection before continuing.**

The first three are not degrees of the same thing: they differ in what is already decided. DESCOBERTA still asks *whether*, SOLUÇÃO asks *how*, EXPRESS asks neither — someone already decided both, and what is missing is the documented form. Choosing EXPRESS for a still-vague idea produces a confident PRD over an empty card, which is worse than no PRD; when the answer to "what exactly does this item deliver?" is a shrug, say so and offer SOLUÇÃO instead.

INVESTIGAÇÃO is not on that axis: it asks *why*, and what it analyzes already exists in production. Choose it only when the thing is broken and the cause is unknown — a defect whose cause is already understood is a SOLUÇÃO (or an EXPRESS, when the card already says what to change). It costs a whole investigation to conclude what the user already knew.

Mode `investigacao` → run section 5b before initializing the session. The other three modes skip it entirely.

### 5b. Symptom class and capabilities (INVESTIGAÇÃO only)

Two questions decide what this investigation can read. Both are cheap, and skipping them costs far more later: a step that reaches for a log nobody configured stalls mid-flow, and one that assumes a log exists concludes from nothing.

**First, the symptom class.** Ask — the classes are about the *shape* of the failure, not the domain:

> "Para eu saber o que preciso conseguir ler, como esse defeito se manifesta?
>
> **[1]** Dado errado / comportamento errado — o sistema responde, mas responde errado
> **[2]** Erro, timeout ou lentidão — 5xx, requisição que não volta, latência alta
> **[3]** Concorrência, memória ou CPU — trava, vaza, consome demais, piora com carga
> **[4]** Regressão — funcionava, parou depois de uma mudança
>
> Digite o número. Se for mais de um, diga quais."

**STOP — wait for the answer.** Record it as `symptom_class`. More than one class → the union of their required capabilities.

**Then the capability map.** Invoke `doninha-observability-context` with the chosen class(es). That skill owns the whole resolution — config → codebase docs → environment probe → ask the user → `none` — and it asks **only** for the roles the class needs:

| `symptom_class` | Required | Offered, not pressed |
| --------------- | ------------------------------ | -------------------- |
| `dado-errado`   | `source`                       | `logs`               |
| `erro-latencia` | `source`, `logs`, `metrics`, `edge` | —               |
| `concorrencia`  | `source`, `logs`               | `runtime`            |
| `regressao`     | `source`, `tracker`            | —                    |

Rules this step enforces around that call:

- **`source` is the only hard requirement.** Unresolvable → say so plainly and stop; there is no root-cause analysis without the code. Every other role resolving to `none` is a gap to declare, not a reason to stop.
- **Never name a product in the questions.** The user is asked where the logs live, not whether they use Datadog. Which tool it turns out to be is data, and it lands in `observability.yml` — never in these instructions.
- **Ask once per project.** The answers are cached by that skill. A second investigation in the same project asks nothing.
- **Report the map back in one line** before moving on, so the user knows what the session can and cannot see:

> "Capacidades desta investigação: código ✓ · log ✓ (Datadog) · métrica ✓ · borda ✗ (sem acesso).
> O que não tiver, eu declaro como lacuna no laudo em vez de supor."

Record the resolved map and the gaps in `sessao.md` (`capabilities`, `lacunas`). They are read by step-02d and step-03b, and quoted in `rca.md`.

### 6. Initialize the session

Create the directories and write `sessao.md`:

```bash
mkdir -p "{feature_folder}"
```

`{feature_folder}/sessao.md` frontmatter:

```yaml
---
status: 'analyzing'
stepsCompleted: [1]
feature_id: '{feature_folder local id, e.g. feature_NNN}'
feature_title: '{feature_title}'
feature_slug: '{feature_slug}'
feature_folder: '{feature_folder}'
mode: '{descoberta|solucao|express|investigacao}'
source_ref: ''
attachments_read: ''
rn_placement: ''
business_rules: []
initial_answers: {}
ideation_technique: ''
grilling: {}
derivado: {}
alternativas: ''
validation_approved: false
brainstorming_notes: ''
pbis_created: []
ux_proposals: []
symptom_class: []          # investigacao only — e.g. ['erro-latencia']
capabilities: {}           # investigacao only — role → { provider, access, scope }
lacunas: []                # investigacao only — roles resolved as none, with the reason
---
```

This skill writes `sessao.md` directly (its own session state) — it is **not** a canonical doc artifact and does not go through `doninha-copy-writer`.

`rn_placement` and `business_rules` start empty and are filled by **step-04**, which is where
the consolidated rules first exist and therefore where the user is asked where to document
them. Never ask here: at this point the feature is a one-line topic and the question would be
abstract. Once recorded, the resume rule in section 3 above already covers it — a session
picked up mid-flight never re-asks the placement.

`status: 'analyzing'` is the **state contract** (see `SKILL.md`), not a cosmetic marker: it is the field the doninha engine reads to know this feature has analysis in flight. Only three steps ever write it — this one seeds `analyzing`, `step-03-gate` writes `rejected` on a No-Go, and `step-06-fechamento` writes `analyzed` at closeout. No other step touches it.

`source_ref` and `attachments_read` are **express-only** and start empty: step-02c records there which card (or pasted requirements) fed the analysis and how many of the card's images it managed to open. In the other modes they stay empty — an empty `source_ref` is what tells a resumed express session that the source was never resolved.

`initial_answers` starts empty and is filled by step-02a, step-02b, step-02c or step-02d as soon as the user answers that step's opening questions — its keys differ per mode and are defined in each of those step files.

The three companions are **mode-specific and mutually exclusive in practice**: `ideation_technique` belongs to DESCOBERTA (which technique is driving the brainstorming), while `grilling`, `derivado` and `alternativas` belong to SOLUÇÃO (the decision tree's settled nodes, its still-open frontier in `grilling.abertos`, the requirements/criteria derived from those answers, and whether a real fork appeared). Together with `initial_answers`, they are what lets a step resumed in a brand-new session pick up where it stopped instead of re-asking. Never fill any of them here.

`symptom_class`, `capabilities` and `lacunas` are the exception to that last rule: they are filled **here**, in section 5b, and are read-only from then on. `validation_approved` stays `false` for `investigacao` — the evidence gate in step-03b is what flips it, the same way the product gate does for `descoberta`.

### 7. Route to the next step

- **Mode = DESCOBERTA:** load `./step-02a-descoberta.md`
- **Mode = SOLUÇÃO:** load `./step-02b-solucao.md`
- **Mode = EXPRESS:** load `./step-02c-express.md`
- **Mode = INVESTIGAÇÃO:** load `./step-02d-investigacao.md`

---

## SUCCESS METRICS

- Config resolved (`DONINHA.md` aprovador, tracker integration presence)
- Feature topic confirmed with the user (title + slug), never invented
- Existing session detected and resume offered when applicable — the search glob matches the real depth of the canonical folder (`.doninha/docs/modules/*/*/sessao.md`)
- A resumed tracker missing `status` repaired from its own `stepsCompleted`, announced in one line, never asked about
- On resume, routing follows the saved `mode` and nothing already recorded in `sessao.md` is asked again
- Module/feature numbering resolved without colliding with existing folders
- Mode chosen explicitly by the user (never presumed), out of the four
- A bare work-item id given as the topic resolved into a real title before any folder was named
- INVESTIGAÇÃO: symptom class asked, capability map resolved once via `doninha-observability-context`, both recorded in `sessao.md` and reported back to the user in one line
- INVESTIGAÇÃO: `source` unresolvable → stopped and said so, instead of investigating without code
- `sessao.md` initialized with `status: 'analyzing'` and `stepsCompleted: [1]`
- Correct routing to step-02a, step-02b, step-02c or step-02d
