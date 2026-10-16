# Testing Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 2,000 tokens (~1,200 words). **Input cap:** 7 files (at most 3 of them test files), 3 searches, 30 results each.

**Purpose:** Document the test framework, test types, locations, conventions and commands.

**Extract from:**

- Test scripts in the manifest and the test config file(s)
- The inventory's test footprint (count + sample paths) — that is where test location and naming convention come from
- **2–3** existing test files, for patterns only

Never enumerate the test suite. The count and the naming convention come from the inventory; the mocking/fixture style comes from 2–3 files.

Template and guidance for documenting the testing approach in `<CODEBASE_DIR>/testing.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Testes

> ⚠️ **Armadilha** — não existe `.env.test`: os e2e usam o mesmo `DATABASE_URL` do dev, e `npm run test:e2e` termina verde depois de escrever no banco de desenvolvimento (`test/jest-e2e.json`, `.env.example`).

## Framework de teste

| Ferramenta | Papel | Arquivo de config |
|------|---------|-------------|
| Vitest | Testes de unidade e integração | vitest.config.ts |
| Playwright | Testes ponta a ponta | playwright.config.ts |
| msw | Mock de API | src/mocks/handlers.ts |

## Matriz de cobertura

| Camada | Caminho | Tipo de teste exigido | Comando |
|--------|---------|-----------------------|---------|
| Domínio | src/domain/ | Unidade — [nome].spec.ts, co-locado | npm run test:unit |
| API HTTP | src/api/ | Integração — [nome].integration.spec.ts, tests/integration/ | npm run test:integration |
| Fluxo de usuário | src/app/ | Ponta a ponta — [nome].e2e.spec.ts, tests/e2e/ | npm run test:e2e |
| Migrações | db/migrations/ | **Sem teste** | |

## Avaliação de paralelismo

| Camada | Modelo de isolamento | Paralelo-seguro | Evidência |
|--------|----------------------|-----------------|-----------|
| Domínio | Sem estado compartilhado | Sim | Nenhum acesso a I/O nos testes de `src/domain/` |
| API HTTP | Banco criado por teste | Sim | `beforeEach` cria schema próprio — tests/integration/setup.ts |
| Fluxo de usuário | Base única compartilhada | Não | `truncate` global entre testes — tests/e2e/setup.ts |
| Migrações | — | Não determinado | Cap de leitura do passo não alcançou o setup |

## Comandos de gate

| Nível | Comando | Quando roda |
|-------|---------|-------------|
| Rápido | npm run test:unit | A cada alteração, antes de cada commit |
| Completo | npm run test:unit && npm run test:e2e | Antes de abrir o PR |
| Build |  | Nenhum script declarado no manifesto nem no CI |

## Onde os testes moram

- **Abordagem**: Co-locado / Centralizado / Misto
- **Unidade**: [Onde ficam em relação ao fonte]
- **Integração**: [Onde ficam]
- **Ponta a ponta**: [Onde ficam]

## Estratégia de dublê

- **HTTP**: [msw / nock / jest.mock / própria]
- **Banco**: [Banco em memória / Testcontainers / dublê de repositório]
- **Factories**: [Biblioteca — fishery, factory-bot, factories próprias]
- **Fixtures**: [Caminho dos fixtures e seeds]

## Cobertura

- **Ferramenta**: Istanbul (c8) / nyc / nativa (Vitest)
- **Comando**: npm run test:coverage
- **Limiar**: [Mínimo configurado — ex.: 80% de linha, 70% de branch]
- **Config**: [Caminho da configuração de cobertura]
- **Formato do relatório**: lcov / html / text

## Padrões e convenções de teste

Padrões observados nos testes existentes:

- **Estrutura describe/it**: como os testes se organizam (por feature, por método, por cenário)
- **Setup/teardown**: padrões de beforeAll, beforeEach (seed de banco, subida de servidor)
- **Estilo de asserção**: expect().toBe() / assert / should
- **Assíncrono**: como operações assíncronas são testadas (await, callback done, fake timers)

## Dados de teste

- **Seeds**: [Caminho dos scripts de seed ou fixture]
- **Factories**: [Caminho das factories]
- **Ambiente**: [Arquivo de env de teste — .env.test, .env.testing]
```

## Good vs. bad

The failure mode of this file is the command nobody can run: a script invented from convention instead of read off the manifest, and a framework named with no config file behind it.

| Write this | Not this |
|------------|----------|
| `npm run test:tui` → `node scripts/check-bun.mjs && bun test .otui.test` (`package.json`) — as views OpenTUI exigem Bun ≥ 1.3.0, FFI nativo indisponível no Node | `npm run test:tui` — testes de view |
| **Nenhum limiar configurado** em `vitest.config.ts`; o gate é `sonar.qualitygate.wait=true`, com as regras no servidor | Cobertura mínima de 80% |
| Sem biblioteca de mock HTTP nas devDependencies; o padrão é fake em processo + injeção — `src/acp/testing/fake-agent.ts` | Usa mocks padrão do framework |

## Field Guidance

- **Bloco de armadilha**: the first thing under the `#` title, **above the coverage matrix and every other table**, in the form `> ⚠️ **Armadilha** — …`. This is the file with the highest real density of them, and the position is not cosmetic: the pitfall is what qualifies the matrix a reader is about to trust. **A pitfall is a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is not a surprising finding, not technical debt, and not the consequence of a change.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - The pitfall of *this* file is the green run that did not prove what it seems to: a gate that skips part of the suite, an e2e that writes to the development database for want of a test env, a suite that exists and that the CI never invokes, a runner the manifest does not declare. **A missing test is not a pitfall** — the coverage matrix already carries it as **Sem teste**, and repeating it at the top is the duplication rule 3 refuses.
  - Where a finding goes when it is not a pitfall: fragility goes to `risks.md`, the consequence of an edit goes to `## Guia de mudança`, anything else to the section that describes it.
  - Stacking more than one, and the boundary with the bare `⚠` of the reference-docs reconciliation, are written once in `architecture-reference.md`'s `## Field Guidance`.
- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Matriz de cobertura**: **Every layer of the project gets a row** — derive the layers from the Step 0.5 inventory and the manifest, never from the test folder, or the matrix ends up describing only what is already tested. A layer that has tests carries the type the project requires of it, **with the project's own naming convention spelled out in the same cell** (`[nome].spec.ts`, co-located) so an agent writing a new test there follows the pattern; a layer with no test is marked **Sem teste** with an empty command cell, and is **never omitted** — the gap is the finding. A repo with no test at all is a finding too, not an empty section: the matrix ships with every layer marked **Sem teste**, and the omit-empty-sections rule does not reach this section. When the repo has more than one separable unit (workspace, monorepo), the **Caminho** column carries the unit it belongs to, so the row stays actionable from outside the root.
- **Avaliação de paralelismo**: **Both markings carry their evidence in the same row** — `Sim` and `Não` alike. The evidence is the concrete isolation mechanism read off the setup code, not a judgement: a database created per test, a temp dir per case, a fake wired in process (all of which make the layer safe), or a global table wipe between tests, a fixed port, a shared singleton (all of which make it unsafe). A marking with an empty evidence cell is not an assessment, it is a guess. When the step's read cap did not settle the isolation model for a layer, the row is marked **Não determinado** with the reason in the evidence cell, and is **never **Sim** by omission** — unproven safety is the more expensive mistake of the two.
- **Comandos de gate**: The three levels are fixed — **Rápido** (the cheapest run that catches a regression), **Completo** (everything that runs locally) and **Build** (compile/type-check/lint plus the suite, the parity with CI). A command comes from the manifest, the test config or the CI file, read literally; with no origin, the cell stays empty. **A level the project declares no script for keeps an empty command cell** — it is **never omitted and never deduced** from the level above it, because a deduced gate command is one nobody can run. When the repo has more than one test runner (a second runtime, a separate e2e config), **compose the runners at the level that requires them** — `a && b` — and **never elect a single command** as if the others did not exist.
- **Cobertura**: The command belongs here too, read off the manifest like any other — a coverage section that names the tool and the threshold but not how to run it leaves the reader one search short.
- **Estratégia de dublê**: This is critical for agents generating test code. They need to know whether to use `jest.mock()`, msw handlers, or repository-pattern doubles.
- **Padrões e convenções de teste**: Read 2-3 existing test files and describe the common patterns you observe. This is more valuable than prescriptive rules.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| `package.json` scripts | Available test commands |
| `vitest.config.*`, `jest.config.*` | Test framework configuration |
| `playwright.config.*`, `cypress.config.*` | E2E test configuration |
| `.nycrc`, `c8` config | Coverage settings |
| CI pipeline (`.github/workflows/*`, `azure-pipelines.yml`, `.gitlab-ci.yml`) | Gate commands the manifest does not declare |
| Existing `*.spec.*` / `*.test.*` files | Test patterns in use |
| `tests/`, `__tests__/`, `spec/` directories | Test organization |
| `.env.test`, `.env.testing` | Test environment config |
| `src/mocks/`, `tests/fixtures/` | Mocking and fixture patterns |
