---
name: doninha-artifact-feature
description: Format and persist the Feature PRD artifact (feature.md) plus its companion decisions.md log. Used by doninha-copy-writer to turn the doninha-analisar agent's raw output into a structured, self-sufficient feature document with the mandatory Doninha frontmatter. Triggers on stage=feature.
---

# Artifact: Feature

Format the feature content into the templates below. **Do not invent content** — only structure what the agent produced. Write in PT-BR.

## Mandatory frontmatter

```yaml
---
stage: feature
feature: { feature-slug }
created_at: { ISO date }
status: done
---
```

(Feature-level artifact — no `pbi` field.)

## Template — feature.md

```markdown
# Feature: {Título da feature}

**ID:** {id local ou ID do tracker, quando integrações/{tracker}.yml existir}
**Data:** {date}
**Responsável:** {nome/papel}
**Status:** Em documentação

---

## Problema / Oportunidade

{descrição clara do problema que esta feature resolve ou da oportunidade que captura; do ponto de vista de quem é afetado}

## Solução Proposta

{o que a feature entrega; como resolve o problema; qual a experiência esperada — o "o quê" e o "porquê", não o "como"}

## {dimensão} Afetados

<!-- {dimensão} = canais, módulos, integrações, mercados... Remova a seção se não houver dimensão relevante. -->

| {dimensão} | Impacto | Observações |
| --- | --- | --- |
| | | |

## Tipos de {item} Envolvidos

<!-- {item} = ticket, pedido, transação... Remova a seção se não se aplicar. -->

- [ ] {tipo-1}
- [ ] {tipo-2}

## Regras de Negócio

<!-- Só quando a sessão escolheu documentar as regras na feature. Com `rn_placement: pbi`,
     substitua a lista pelo ponteiro da linha abaixo. -->

1. RN-01: {regra clara e objetiva}
2. RN-02: {regra clara e objetiva}

<!-- Com `rn_placement: pbi`: -->

As regras de negócio desta feature estão documentadas no PBI que cada uma governa —
veja a seção `Regras de Negócio` de cada `pbis/*/pbi.md`.

## Escopo

### IN — O que esta feature entrega
- {item 1}
- {item 2}

### OUT — O que NÃO está incluído nesta feature
- {item 1 — seja explícito para evitar expectativas erradas}

## Critérios de Sucesso

<!-- Só quando o agente enviar uma métrica. Sem métrica, substitua a tabela pela linha abaixo —
     nunca invente indicador, baseline ou meta para preencher o quadro. -->

| Métrica | Baseline atual | Meta | Prazo |
| --- | --- | --- | --- |
| | | | |

<!-- Sem métrica: -->

Esta feature não tem métrica de sucesso definida.

## Premissas e Decisões de Produto

| # | Decisão / Premissa | Justificativa |
| --- | --- | --- |
| 1 | | |

## Decisões Chave

> Resumo das principais escolhas de abordagem desta feature. Detalhamento completo em `decisions.md`.

| # | Decisão | Alternativas descartadas | Motivo da escolha |
| --- | --- | --- | --- |
| 1 | | | |

## Alternativas Consideradas e Rejeitadas

> Alimentado pelo brainstorming/discovery — o que foi explorado e descartado.

| Alternativa | Por que foi considerada | Por que foi descartada |
| --- | --- | --- |
| | | |

## Dependências

- {ex: feature Y precisa estar em produção antes; integração Z requer acesso ao endpoint X}

## Referências

- Discovery: `[feature_folder]/discovery.md` (se modo descoberta)
- Decisões detalhadas: `[feature_folder]/decisions.md`
- {tracker}: {id do tracker} <!-- omitir se local-only -->

---

Próximo passo rode `doninha-analisar` (passo 05) para decompor a feature em PBIs.
```

## Template — decisions.md

```markdown
# Log de Decisões — {Título da feature}

> Decisões detalhadas desta feature. Para resumo, veja `feature.md#Decisões Chave`.

## DEC-01 {Nome da decisão}

**Data:** {date}
**Status:** Aceita | Rejeitada | Em aberto

**Contexto:** {o que motivou esta decisão}

**Opções avaliadas:**
- A) {opção}: {prós e contras}
- B) {opção}: {prós e contras}

**Escolha:** {opção escolhida}

**Motivo:** {justificativa}

**Impactos:** {efeitos colaterais, trade-offs aceitos}
```

## Rules

- Always include the mandatory frontmatter and the `Próximo passo` closing line in `feature.md`.
- Never alter facts, decisions, or recommendations received from the calling agent.
- Always write **both** files in the same invocation: `feature.md` (the PRD) and `decisions.md` (the companion decision log), one `DEC-NN` entry per relevant decision.
- `decisions.md` is a **local-only** log — it never syncs to any external tracker; only the `feature.md#Decisões Chave` summary is tracker-facing.
- **`Regras de Negócio` has two shapes**, decided by the analysis session's `rn_placement`
  and sent by the calling agent — never chosen here:
  - `feature` (default): the numbered `RN-NN` list, as always.
  - `pbi`: the section stays, carrying only the pointer to where the rules live. It does
    **not** disappear: a feature PRD with no such heading reads as "this feature has no
    business rules", and someone would write them again from scratch.
- **`Critérios de Sucesso` is metric-conditional.** Render the table only when the calling agent
  sends a metric; otherwise render the one-line statement that the feature has no defined metric.
  The heading itself never disappears — its absence would read as an oversight rather than as a
  decision. Never fill the table with a plausible indicator, baseline or target to avoid an empty
  quadrant: an invented metric is indistinguishable from a measured one in the finished PRD, and
  it is the number someone will later be held to.
