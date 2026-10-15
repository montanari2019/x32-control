---
name: doninha-artifact-technical
description: Format and persist the Technical artifact (pbis/{slug}/technical.md) for a PBI. Used by doninha-copy-writer for stage=technical. Captures technical requirements, API contract, data-model changes, security, integrations, and PBI-level architecture decisions from the technical stage.
---

# Artifact: Technical

Format the technical analysis into the template below. Write in PT-BR. Do not invent decisions — only structure what the analyst produced.

## Mandatory frontmatter

```yaml
---
stage: technical
feature: { feature-slug }
pbi: { pbi-slug }
created_at: { ISO date }
status: done
---
```

## Template

```markdown
# Technical — {PBI}

## Requisitos técnicos

- {requisito}

## Contrato de API

{endpoints, métodos, request/response — ou "N/A"}

## Mudanças no modelo de dados

{entidades/atributos/migrations; referência ao ERD se gerado}

## Segurança

{autenticação, autorização, dados sensíveis, OWASP relevante}

## Dependências e integrações

- {sistema/serviço/lib}

## Decisões de arquitetura do PBI

| Decisão | Alternativa | Motivo |
| ------- | ----------- | ------ |

---

Próximo passo rode `doninha-desenvolver` para consolidar o spec deste PBI.
```

## Rules

- Alinhar nomenclatura com `doninha-ubiquitous-language`, respeitando a precedência do §0 dela: o padrão real da codebase e o `conventions.md` do projeto valem mais que qualquer default da skill, e codebase sem padrão claro (ou com dois) vira pergunta, não escolha. Sempre frontmatter obrigatório + `Próximo passo`.
