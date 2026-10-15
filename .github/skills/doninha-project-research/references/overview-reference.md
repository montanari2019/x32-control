# Overview Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Business meaning at repo scale only.** Per-module capabilities belong in `modules/<slug>.md` (or inline in the module map's `Papel` column when the repo has fewer than 4 separable units).
> 7. **Never restate stack/architecture detail here** — link to the file that owns it (`SKILL.md` "avoid duplicating information across files").
> 8. **The module map is not the feature pipeline.** `<CODEBASE_DIR>/modules/` (repo context, written here) has nothing to do with `DONINHA_ROOT/docs/modules/` (workspace-level modules/features of the Doninha pipeline).
> 9. **Size limit:** 1,750 tokens (~1,050 words). **Input cap:** zero new code reads — every source is either a document this pass already wrote or a doc already read. If the business role is not in the README, the reference docs or the ecosystem clues, say so explicitly; never infer a purpose from folder names, and never open source files hunting for it.

**Purpose:** Document what the repository *is for* — its role in the product/ecosystem — and route to everything else.

**Extract from:**

- README / docs of the target repo (first 200 lines)
- The team's reference docs declared in `research.referencias`, already read in Step 0 (see [reference-docs-reconciliation.md](reference-docs-reconciliation.md))
- `stack.md` and `architecture.md` produced in Steps 1–3 — read from disk, they are already capped outputs
- Module/package boundaries: the pass inventory's declared units (Maven/Gradle modules, workspace packages, apps, feature folders)
- Cross-repo clues: base URLs, client SDKs, shared contracts, `.env.example` hostnames — all already surfaced by Steps 1–7.5


Template and guidance for documenting the repository overview in `<CODEBASE_DIR>/OVERVIEW.md`.

`OVERVIEW.md` is the **entry point** of a repo's context. Readers open it first, use the module map to find the one module they need, and only then read `modules/<slug>.md` and the technical files. It is the only place that carries business meaning at repo scale — the other files stay technical.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# <repo-name>

## Papel no ecossistema

[Um parágrafo, orientado a negócio: que problema este repositório resolve, para quem, e onde ele entra no fluxo do produto. Não repita o stack aqui.]

## Apelidos e status

| Campo | Valor |
|-------|-------|
| Também chamado de | v3, painel admin |
| Status | ativo \| legado \| em migração (para/de quê) |
| Substitui / é substituído por | `backend` (FLEX) — em migração |

## Consome / é consumido por

| Direção | Contraparte | Como |
|---------|-------------|------|
| consome | `csg-mxt-backend` | REST, via `REACT_APP_API_URL` |
| é consumido por | `mixtra-app` | REST `/mobile/v1` |
| é consumido por | `sjob-ftp` | arquivos CNAB via SFTP |

## Mapa de módulos

| Módulo | Caminho | Papel | Doc |
|--------|---------|-------|-----|
| contrato | `contrato/` | Núcleo de negócio: contratos, margem, folha | [modules/contrato.md](modules/contrato.md) |
| admin | `admin/` | Configuração, convênios, empresas, conteúdo | [modules/admin.md](modules/admin.md) |
| agendador-processos | `agendador-processos/` | Agendamento de processos internos | — |
| core, core-messages, common-data, common-session | `core/`, … | Bibliotecas compartilhadas (entidades, mensagens, sessão) | — |

## Contexto detalhado

- Stack e dependências → [stack.md](stack.md)
- Layout e entry points → [structure.md](structure.md)
- Padrão arquitetural e fronteiras → [architecture.md](architecture.md)
- Convenções de código → [conventions.md](conventions.md)
- Integrações externas → [integrations.md](integrations.md)
- Concerns transversais → [concerns.md](concerns.md)
- Testes → [testing.md](testing.md)
- Riscos conhecidos → [risks.md](risks.md)

## Divergências

Divergências entre os docs de referência do time e o código, apuradas nesta pesquisa:

- ⚠ `INDEX.md` cita o módulo `rendimento-capital` como serviço próprio; no código é um pacote dentro de `contrato/`.
- \+ Módulo `webservice-v3` presente no código e ausente do `INDEX.md`.
```

## Good vs. bad

The failure mode of this file is the role restated from the stack: a paragraph that says what the repo is built with instead of what it is for, and a relation asserted with no evidence of the wire between the two repos.

| Write this | Not this |
|------------|----------|
| Instala o Doninha no repositório do cliente, pergunta a unidade de negócio e baixa do Hub o conteúdo dela; é o único componente que roda na máquina do desenvolvedor | CLI em Node com TUI em React e arquitetura hexagonal |
| consome o Doninha Hub — HTTP em `DONINHA_HUB_URL`, `sha256` conferido por arquivo baixado | consome o Hub |
| Status: ativo · v3.2.2; também chamado de "a CLI"; distribuído como pacote npm com auto-atualização embutida | Status: em uso |

## Field Guidance

- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Papel no ecossistema**: the one thing no manifest can tell you. If the repo's README and the team's reference docs are both silent, say so explicitly instead of inventing a purpose from folder names.
- **Apelidos e status**: internal nicknames (`v3`, `FLEX`, `painel`) are how the team talks; without them an agent cannot map a request to a repo. Omit rows you have no evidence for.
- **Consome / é consumido por**: name only counterparts that appear in the `DONINHA.md` repos index, or external third parties. Evidence = configured base URLs, generated clients, shared queue/topic names, file drop conventions.
- **Mapa de módulos**: always generated, and cheap by construction — the rows are the pass inventory's declared units and top-level directories, plus the reference docs. `Doc` column: link when `modules/<slug>.md` exists, `—` when the module has no doc. `—` means **not researched yet**, not "nothing there" — a pass documents at most 8 modules, so a large repo legitimately shows many `—` rows. Group cohesive shared libraries into a single row rather than listing each; past 40 rows, grouping is mandatory.
- **Divergências**: only `⚠` (in the reference doc, not found in code) and `+` (in code, absent from the reference doc) belong here. Confirmed items (`✓`) need no entry — they are simply the content of the docs. Omit the whole section when there is no reference doc or no divergence.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| Repo `README`, `CONTRIBUTING`, `docs/` | Purpose, nicknames, status |
| `research.referencias` docs | Role, nicknames, obsolescence, cross-repo relations |
| `pom.xml` `<modules>`, `settings.gradle`, `package.json` `workspaces`, `pnpm-workspace.yaml` | Module/package list |
| Top-level directory listing + per-directory manifest/entry point | Separable units in a modular monolith |
| `.env.example`, HTTP client config, generated SDKs | Who this repo consumes |
| Other repos' configs pointing at this one | Who consumes this repo |
