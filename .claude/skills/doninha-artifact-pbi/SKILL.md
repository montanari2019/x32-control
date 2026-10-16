---
name: doninha-artifact-pbi
description: Format and persist the PBI product artifact (pbis/{slug}/pbi.md) — what it delivers, acceptance criteria (CA-NN), and the INVEST validation table. Used by doninha-copy-writer for stage=pbi.
---

# Artifact: PBI

Format the PBI content into the template below. Do not invent content — only structure what the agent produced. Write in PT-BR.

## Mandatory frontmatter

```yaml
---
stage: pbi
feature: { feature-slug }
pbi: { pbi-slug }
created_at: { ISO date }
status: done
---
```

(PBI-level artifact — has the `pbi` field.)

## Template

```markdown
# {tipo-item}: {título do PBI}

**ID:** {pbi-id}
**Feature pai:** {feature-id}
**Data:** {data}

---

## O que entrega

{descrição em 1-2 linhas focada no valor ao cliente final; o cliente final consegue usar esta entrega de forma independente}

## Regras de Negócio

<!-- Só quando o agente enviar regras. Omita a seção inteira quando não enviar. -->

- RN-01: {regra clara e objetiva}
- RN-02: {regra clara e objetiva}

## Critérios de Aceite

- CA-01: {critério verificável}
- CA-02: {critério verificável}

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅/⚠️  |                |
| Negotiable  | ✅/⚠️  |                |
| Valuable    | ✅/⚠️  |                |
| Estimable   | ✅/⚠️  |                |
| Small       | ✅/⚠️  |                |
| Testable    | ✅/⚠️  |                |

## Notas

{observações relevantes para o desenvolvimento — sem especificação técnica aqui}

---

Próximo passo rode `doninha-analisar` (passo 05) para propor o próximo PBI, ou — quando todos os PBIs da feature já existirem — rode `doninha-desenvolver` passando o ID deste PBI.
```

## Rules

- Always include the mandatory frontmatter and the `Próximo passo` closing line.
- Never invent or alter the INVEST justifications or acceptance criteria received from the calling agent.
- The INVEST table must always have exactly the 6 criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable.
- No technical/code-level design content belongs in this artifact — business-level only.
- **`Regras de Negócio` is conditional.** It appears only when the calling agent sends business
  rules for this PBI, which happens when the analysis session recorded
  `rn_placement: pbi`. When the agent sends none, omit the whole section — an empty
  `Regras de Negócio` heading reads as "this PBI has no rules", which is a different claim
  from "the rules are documented on the feature".
- Renumber nothing: the `RN-NN` ids arrive from the calling agent and are the same ids the
  `spec.md` of this PBI will reference. Rewriting them breaks the only link between the rule
  and the acceptance criterion that covers it.
