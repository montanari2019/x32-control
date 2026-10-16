# Module Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** Every capability must be traceable to something you read. An unverifiable claim taken from a reference doc is marked `⚠` and reported in `OVERVIEW.md` `## Divergências` — never silently promoted to a bullet.
> 3. **Omit empty sections** instead of writing "não se aplica" — same discipline as `concerns-reference.md`.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **No file for a trivial module** (a shared utility library, a thin wrapper). One row in the `OVERVIEW.md` module map is enough; group cohesive libraries into a single doc if they deserve one at all.
> 7. **Size limit:** 1,500 tokens (~900 words) per module. **Input cap:** 12 files per module (at most 8 of them source), 4 searches, 25 results each.

**Purpose:** Document what one module/service/package *does for the business*, grouped by business area.

**Extract from:**

- A **path listing** of the module's controllers/handlers/routes, jobs and consumers. The business areas come from their **names**, not from their contents — `ContratoAprovacaoController`, `MargemReservaController`, `FolhaFechamentoJob` already tell you the areas before a single file is opened.
- Up to **8** of those files, opened as **one representative per business area** — read for **intent**, never to inventory signatures
- The module's manifest and dependencies (who it talks to)
- The team's reference docs declared in `research.referencias` (see [reference-docs-reconciliation.md](reference-docs-reconciliation.md))


```bash
git -C <repo> ls-files '<module-path>' | grep -Ei '(controller|handler|resource|route|job|scheduler|consumer|listener)' | head -60
```

A module with 41 controllers is **one listing plus up to 8 reads**, never 41 reads. If the listing exceeds 60 lines, group by the name prefix and open one file per group. Opening every handler is the single most expensive mistake available in this skill.

Template and guidance for documenting a module in `<CODEBASE_DIR>/modules/<slug>.md`.

`<slug>` is the module's directory name, lowercased and kebab-cased. One file per module — or one file for a cohesive group of modules (shared libraries, a family of small processors) when splitting them adds no information.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# <module-name>

`<caminho/no/repo>`

[Um parágrafo: o que este módulo resolve para o negócio e por que ele existe separado dos demais.]

## Capacidades

### Gestão de contratos

- Consulta e lista contratos com filtros por convênio, matrícula e competência.
- Cria contratos de empréstimo, refinanciamento e portabilidade.
- Aprova contratos em lote.
- Gerencia suspensão judicial de contratos.

### Margem

- Calcula e consulta a margem consignável disponível por matrícula.
- Reserva, confirma e cancela reserva de margem.

### Folha de pagamento

- Registra o fechamento mensal e apura divergências entre folha e sistema.
- Exporta a consignação mensal para a fonte pagadora.

## Fronteiras

**Expõe:** API REST consumida por `consignet-react` e `integracao-api-banco`; eventos Kafka de migração de contrato.

**Consome:** `core` (entidades compartilhadas), Oracle (esquema `CSG`), Redis (cache de convênios do usuário), Keycloak (autenticação).

## Evidência

- `contrato/src/main/java/**/controller/` — 41 controllers agrupados nas áreas acima
- `contrato/pom.xml` — dependências de `core`, `common-session`
- `INDEX.md` §`csg-mxt-backend`/`contrato` — ✓ confere com o código

## Guia de mudança

| Ao mexer em | Verifique |
|---|---|
| `contrato/src/main/java/**/controller/` | O contrato REST que `consignet-react` consome — a assinatura é pública, e o consumidor não compila junto com este módulo |
| `contrato/pom.xml` | A dependência de `core`: subir a versão arrasta as entidades compartilhadas, e o que quebra aparece no build dos outros módulos, não neste |
```

## Good vs. bad — capabilities, not endpoints

Write what the module **does**, never its call surface:

| Write this | Not this |
|------------|----------|
| Aprova contratos em lote. | `POST /contratos/aprovacao-massiva` — body `{ids: number[]}` |
| Consulta a margem disponível por matrícula. | `MargemController.consultar(String matricula)` |
| Envia notificações push agendadas aos colaboradores. | `AvisoPushNotificationScheduler` → tópico `ENVIA_AVISO_NOTIFICACAO_PUSH` → `FCMService` |

Named technical inventories (scheduler lists, consumer/topic tables, step-by-step pipelines) do **not** belong here. When a named element is genuinely part of the module's public contract, it goes in `## Fronteiras` as one line — the rest stays in `integrations.md` / `architecture.md`, which own that kind of detail.

## Field Guidance

- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Parágrafo de abertura**: business framing. "Núcleo de negócio: tudo que envolve o ciclo de vida do contrato de consignação" beats "Spring Boot module with controllers and services".
- **Capacidades**: group by **business area** (`### Gestão de contratos`, `### Margem`, `### Relatórios`), then one bullet per capability, phrased as what the system does. Nest one level when an area has clear sub-groups; never more.
- **Fronteiras**: 3–6 short bullets or two prose lines. Name only **stable public contracts** — a REST surface, a Kafka topic, a table schema, a shared library. Do not list internal classes.
- **Evidência**: what you actually listed and what you actually opened — say which. `41 controllers agrupados nas áreas acima` records a *listing*; a path with no count records a *read*. Plus the reference-doc section you reconciled against and its verdict. This is what makes a refresh cheap: a later pass re-checks these paths instead of re-deriving the module.
- **Vocabulário de negócio**: keep the module's business language (domain terms like *convênio*, *margem*, *averbação*) exactly as the code and the team use it. **Do not translate domain vocabulary** — rule 1 above governs the document's own headers and prose, never the words the team owns.
- **`## Guia de mudança`**: the last section of the file, and the only one that speaks to the *moment of the edit* rather than to the current state.
  - **Column 1 is always a concrete path** — a file or a directory. **A directory path is valid when the consequence belongs to the whole directory**; what is refused is the layer description with no path at all: "a camada de serviço", "os componentes" and every equivalent.
  - **Column 2 is the consequence, never the description**: what breaks, what has to be regenerated, what has to be tested. If the sentence would fit unchanged in a descriptive section above, the entry is not a guide entry — drop it.
  - **No known consequence, no entry.** The table is never filled to justify the header, and with no entry at all **the whole section is omitted** (rule 3).
  - **A verification command comes from the manifest, the config or the CI** (rule 4). With no origin the entry ships without a command — never with a plausible one.
  - **Derive it from what this step already read.** Migrations, generated clients, contract tests, lint config, path aliases and environment variables are already in this step's evidence. The guide never authorises opening an extra file, and no `Input cap` rises because of it.
  - **Boundary with `risks.md`**: `## Áreas frágeis` records **that** a file is fragile; this section records **what to check** when you touch it. Never the same sentence in both.
  - **Over the ceiling, descriptive prose is cut before a guide entry.** The `Size limit` is never raised to fit the guide — the guide displaces description.
  - **Domain vocabulary still applies here** (rule 1): a business term in a guide entry stays exactly as the team writes it. The section is new; the exemption is not.

- **The `Size limit` is checked before writing, exactly as it is for the eight technical files.** Dimension the content against the **word** figure of rule 7 — `1,500 tokens (~900 words)` — and cut until it fits; after writing, `wc -w "<path>"` on the file — the path quoted, for the reason [delegation-contract.md](delegation-contract.md) gives — and the count goes back with the module's return line (see [delegation-contract.md](delegation-contract.md)). `modules/` having **no folder ceiling** — a reader opens exactly one file from the folder, so nothing ever summed them — is why this deviation went unnoticed, and that is an explanation, **not an exemption**. Measured across the docs generated before the check existed: 24 of 70 module docs were over their own per-module ceiling, against 15 of 144 technical files.
- **Domain vocabulary is never what the reduction cuts.** Reduction removes descriptive prose. Translating `margem` into `margin` saves no words and spends the meaning rule 1 exists to protect.
