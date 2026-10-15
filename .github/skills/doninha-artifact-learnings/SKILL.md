---
name: doninha-artifact-learnings
description: Format and persist the Learnings artifact (pbis/{slug}/learnings.md) for a PBI after review approval. Used by doninha-copy-writer for stage=documentation. Records what was implemented, decisions, deviations, problems, out-of-scope items, docs touched, and learnings for future PBIs.
---

# Artifact: Learnings

Format the documentation output into the fixed template below. Write in PT-BR. Do not invent — if a section has nothing, use the explicit fallback phrase shown.

## Mandatory frontmatter

```yaml
---
stage: documentation
feature: { feature-slug }
pbi: { pbi-slug }
created_at: { ISO date }
status: done
---
```

## Template

```markdown
# Learnings: {PBI Title}

## O que foi implementado

<Resumo em 2–3 frases do que esse PBI entregou>

## Decisões tomadas

| Decisão | Alternativa considerada | Motivo da escolha |
| ------- | ----------------------- | ----------------- |

## Desvios do planejado

<O que divergiu do spec/plan e por quê. Se nada: "Nenhum desvio significativo.">

## Problemas encontrados

<Bugs/blockers/surpresas. Se nenhum: "Nenhum problema relevante.">

## O que ficou fora do escopo

<Itens identificados e não feitos, e por quê>

## Documentação atualizada

| Arquivo | O que mudou |
| ------- | ----------- |

<Se nenhum: "Nenhuma atualização necessária.">

## Aprendizados para próximos PBIs

<Insights técnicos/processo, padrões, armadilhas>

---

Próximo passo Todos os stages desse PBI estão completos.
```

## Rules

- Seções vazias recebem a frase de fallback explícita (nunca deixar em branco).
- Sempre frontmatter obrigatório + a linha `Próximo passo` final exata.
