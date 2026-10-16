---
name: doninha-artifact-task
description: Format and persist a task file (pbis/{slug}/tasks/task-NN.md). Used by doninha-copy-writer for stage=task. Each task is a cohesive unit of work (one capability), with metadata, scope, files, acceptance criteria and done-when, traceable to the PBI spec.
---

# Artifact: Task

Format one task into the template below. Write in PT-BR. Each task is a cohesive unit of work (one capability).

## Mandatory frontmatter

```yaml
---
stage: task
feature: {feature-slug}
pbi: {pbi-slug}
created_at: {ISO date}
status: done
horas_ia: {n}h          # opcional; omitir se não estimado
horas_humano: {n}h      # opcional; omitir se não estimado
horas_estimadas: {n}h   # total (IA + humano); opcional, omitir se não estimado
---
```

(`status: done` here = the task file was authored. Task execution status lives in `status.yml` under `pbis.{slug}.tasks.task-NN`: pending → review → done. `horas_ia`/`horas_humano`/`horas_estimadas` are optional — omit them unless the flow that authored the task filled them in.)

## Template

Read template in `.doninha/templates/task-template-v2.md`.

## Rules

- Coesa: uma unidade de trabalho (uma capacidade), sem limite rígido de arquivos. Sempre frontmatter obrigatório + `Próximo passo`.
