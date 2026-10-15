# Stack Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 1,750 tokens (~1,050 words). **Input cap:** 8 manifests/configs, 2 searches, 40 results each.

**Purpose:** Document technology stack and dependencies.

**Extract from:**

- The **root/parent** dependency manifest (and, in a repo with more than 8 declared units, only that one — the unit list comes from its `<modules>`/`workspaces`/`include` block, not from globbing every unit's manifest)
- Build configuration
- Runtime configuration

Never read a lock file. Confirm it exists (`ls`) to name the package manager, and grep a single line if a pinned version matters.

Template and guidance for documenting the project's technology stack in `<CODEBASE_DIR>/stack.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Stack tecnológica

> ⚠️ **Armadilha** — `pnpm install` na imagem ignora o `allowBuilds`: o `pnpm-workspace.yaml` está no formato do pnpm 11 e o `Dockerfile` prepara o pnpm 9.15.4 (`pnpm-workspace.yaml`, `Dockerfile:12`). Build verde; a dependência nativa fica sem script de build em runtime.

## Runtime e linguagem

| Tecnologia | Versão | Papel |
|-----------|---------|---------|
| Node.js   | 20.x    | Runtime do servidor |
| TypeScript| 5.x     | Tipagem estática |

## Frameworks

| Framework | Versão | Papel |
|-----------|---------|---------|
| NestJS    | 10.x   | Framework de backend |
| React     | 18.x   | Biblioteca de UI |

## Build e empacotamento

| Ferramenta | Arquivo de config | Papel |
|-----------|--------------------|---------|
| tsup      | tsup.config.ts     | Empacotamento da biblioteca |
| Webpack   | webpack.config.js  | Empacotamento da aplicação |

## Gerenciador de pacotes

- **Gerenciador**: pnpm / npm / yarn
- **Lock file**: pnpm-lock.yaml
- **Workspaces**: sim/não — se sim, liste os caminhos

## Dependências principais

As dependências que moldam o projeto — não o inventário todo, só as que um engenheiro precisa conhecer:

| Pacote          | Papel                          |
|-----------------|--------------------------------|
| @prisma/client  | ORM do banco                   |
| zod             | Validação de schema            |
| axios           | Cliente HTTP                   |

## Dependências de desenvolvimento

As que afetam o fluxo de trabalho:

| Pacote     | Papel                   |
|------------|-------------------------|
| vitest     | Runner de teste         |
| eslint     | Lint                    |
| prettier   | Formatação              |

## Testes

| Ferramenta | Versão | Papel |
|-----------|---------|---------|
| Vitest    | 0.x     | Testes de unidade e integração |
| Playwright | 1.x     | Testes ponta a ponta |
```

## Good vs. bad

The failure mode of this file is the name with no consequence: a package listed without what it does for *this* project, or a version with no source.

| Write this | Not this |
|------------|----------|
| `tsup 8.x` — empacota a CLI; config em `tsup.config.ts`, entradas `src/cli.ts` e `src/index.ts` | `tsup` — bundler |
| `pnpm`, lock em `pnpm-lock.yaml`, workspaces declarados em `pnpm-workspace.yaml` | Gerenciador de pacotes: pnpm |
| Node **≥ 22** para o caminho ACP (`package.json` `engines`), ≥ 20 para o resto | Node moderno |

## Field Guidance

- **Bloco de armadilha**: the first thing under the `#` title, above any table or section, in the form `> ⚠️ **Armadilha** — …`. **A pitfall is a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is not a surprising finding, not technical debt, and not the consequence of a change.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - The pitfall of *this* file is the version declared in one place and prepared in another: a package manager whose workspace format and whose image disagree, an engine the manifest pins and the CI does not honour. **An outdated version with no silent failure is not a pitfall** — it is section content, or `risks.md`.
  - Where a finding goes when it is not a pitfall: fragility goes to `risks.md`, the consequence of an edit goes to `## Guia de mudança`, anything else to the section that describes it.
  - Stacking more than one, and the boundary with the bare `⚠` of the reference-docs reconciliation, are written once in `architecture-reference.md`'s `## Field Guidance`.
- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Versão**: Use the major version range (e.g., `5.x`) unless a specific minor/patch matters.
- **Papel**: One-line explanation of why this exists in the project — never a restatement of the package's own tagline.
- **Dependências principais**: Focus on dependencies that define the project's architecture (ORM, validation, HTTP, state management) — not utilities like `lodash` or `uuid` unless they are central.
- **Arquivo de config**: Include the actual file path relative to the project root.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| `package.json` / `requirements.txt` / `Gemfile` | Dependencies and versions |
| Lock files (`package-lock.json`, `yarn.lock`) | Exact resolved versions |
| `.node-version`, `.nvmrc`, `.tool-versions` | Runtime version |
| `tsconfig.json` | TypeScript configuration and target |
| `Dockerfile` | Base image reveals runtime and version |
| CI pipelines | Build matrix reveals supported versions |
