---
name: doninha-artifact-review
description: Format and persist the Review artifact (pbis/{slug}/review.md) for a PBI. Used by doninha-copy-writer for stage=review. Captures the verdict, findings by severity, and coverage of each spec acceptance criterion per task from the review stage.
---

# Artifact: Review

Format the review into the template below. Write in PT-BR. Do not soften or invent findings.

## Mandatory frontmatter

```yaml
---
stage: review
feature: { feature-slug }
pbi: { pbi-slug }
created_at: { ISO date }
status: done
---
```

## Template

```markdown
# Review — {PBI}

## Rodada de revisão {N} — {YYYY-MM-DD}

**Veredicto:** APROVADO | NECESSITA CORREÇÕES
**Tasks revisadas:** {task-NN, ...}

## Resumo

{1–2 frases}

## Achados

| #   | Severidade | Arquivo   | Linha | Categoria | Descrição | Recomendação   |
| --- | ---------- | --------- | ----- | --------- | --------- | -------------- |
| 1   | critical   | `src/...` | L42   | segurança | {achado}  | {recomendação} |

## Cobertura dos critérios de aceite

| Critério | Task    | Status              |
| -------- | ------- | ------------------- |
| CA-01    | task-01 | Verificado / Falhou |

---

Próximo passo se APROVADO, o `doninha-code-review` acionou o `doninha-documentation`; se NECESSITA CORREÇÕES, volte ao `doninha-desenvolver` nas tasks afetadas.
```

## Rules

- O veredicto mapeia para `status.yml → pbis.{slug}.review`: APROVADO = `approved`, NECESSITA CORREÇÕES = `changes-requested`.
- Sempre frontmatter obrigatório + `Próximo passo`.
