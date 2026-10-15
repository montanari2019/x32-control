---
name: doninha-artifact-rca
description: Format and persist the root-cause analysis artifact (rca.md) for a feature investigated in doninha-analisar's INVESTIGAÇÃO mode. Used by doninha-copy-writer for stage=rca. Captures the symptom/objective split, the causal chain with every file:line pinned at a commit, the competing-hypothesis matrix, the executed falsifiers, the adversarial verdict by axis, the capability map with its declared gaps and confidence ceilings, and the handoff requirements the correction PBIs are built from. Feature-level artifact, written before feature.md.
---

# Artifact: RCA

Format the investigation into the template below. Write in PT-BR.

**Do not invent content, and do not resolve a gap by filling it in.** A section the investigation could not close stays open, explicitly. A report that reads as complete when it is not is worse than one that names what it could not see — the reader acts on it either way.

## Mandatory frontmatter

```yaml
---
stage: rca
feature: { feature-slug }
created_at: { ISO date }
status: done
---
```

(Feature-level artifact — no `pbi` field.)

## Template — rca.md

```markdown
# RCA: {título — comece pelo módulo ou serviço entre colchetes}

**Data:** {date}
**Investigado por:** {modelo/sessão}
**Commit fixado:** {sha ou ref} — todo `arquivo:linha` abaixo vem deste ponto
**Confiança na causa raiz:** Alta | Média | Baixa | Inconclusivo

---

## Desbloqueio imediato

<!-- Só quando existe. Se o objetivo do usuário pode ser destravado hoje, isso vem ANTES da causa:
     quem lê age sobre o topo. Nada aqui? Remova a seção. -->

{a ação concreta, com os valores reais do caso}

## Sintoma e objetivo

| | |
| --- | --- |
| **Sintoma** | {o que o sistema faz e não deveria} |
| **Objetivo do usuário** | {o que a pessoa tentava realizar} |

{uma linha quando os dois divergem, e o que isso muda}

## Causa raiz

{o defeito, em uma frase, e o que o torna um defeito}

**Onde:** `{arquivo}:{linha}` ({commit})
**Desde:** {commit/data que introduziu, ou "anterior ao histórico varrido"}
**Por que só apareceu agora:** {carga, volume, dado, mudança vizinha — ou `LACUNA`}

## Cadeia até o sintoma

| # | Elo | Evidência | Confiança |
| - | --- | --------- | --------- |
| 1 | {defeito} | `arquivo:linha` | Alta |
| 2 | {consequência} | {log/métrica citada} | Média |
| 3 | {sintoma relatado} | {o que o usuário viu} | Alta |

## Hipóteses concorrentes

| Hipótese | Evidência a favor | Evidência contra | Como falsificar | Estado |
| -------- | ----------------- | ---------------- | --------------- | ------ |
| {título com [módulo]} | {} | {} | {} | descartada / não totalmente testada / sobrevive |

<!-- `descartada` exige a correção candidata concreta e por que ela não fecharia o sintoma.
     Sem isso o estado é `não totalmente testada`. -->

## Falsificadores

| # | O que decide | Executado? | Resultado |
| - | ------------ | ---------- | --------- |
| F1 | {confirma se… / refuta se…} | sim, nesta sessão | {} |
| F2 | {} | proposto — exige {escrita/estado/credencial/autorização} | — |

## Estágio adversarial

**Eixos:** lógica {CAI/SOBREVIVE} · log {} · janela {} · contrato {}

| Eixo | Veredito | O que mudou na tese |
| ---- | -------- | ------------------- |
| {} | {} | {} |

{quando a tese foi reescrita: o que se acreditava antes, e o que derrubou}

## Sonda

{o que foi investigado fora do roteiro e o que rendeu — inclusive "nada"}

## Achados paralelos

<!-- Defeito sistêmico descoberto no caminho, separado da causa deste incidente. -->

## Capacidades e lacunas

| Papel | Estado | Impacto no laudo |
| ----- | ------ | ---------------- |
| source | consultado ({provider}) | — |
| logs | não configurado | ponte log→código não construída; teto Média nos achados 2 e 3 |
| metrics | não consultado | correlação com carga não afirmável |

{cada lacuna com o que ela impediu de decidir e o falsificador que a resolveria}

## Handoff

### Requisitos

| # | Requisito | Módulo/serviço | Camada que fecha |
| - | --------- | -------------- | ---------------- |
| RF-01 | {} | {} | {} |

<!-- Requisito herda a confiança da premissa: premissa Média ou corpo não lido vira
     "verificar X; se confirmado, corrigir Y" — nunca uma afirmação. -->

### Critérios de aceite

| # | Dado | Quando | Então |
| - | ---- | ------ | ----- |
| CA-01 | {} | {} | {} |

### Mesa-test

{as hipóteses de solução comparadas: o que muda no corpo já lido, isolada × combinada, e o que
cada uma NÃO resolve}

### Regressão

{o teste da CLASSE do defeito. Se ele reincidiu por causa de um teste que mocka a falha, diga
qual teste real falta.}

### Remediação de dados

{separada da correção de código. Estado após falha parcial é indeterminado — comece por auditoria.}

---

Próximo passo: `doninha-analisar` segue para a Feature e os PBIs de correção; a implementação é do `doninha-desenvolver`.
```

## Rules

- **`rca.md` é feature-level e vem ANTES de `feature.md`.** Numa sessão de INVESTIGAÇÃO ele costuma ser o primeiro artefato da feature — então é ele que inicializa o `status.yml` quando não existe.
- **O ponteiro é aditivo:** `rca_artifact` no `status.yml`, no mesmo padrão de `discovery_artifact` e `feature_prd_artifact`. Nenhum outro campo é tocado.
- **Todo `arquivo:linha` carrega o commit** do cabeçalho. Citação sem commit fixado não entra — vira lacuna.
- **Confiança é por achado, com a regra que a produziu.** Nunca um score composto, nunca uma média. O teto mais baixo entre as capacidades de que o achado depende é o que vale.
- **Capacidade ausente aparece na tabela de lacunas, nunca como "limpo".** `não configurado` ≠ `não consultado` ≠ `consultado`, e em nenhum dos dois primeiros o laudo afirma o que a ferramenta mostraria.
- **Seção vazia é removida, não preenchida com placeholder** — exceto `Capacidades e lacunas` e `Estágio adversarial`, que são obrigatórias mesmo quando o resultado é "nada caiu" ou "tudo disponível". Um laudo sem elas não diz se foi testado.
- **Nada de credencial, token ou segredo transcrito**, nem quando ele é o achado. Descreva onde está e que precisa de rotação.
- **O handoff é especificação, não implementação.** Requisitos e critérios descrevem o que corrigir; quem corrige é o `doninha-desenvolver`, a partir dos PBIs.
