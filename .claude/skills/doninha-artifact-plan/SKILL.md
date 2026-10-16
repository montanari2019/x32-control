---
name: doninha-artifact-plan
description: Format and persist the Plan artifact (pbis/{slug}/plan.md) for a PBI. Used by doninha-copy-writer for stage=plan. Captures the execution plan — ordered atomic tasks, dependencies, and parallel flags. Individual task files are persisted via doninha-artifact-task.
---

# Artifact: Plan

Format the execution plan into the template below. Write in PT-BR. Do not invent tasks — only structure what the planner produced.

## Mandatory frontmatter

```yaml
---
stage: plan
feature: { feature-slug }
pbi: { pbi-slug }
created_at: { ISO date }
status: done
---
```

## Template

```markdown
# Plan — {PBI}

## Plano de execução

Ordem e dependências das tasks (uma ação atômica por task).

| Task    | Arquivo            | Depende de | Paralela [P] | Requisito     |
| ------- | ------------------ | ---------- | ------------ | ------------- |
| task-01 | `tasks/task-01.md` | —          |              | HU-01 / CA-01 |
| task-02 | `tasks/task-02.md` | task-01    |              | RN-01         |

## Observações

{decisões de sequenciamento, riscos de ordenação}

---

Próximo passo rode `doninha-desenvolver` na `task-01`.
```

## Rules

- Uma task = uma ação clara. Sempre frontmatter obrigatório + `Próximo passo`.
- As tasks individuais usam a skill `doninha-artifact-task`.
