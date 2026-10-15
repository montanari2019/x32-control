---
name: doninha-artifact-spec
description: Format and persist the consolidated Spec artifact (pbis/{slug}/spec.md) for a PBI. Used by doninha-copy-writer for stage=spec. Consolidates business.md + technical.md into one self-sufficient, unambiguous spec with HU/RN/CA/CT/RNF traceability.
---

# Artifact: Spec

Format the consolidated spec into the template below. Write in PT-BR. The spec must be **self-sufficient** (a downstream agent reads only this file to plan). Do not invent — consolidate business.md + technical.md.

## Mandatory frontmatter

```yaml
---
stage: spec
feature: { feature-slug }
pbi: { pbi-slug }
created_at: { ISO date }
status: done
---
```

## Template

```markdown
# Spec — {PBI}

## Objetivo

{problema, beneficiários, valor — 3–5 linhas}

## Quem acessa

{papéis e permissões}

## Histórias de usuário

### HU-01 — {título}

{fluxo em linguagem de negócio}
**Cenários de aceite:** {Given/When/Then}

## Regras de negócio

- RN-01: {regra}

## Contrato técnico

{API / modelo de dados / integrações — resumido de technical.md}

## Requisitos não funcionais

- RNF-01: {performance/segurança/compliance}

## Casos de teste

- CT-01: {caso}

## Cenários e2e

<!-- Escritos aqui, antes do código. Cada um nomeia os requisitos que verifica. -->

| ID     | Requisitos verificados | Cenário                              |
| ------ | ---------------------- | ------------------------------------ |
| E2E-01 | CA-01, RN-02           | {fluxo do usuário, de ponta a ponta} |

**Fora do e2e** — coberto por unitário, deliberadamente não duplicado:

| Requisito | Por que não é e2e                    |
| --------- | ------------------------------------ |
| CA-03     | {regra pura, sem travessia de camada} |

## Critérios de aceite

- CA-01: {critério verificável}

## Critério de sucesso

{resultado mensurável}

## Fora de escopo

{limites}

---

Próximo passo rode `doninha-desenvolver` para quebrar este PBI em tasks.
```

## Rules

- Foco em WHAT/WHY (sem detalhes de implementação além do contrato técnico necessário).
- IDs rastreáveis (HU/RN/CA/CT/RNF/E2E). Sempre frontmatter obrigatório + `Próximo passo`.
- `Cenários e2e` é escrito **antes** da implementação, e é o que o teste de ponta a ponta vai
  verificar depois. Escrito na hora de codar, o teste espelha o que foi construído; escrito
  aqui, ele verifica o que foi combinado. Nunca invente cenário: formate o que o agente
  mandou, e se ele não mandou nenhum, omita a seção em vez de preencher com exemplo.
