---
name: doninha-artifact-discovery
description: Format and persist the Discovery artifact (discovery_<slug>.md). Used by doninha-copy-writer to turn the discovery stage's raw output into a structured, self-sufficient discovery document with the mandatory Doninha frontmatter. Triggers on stage=discovery.
---

# Artifact: Discovery

Format the discovery content into the template below. **Do not invent content** — only structure what the agent produced. Write in PT-BR.

## Mandatory frontmatter

```yaml
---
stage: discovery
feature: { feature-slug }
created_at: { ISO date }
status: done
---
```

(Feature-level artifact — no `pbi` field.)

## Template

```markdown
# Discovery — {Título da ideia}

**Solicitado por:** {cliente | PO | desenvolvedor — nome/papel}
**Status:** Exploração | Validado (Go) | Descartado (No-Go) | Precisa refinar

## Pedido original

> {transcrição fiel do pedido}

## Problema e contexto

{qual problema/dor; contexto de negócio}

## Usuários e personas (inicial)

{quem se beneficia; papéis}

## Valor esperado

{benefício hipotético para usuário/negócio}

## Análise de alinhamento

- **Objetivos do produto:** {fit com o artefato de objetivo/visão do produto (doninha-docs-mcp)}
- **Sobreposição com o que já existe:** {features/fluxos relacionados}
- **Sinais de viabilidade:** {restrições/integrações conhecidas}

## Regras de negócio iniciais (candidatas)

- RN-01: {regra}

## Termos de domínio (sementes de ubiquitous language)

| Termo (negócio) | Significado | Termo em código (sugerido) |
| --------------- | ----------- | -------------------------- |

## Perguntas em aberto

- {incerteza a resolver na spec}

## Riscos e restrições (inicial)

{riscos, dependências, restrições}

## Fora de escopo (inicial)

{o que claramente NÃO faz parte}

## Recomendação

**Go / No-Go / Refinar** — {justificativa objetiva}

## Registro de perguntas e respostas

{log das rodadas}

## Referências visuais

> Inclua esta seção apenas quando houver referências visuais fornecidas. Remova se ausente.

| ID      | Título | Fonte (caminho ou URL) | Telas / Estados | Observações de UX |
| ------- | ------ | ---------------------- | --------------- | ----------------- |
| REF-001 |        |                        |                 |                   |

---

Próximo passo rode `doninha-analisar` para decompor a feature em PBIs.
```

## Rules

- Always include the mandatory frontmatter and the `Próximo passo` closing line.
- Never alter facts, decisions, or recommendations received from the calling agent.
- Include `## Referências visuais` only when references were provided; omit the section entirely otherwise. `doninha-analisar` reads this section to create `references/references.md`.
