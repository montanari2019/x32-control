---
name: doninha-artifact-structure
description: Format and persist the Structure artifact (structure.md) that decomposes a feature into PBIs. Used by doninha-copy-writer for stage=structure. Lists each PBI (slug, title, short description, dependencies) plus the rationale for the decomposition.
---

# Artifact: Structure

Format the PBI decomposition into the template below. Write in PT-BR. Do not invent PBIs the agent did not define.

## Mandatory frontmatter

```yaml
---
stage: structure
feature: { feature-slug }
created_at: { ISO date }
status: done
---
```

(Feature-level artifact — no `pbi` field.)

## Template

```markdown
# Estrutura — {Feature}

## Objetivo da feature

{2–3 frases}

## PBIs

### {pbi-slug} — {Título do PBI}

**Descrição:** {1–2 frases}
**Depende de:** {outros pbi-slug ou "nenhum"}

### {pbi-slug-2} — {Título}

...

## Justificativa da decomposição

{por que esses cortes; como cada PBI entrega valor isolado}

---

Próximo passo rode `doninha-desenvolver` no primeiro PBI.
```

## Rules

- Each PBI must have a kebab-case slug (becomes the `pbis/{slug}/` folder).
- Always include mandatory frontmatter + `Próximo passo`.
- **PBI quality gate**: Each PBI must be verifiable in isolation — if it requires another PBI to be tested in production, or takes less than 0.5 AI-assisted days, the split should be revisited. XS PBIs only make sense if fully autonomous.
