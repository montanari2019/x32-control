# Structure Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 1,500 tokens (~900 words). **Input cap:** 6 files, 2 searches, 40 results each. Never walk the tree — the inventory already did.

**Purpose:** Document directory layout, entry points and path aliases.

**Extract from:**

- The pass inventory (`SKILL.md` Step 0.5) — top-level directories, declared units
- Up to **4** files: entry-point manifest fields, alias config (`tsconfig.json`, `vite.config.*`)
- `.gitignore` for generated directories

Template and guidance for documenting the project structure in `<CODEBASE_DIR>/structure.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Estrutura do projeto

> ⚠️ **Armadilha** — o alias `~/` resolve pelo `tsconfig.json` no editor e no `tsc --noEmit`, mas o bundler lê só o `vite.config.ts`, que não o declara: o import passa nos dois gates e some do pacote publicado (`tsconfig.json`, `vite.config.ts`).

## Visão geral

[Um parágrafo sobre como o projeto se organiza — monorepo ou repo único, o que as pastas de primeiro nível representam e qual é o princípio organizador (por feature, por camada, por domínio).]

## Layout de primeiro nível

```
project-root/
├── src/              — Código-fonte da aplicação
├── tests/            — Testes (quando não co-locados)
├── docs/             — Documentação
├── scripts/          — Scripts de build e utilitários
├── config/           — Arquivos de configuração
├── public/           — Assets estáticos (frontend)
└── infra/            — Definições de infraestrutura
```

## Pontos de entrada

| Ponto de entrada | Caminho | Papel |
|-------------|------|---------|
| Principal   | src/index.ts | Bootstrap da aplicação |
| CLI         | src/cli.ts   | Interface de linha de comando |
| Worker      | src/worker.ts | Processamento de jobs em segundo plano |

## Organização do código-fonte

Estrutura interna do diretório de fontes:

```
src/
├── domains/          — Domínios de negócio (uma pasta por bounded context)
│   ├── orders/
│   │   ├── services/
│   │   ├── models/
│   │   └── repositories/
│   └── customers/
├── shared/           — Utilitários, tipos e helpers compartilhados
├── infra/            — Adaptadores de infraestrutura (banco, HTTP, mensageria)
└── config/           — Configuração da aplicação e ambiente
```

## Aliases de caminho

| Alias | Resolve para | Configurado em |
|-------|-------------|---------------|
| ~/    | src/        | tsconfig.json |
| @/    | src/        | vite.config.ts |

## Monorepo / layout modular (quando houver)

Monorepo, workspace ou monólito modular: diga apenas *como* as unidades são declaradas e onde vivem — o mapa unidade a unidade mora no `OVERVIEW.md`.

Declarado em `pom.xml` `<modules>` — 32 módulos Maven na raiz, `core` compartilhado.
Mapa por módulo → [OVERVIEW.md](OVERVIEW.md).

## Artefatos gerados

| Diretório | Papel | Está no .gitignore? |
|-----------|---------|----------------|
| dist/     | Saída compilada | Sim |
| .next/    | Cache de build do Next.js | Sim |
| coverage/ | Relatório de cobertura | Sim |

## Guia de mudança

| Ao mexer em | Verifique |
|---|---|
| `src/` | Mover ou renomear pasta arrasta todo alias que aponta para o caminho antigo — `tsc`, bundler e runner de teste leem configs diferentes, e um só deles ficar para trás dá build verde com runtime morto |
| `pnpm-workspace.yaml` | A unidade nova só existe para o instalador depois de entrar no manifesto pai: sem isso ela resolve pelo `node_modules` da raiz e quebra no CI, que instala do zero |
| `openapi.yaml` | O cliente gerado a partir dele — o build usa o que está em disco, então sem regerar, o campo novo não existe para quem consome e nada acusa em compilação |
```

## Good vs. bad

The failure mode of this file is the dumped tree: a listing anyone could produce with `ls -R`, with no role next to each folder and no entry point identified.

| Write this | Not this |
|------------|----------|
| `src/acp/` — camada Agent Client Protocol: conduz turnos com o agente e traduz o protocolo em eventos, permissões e perguntas | `src/acp/` — pasta acp |
| Entrada do pacote: `bin/doninha.js` (`package.json` `bin`); a TUI sobe por `src/tui/app.tsx` | Vários pontos de entrada em `src/` |
| `~/` resolve para `src/`, declarado em `tsconfig.json` `paths` | Usa alias de caminho |
| `dist/` está no `.gitignore` e é regerado pelo build; editar ali some no próximo `npm run build` e o fonte continua como estava | Ao mexer na estrutura, verifique se os caminhos continuam corretos |

## Field Guidance

- **Bloco de armadilha**: the first thing under the `#` title, above any table or section, in the form `> ⚠️ **Armadilha** — …`. **A pitfall is a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is not a surprising finding, not technical debt, and not the consequence of a change.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - The pitfall of *this* file is the path that resolves in one tool and not in another: an alias the editor honours and the build does not, a generated artifact consumed without being regenerated, an entry point the manifest declares and the bundle omits. **A layout that is merely awkward is not a pitfall** — it is section content.
  - Where a finding goes when it is not a pitfall: fragility goes to `risks.md`, the consequence of an edit goes to `## Guia de mudança`, anything else to the section that describes it.
  - Stacking more than one, and the boundary with the bare `⚠` of the reference-docs reconciliation, are written once in `architecture-reference.md`'s `## Field Guidance`.
- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Layout de primeiro nível**: Only include directories that actually exist. Mark each with a brief `—` description.
- **Pontos de entrada**: name the entry point of each **deployable unit** — one line each. In a repo with many units, name the units' entry-point **convention** and only the units that deviate from it; do not enumerate every bootstrap file. The manifest fields (`main`, `bin`, `exports`, `mainClass`) answer this without opening the files.
- **Aliases de caminho**: These are critical for agents to resolve imports correctly. Check `tsconfig.json` paths, `vite.config.ts` resolve.alias, webpack aliases.
- **Monorepo / layout modular**: Only include this section if the project declares separable units. Check `package.json` workspaces, `pnpm-workspace.yaml`, `lerna.json`, `pom.xml` `<modules>`, `settings.gradle`. Keep it to two lines — how units are declared and a link to `OVERVIEW.md`. The per-unit map (papel, doc) belongs to `OVERVIEW.md`; duplicating it here guarantees the two drift apart.
- **`## Guia de mudança`**: the last section of the file, and the only one that speaks to the *moment of the edit* rather than to the current state.
  - **Column 1 is always a concrete path** — a file or a directory. **A directory path is valid when the consequence belongs to the whole directory**; what is refused is the layer description with no path at all: "a camada de serviço", "os componentes" and every equivalent.
  - **Column 2 is the consequence, never the description**: what breaks, what has to be regenerated, what has to be tested. If the sentence would fit unchanged in a descriptive section above, the entry is not a guide entry — drop it.
  - **No known consequence, no entry.** The table is never filled to justify the header, and with no entry at all **the whole section is omitted** (rule 3).
  - **A verification command comes from the manifest, the config or the CI** (rule 4). With no origin the entry ships without a command — never with a plausible one.
  - **Derive it from what this step already read.** Migrations, generated clients, contract tests, lint config, path aliases and environment variables are already in this step's evidence. The guide never authorises opening an extra file, and no `Input cap` rises because of it.
  - **Boundary with `risks.md`**: `## Áreas frágeis` records **that** a file is fragile; this section records **what to check** when you touch it. Never the same sentence in both.
  - **Over the ceiling, descriptive prose is cut before a guide entry.** The `Size limit` is never raised to fit the guide — the guide displaces description.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| Root directory listing | Top-level organization |
| `package.json` `main`, `bin`, `exports` | Entry points |
| `tsconfig.json` `paths` | TypeScript path aliases |
| `vite.config.*` / `webpack.config.*` | Build-time aliases |
| `package.json` `workspaces`, `pnpm-workspace.yaml`, `pom.xml` `<modules>`, `settings.gradle` | Separable units (workspace packages, Maven/Gradle modules) |
| `.gitignore` | Generated/build directories |
