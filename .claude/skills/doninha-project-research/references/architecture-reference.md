# Architecture Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 2,750 tokens (~1,650 words). **Input cap:** 12 files, 6 searches, 30 results each.

**Purpose:** Document architectural patterns and data flow.

**Extract from:**

- The pass inventory (`SKILL.md` Step 0.5) and `structure.md` — directory organization, already derived
- Up to **8** source files: **one representative per detected layer**, never N implementations of the same layer
- Repeated patterns, established by capped searches rather than by reading

The architectural pattern is read off the **shape of the folders** and the base classes/decorators a capped search reveals — not off the bodies of the implementations. Tracing one real request end-to-end is worth more than sampling twenty files.

Template and guidance for documenting the project architecture in `<CODEBASE_DIR>/architecture.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Arquitetura

> ⚠️ **Armadilha** — `npm run build` passa com a fronteira `domain → infra` violada: quem a recusa é `npm run lint` (`eslint.config.ts`), e o hook de pré-commit não o roda (`.husky/pre-commit`).

## Padrão

**Padrão principal**: [Em camadas / Hexagonal / Clean Architecture / MVC / CQRS / Orientado a eventos / Microsserviços / Monólito modular]

[Explicação curta de como o padrão é aplicado neste projeto — não a definição de manual, mas a interpretação que este código faz dela.]

## Camadas e fronteiras

Camadas lógicas e suas responsabilidades:

| Camada | Responsabilidade | Caminho de exemplo |
|-------|---------------|--------------|
| Apresentação | Handlers HTTP, controllers, resolvers | src/controllers/ |
| Aplicação | Casos de uso, orquestração, DTOs | src/services/ |
| Domínio | Regras de negócio, entidades, objetos de valor | src/models/ |
| Infraestrutura | Banco, APIs externas, mensageria | src/infra/ |

## Fluxo de dados

Como uma requisição típica atravessa o sistema:

```
Requisição do cliente
  → Router (src/routes/)
    → Middleware (auth, validação)
      → Controller (src/controllers/)
        → Service (src/services/)
          → Repository (src/repositories/)
            → Banco
```

## Estilo de API

- **Tipo**: REST / GraphQL / gRPC / tRPC / WebSocket
- **Caminho base**: /api/v1
- **Documentação**: Swagger em /api/docs (quando houver)
- **Autenticação**: Bearer token / Sessão / API key

## Gerência de estado (frontend)

- **Biblioteca**: Redux / Zustand / Context / Vuex / Pinia / Signals
- **Padrão**: Store centralizada / Estado atômico / Estado de servidor (React Query, SWR)
- **Local**: src/store/ ou co-locado com as features

## Fronteiras de domínio

Como o projeto separa os domínios de negócio:

| Domínio | Caminho | Responsabilidade central |
|--------|------|---------------------|
| Pedidos | src/domains/orders/ | Ciclo de vida do pedido |
| Auth   | src/domains/auth/   | Autenticação e autorização |

## Decisões arquiteturais relevantes

Decisões que mudam como o código deve ser escrito (procure ADRs em docs/adr/ ou ARCHITECTURE.md):

- [Decisão]: [Motivo]
- [Decisão]: [Motivo]

## Guia de mudança

| Ao mexer em | Verifique |
|---|---|
| `src/ports/` | Todo adaptador de `src/infra/` que implementa a porta — a assinatura é o contrato, e quebrar um adaptador não quebra o build do outro |
| `src/routes/` | O middleware de auth que a rota atravessa: rota registrada fora do router central entra sem guard, e nenhum teste acusa |
```

## Good vs. bad

The failure mode of this file is the pattern name with no rule attached: a label a reader cannot act on, and a data flow that repeats the textbook instead of the repo.

| Write this | Not this |
|------------|----------|
| Hexagonal: o domínio não importa infraestrutura. `src/providers/` não pode importar `src/orchestrator/` — `test/custom-sdk-engine.test.ts` documenta a fronteira | Arquitetura hexagonal com ports e adapters |
| `deliver` → `GitPort.commit()` (`src/ports/git.port.ts`) → adaptador concreto em `src/infra/` | Controller chama service, service chama repository |
| Sem ADR no repo; as decisões vivem em comentário de bloco no próprio arquivo, referenciadas por `AD-xxx` | Decisões arquiteturais: não documentadas |
| `src/providers/` — um provider novo precisa entrar no registro de `src/providers/registry.ts`, senão a escolha cai no padrão sem erro algum | Ao mexer na camada de providers, verifique os impactos |
| > ⚠️ **Armadilha** — `npm run test:e2e` escreve no banco de desenvolvimento: não existe `.env.test`, e os e2e reusam o `DATABASE_URL` do dev (`test/jest-e2e.json`) | > ⚠️ **Atenção** — Cuidado ao rodar os testes deste projeto |

## Field Guidance

- **Cabeçalho — the trace of the pass**: a two-field YAML frontmatter, before the `#` title, is the first thing in the generated file.
  - `analisado_em` is the ISO date of the pass **that wrote this file**, and `commit` its short `HEAD`. Both arrive in the delegation payload — this step never runs `git` on its own.
  - **Two fields, and nothing else.** No author, no skill version, no list of files read: the header is a trace, not process metadata.
  - A repo that is not a git work tree omits `commit`, with the reason said in one line under the title. Never an invented sha, and never `desconhecido` as a value — an absent field is honest, a filled one is not.
  - The trace does **not** decide freshness. That authority stays with `.research-state.md`, and a fresh output is still skipped without being opened — reading every file to check its header would cost the whole economy of a resumed pass.
  - A file marked `adopted` — written by an earlier version, with no trace — keeps having none. The absence is the sign of where it came from, and dating it now would assert what nobody verified.
- **Bloco de armadilha**: the first thing under the `#` title, above any table, section or paragraph, in the form `> ⚠️ **Armadilha** — …`.
  - **Strict definition:** a pitfall is **a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is **not a surprising finding**, **not technical debt**, and **not the consequence of a change**. Without those three exclusions the block becomes a notice box and stops being read, which is the failure mode of every banner at the top of a file.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - More than one pitfall: they stack at the top, one block each — never a `## Armadilhas` section with sub-items in the middle of the file.
  - The marker is always the pair `⚠️ **Armadilha**`. The bare `⚠` keeps meaning "claim from the reference docs not found in the code", and keeps feeding `OVERVIEW.md § Divergências`. **Two meanings, two markers.**
  - **Boundaries — where a finding goes when it is not a pitfall:** fragility goes to `risks.md`, the consequence of an edit goes to `## Guia de mudança`, and anything else goes to the section that describes it. The same sentence never appears in two of them.
  - Concrete path (rule 2), and a command that comes from the manifest, the config or the CI (rule 4). The pitfall is derived from what this step already read — it never authorises opening an extra file, and no `Input cap` rises because of it.
- **Padrão**: Don't force a pattern name if the codebase is mixed. Describe what you actually see, not what you think it should be.
- **Fluxo de dados**: Use an ASCII diagram showing the actual flow. Trace a real request from entry to database.
- **Fronteiras de domínio**: name the boundary *mechanism* (Maven/Gradle modules, workspace packages, feature folders, bounded contexts) and **3–5 representative boundaries**. The complete unit-by-unit map lives in `OVERVIEW.md` — never duplicate it here; a second copy of that map is guaranteed to drift, and on a repo with dozens of units it is what makes this the largest file in `<CODEBASE_DIR>`. Same discipline `structure-reference.md` already applies to its Monorepo section.
- **Decisões arquiteturais relevantes**: These prevent agents from accidentally violating design choices. Look for ADR files, ARCHITECTURE.md, or comments in code.
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
| Folder naming (`controllers/`, `services/`, `repositories/`) | Layered architecture cues |
| `ports/` and `adapters/` folders | Hexagonal architecture cues |
| Decorator usage (`@Controller`, `@Injectable`) | Framework-driven architecture |
| Route definitions | API style and endpoint organization |
| State management imports | Frontend state approach |
| ADR files, ARCHITECTURE.md | Explicit architectural decisions |
| Base classes / interfaces | Contract definitions and layer separation |
