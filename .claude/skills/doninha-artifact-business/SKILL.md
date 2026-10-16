---
name: doninha-artifact-business
description: Format and persist the Business artifact (pbis/{slug}/business.md) for a PBI. Used by doninha-copy-writer for stage=business. Captures business rules, validations, edge cases, and acceptance criteria gathered during the business stage.
---

# Artifact: Business

Format the business analysis into the template below. Write in PT-BR. Do not invent rules — only structure what the analyst confirmed with the user.

## Mandatory frontmatter

```yaml
---
stage: business
feature: { feature-slug }
pbi: { pbi-slug }
created_at: { ISO date }
status: done
---
```

## Template

```markdown
# Business — {PBI}

## Contexto do PBI

{problema/objetivo do PBI; quem usa}

## Regras de negócio

- RN-01: {regra}
- RN-02: {regra}

## Validações

- {validação de entrada/estado}

## Edge cases

- {caso de borda e comportamento esperado}

## Critérios de aceite

- CA-01: **Dado** {contexto}, **Quando** {ação}, **Então** {resultado}

## Fora de escopo

- {o que este PBI NÃO cobre}

---

Próximo passo rode `doninha-analisar` para o lado técnico deste PBI.
```

## Rules

- Distinguir fatos confirmados de suposições. Sempre frontmatter obrigatório + `Próximo passo`.
