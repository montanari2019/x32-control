---
status: ''                # developing | paused | done  — STATE CONTRACT, read by the doninha engine
stepsCompleted: []        # [1] [1,2] [1,2,3] [1,2,3,4] 5  — progress marker
item_id: ''               # local PBI id (pbi-NNN)
ado_id: ''                # ADO id when the external work-item tracker is configured (field only, never in the folder name)
titulo: ''
slug: ''
tipo: ''                  # resolved via the project's own type-map config; always converges to the single PBI/feature flow
pasta_pbi: ''             # .doninha/docs/modules/module_NNN/feature_NNN/pbis/pbi-NNN-slug
feature_folder: ''        # parent feature's folder (context from the "analisar" phase)
modo: ''                  # local-only | ado
artifacts_loaded: []      # [feature.md, pbis.md, decisions.md, DESIGN.md, ...] | ['ado-only']
ca_imutaveis: true
spec_construido: false
total_tasks: 0
skills_necessarias: []    # [doninha-backend, doninha-frontend, doninha-ux] — derived from codebase docs, never hardcoded
duvidas_resolvidas: false # step-03 §4's technical-doubt gate has run
decisoes_tecnicas: 0      # rows in spec.md's "Decisões técnicas" table
duvidas_em_aberto: []     # doubts the user skipped — recorded as EM ABERTO, re-asked at execute time
review_rodadas: 0         # review rounds triggered by step-05 §2c. Cap: 2
review_veredito: ''       # approved | changes-requested | '' (no review yet)  — NOT `review_status`, see below
review_artefato: ''       # {pasta_pbi}/review.md
correcao_rodada: 0        # correction passes run by step-04 §2b
tasks_em_correcao: []     # [task-03, task-07] — the tasks the last verdict pointed at
achados_em_aberto: []     # [{id, severidade, arquivo, task, rodada_origem}] — blocking findings still open at the cap
contestacoes: []          # [{achado, argumento}] — findings answered in writing instead of fixed
base_correcao: ''         # HEAD before the correction pass — the next round's regression base
proxima_fase: ''          # carregar-contexto | spec-e-tasks | implementar | correcao | fechamento
riscos: []
---

# Dev Session — {{titulo}}

This file is seeded by `step-01-identificar.md` the first time a given PBI is worked on, and is updated by every subsequent step in the `doninha-desenvolver` flow. `stepsCompleted` is the marker `doninha-desenvolver` reads at the start of a run to detect an in-progress session for this PBI and offer to resume from where it left off, instead of restarting from scratch. `ado_id` is stored only as a field on this tracker — it is never used to build `pasta_pbi` or any other folder name, so the same skill behaves identically whether the project runs local-only or with an external work-item tracker configured.

The review and correction fields are this skill's own working state — they have no external
consumer, unlike `status`. `step-05-fechamento.md` §2c writes the `review_*` fields;
`step-04-implementar.md` §2b writes the correction ones.

> **Why `review_veredito` and not `review_status`.** `tracker-status.contract.test.ts` scans this
> skill's step files for `/status: '([^']*)'/g` and fails on any value outside
> `developing | paused | done`. A key ending in `status` — written as
> `review_status: 'changes-requested'` in a step file — contains that substring and breaks the
> suite from a place that has nothing to do with the state contract. **No new field here may end in
> `status`.**

`status` is the **state contract**: it is the one field the doninha engine reads to decide whether this PBI still has work, and it is the only field here with an external consumer. It is written by exactly two steps — `step-01-identificar` seeds `developing`, `step-05-fechamento` closes with `done` or `paused`. Every other step updates its own fields and leaves `status` alone. The value set is closed (`developing | paused | done`): anything else makes the engine's read fail outright rather than degrade, and an absent value is tolerated as "in progress" with a warning. See the state-contract section of `SKILL.md`.
