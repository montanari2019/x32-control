# Conventions Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 2,250 tokens (~1,350 words). **Input cap:** 10 source files + 6 config files, 3 searches, 30 results each.

**Purpose:** Document code style and naming conventions.

**Extract from:**

- Lint/format/editor configs (they state the enforced rules without any code being read)
- **5–10** representative source files — chosen across layers, not clustered in one folder
- Identifying consistent patterns
- Observing actual conventions in use

The 5–10 file range is a **cap**, not a target. Naming and import conventions are claims about what predominates; a handful of files spread across layers settles that. Reading more does not make the claim truer.

Template and guidance for documenting project conventions in `<CODEBASE_DIR>/conventions.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Convenções

> ⚠️ **Armadilha** — `npm run lint` termina verde sem checar `src/generated/`: o diretório está no `.eslintignore`, e o CI roda esse mesmo comando como gate de estilo (`.eslintignore`, `azure-pipelines.yml`).

## Nomenclatura de arquivo

| Contexto | Convenção | Exemplo |
|---------|-----------|---------|
| Componentes | PascalCase | UserProfile.tsx |
| Services | kebab-case | user-service.ts |
| Testes | mesmo nome do fonte + .spec | user-service.spec.ts |
| Tipos | kebab-case | user-types.ts |
| Constantes | kebab-case | app-constants.ts |

## Nomenclatura no código

| Elemento | Convenção | Exemplo |
|---------|-----------|---------|
| Variáveis | camelCase | userName |
| Funções | camelCase | getUserById |
| Classes | PascalCase | OrderService |
| Interfaces | PascalCase (sem prefixo I) | UserRepository |
| Tipos | PascalCase | CreateOrderDto |
| Constantes | UPPER_SNAKE_CASE | MAX_RETRY_COUNT |
| Enums | membros em PascalCase | OrderStatus.Pending |

## Organização dos imports

Ordem dos imports:

1. Pacotes externos (node_modules)
2. Aliases internos (~/*, @/*)
3. Imports relativos (../, ./)
4. Imports de tipo (import type {})

## Organização de arquivos dentro de um módulo

Como os arquivos se distribuem dentro de um módulo ou domínio:

```
module/
├── index.ts          — API pública (barrel)
├── module.service.ts — Regra de negócio
├── module.controller.ts — Handler HTTP
├── module.repository.ts — Acesso a dados
├── module.types.ts   — Tipos e interfaces
├── module.spec.ts    — Testes
└── module.constants.ts — Constantes do módulo
```

## Lint e formatação

| Ferramenta | Arquivo de config | Regras relevantes |
|------|-------------|-----------|
| ESLint | eslint.config.ts | [3 a 5 regras não-padrão] |
| Prettier | .prettierrc | [semi, singleQuote, tabWidth] |
| EditorConfig | .editorconfig | [indent_style, indent_size] |

## Convenções de Git

- **Formato de commit**: Conventional Commits (feat:, fix:, chore:, refactor:, docs:, test:)
- **Nome de branch**: feature/TICKET-123-descricao, fix/TICKET-456-descricao
- **Template de PR**: .github/pull_request_template.md (quando houver)

## Tratamento de erro

Padrão de erro do projeto:

- Classes de erro próprias? (ex.: AppError, NotFoundError)
- Onde fica o handler global?
- Formato da resposta de erro?

## Rigor do TypeScript

- **strict mode**: ligado/desligado
- **uso de `any`**: proibido / permitido em casos específicos
- **Regras relevantes do tsconfig**: strictNullChecks, noImplicitAny, exactOptionalPropertyTypes

## Guia de mudança

| Ao mexer em | Verifique |
|---|---|
| `eslint.config.ts` | O CI roda o mesmo lint: afrouxar a regra aqui não some com o achado, só o adia para o review — e vale para o repo inteiro, não para o arquivo que a motivou |
| `.prettierrc` | Todo arquivo reformata no próximo save: mudar uma opção produz um diff que atravessa o projeto e esconde a alteração real na revisão |
| `src/errors/` | O handler global que traduz a classe nova — sem tradução ela sai como erro genérico, e é o teste do formato de resposta que acusa |
```

## Good vs. bad

The failure mode of this file is the convention asserted with no file behind it, and the default rule documented as if it were a decision.

| Write this | Not this |
|------------|----------|
| Componente TUI em kebab-case `.tsx` — `src/tui/commit-dialog.tsx`; teste de view no mesmo nome + `.otui.test.tsx` | Componentes seguem a convenção do projeto |
| Commits em pt-BR, escopo igual à camada: `fix(cli): o caminho do taskkill deixa de escapar barras (S7780)` | Usa Conventional Commits |
| Interfaces em PascalCase **sem prefixo `I`** — `GitChange`, `CommitDialogProps` | Interfaces em PascalCase |
| `tsconfig.json` `strict` — desligar a flag cala o erro no arquivo que você mexeu e em todos os outros; o CI roda `tsc --noEmit` com a config do repo | Ao mudar as convenções, verifique se o código continua consistente |

## Field Guidance

- **Bloco de armadilha**: the first thing under the `#` title, above any table or section, in the form `> ⚠️ **Armadilha** — …`. **A pitfall is a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is not a surprising finding, not technical debt, and not the consequence of a change.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - The pitfall of *this* file is the check that passes over code it never read: a lint with an ignore list the CI shares, a formatter with a competing config, a hook nobody installed. **A convention that is merely not followed is not a pitfall** — it is section content; the pitfall is the command that says it was followed.
  - Where a finding goes when it is not a pitfall: fragility goes to `risks.md`, the consequence of an edit goes to `## Guia de mudança`, anything else to the section that describes it.
  - Stacking more than one, and the boundary with the bare `⚠` of the reference-docs reconciliation, are written once in `architecture-reference.md`'s `## Field Guidance`.
- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Nomenclatura**: Document what the codebase actually does, not what you think it should do. If the project mixes conventions, note both patterns and which is dominant.
- **Lint e formatação**: Focus on non-default rules that would surprise a new developer. Skip default ESLint rules.
- **Convenções de Git**: Check recent commit history (`git log --oneline -20`) to verify the stated convention matches reality.
- **Rigor do TypeScript**: Check `tsconfig.json` compilerOptions directly.
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
| `.eslintrc.*`, `eslint.config.*` | Linting rules |
| `.prettierrc`, `prettier.config.*` | Formatting rules |
| `.editorconfig` | Editor-level formatting |
| `tsconfig.json` compilerOptions | TypeScript strictness |
| Recent git log | Actual commit conventions |
| `.github/` | PR templates, CI workflows |
| Existing source files | Actual naming and file patterns |
