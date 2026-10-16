# Concerns Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 2,500 tokens (~1,500 words). **Input cap:** 10 files, 6 searches, 30 results each.

**Purpose:** Document cross-cutting concerns — auth, logging, errors, validation, caching, i18n, security, performance.

**Extract from:**

- Declared dependencies (they name the auth, validation, logging and security libraries before any code is read)
- Up to **6** files — at most **one per concern category**: middleware/guard, logger, validation schema, cache, i18n, security config

One search per category, capped. A category with no hit in its one search is **omitted** from the output — that is the same discipline as the omit-empty-sections rule above, and it is cheaper than proving an absence.

Template and guidance for documenting cross-cutting concerns in `<CODEBASE_DIR>/concerns.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Aspectos transversais

> ⚠️ **Armadilha** — o handler global captura toda exceção e não registra nada (`src/middleware/error-handler.ts:24`): o erro some, a resposta sai `200` e quem chamou trata a falha como sucesso.

## Autenticação e autorização

- **Estratégia**: JWT / Sessão / OAuth 2.0 / API Key
- **Implementação**: [Biblioteca ou própria — ex.: Passport.js, next-auth, middleware próprio]
- **Local**: [Caminho do middleware, guard ou decorator de auth]
- **Modelo de autorização**: RBAC / ABAC / ACL / Próprio
- **Onde o token fica**: cookie HTTP-only / localStorage / sessionStorage

## Tratamento de erro

- **Handler global**: [Caminho do handler ou middleware global]
- **Classes de erro próprias**: [Caminho das definições]
- **Formato da resposta de erro**:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Resource not found",
      "details": []
    }
  }
  ```
- **Erro não tratado**: [Como exceções não capturadas são pegas? Handler de processo?]

## Log

- **Biblioteca**: Winston / Pino / Bunyan / console / própria
- **Formato**: JSON estruturado / Texto puro
- **Níveis**: error, warn, info, debug
- **Local**: [Caminho da configuração do logger]
- **Destino**: stdout / arquivo / serviço externo (CloudWatch, Datadog)

## Validação

- **Biblioteca**: Zod / Joi / class-validator / Yup / própria
- **Onde é aplicada**: DTOs de requisição / Camada de serviço / Ambas
- **Local**: [Caminho dos schemas ou decorators]

## Cache

- **Estratégia**: Em memória / Redis / CDN / Cabeçalho HTTP
- **Invalidação**: TTL / Por evento / Manual
- **Local**: [Caminho da configuração ou dos decorators]

## Segurança

- **CORS**: [Onde é configurado e qual a política de origens]
- **Limite de taxa**: [Biblioteca e configuração — ex.: express-rate-limit]
- **Sanitização de entrada**: [Abordagem — ex.: DOMPurify, helmet, middleware próprio]
- **HTTPS**: [Imposto na aplicação ou na infraestrutura?]
- **CSP**: [Onde a Content Security Policy é configurada, quando houver]

## Internacionalização (i18n)

- **Biblioteca**: i18next / react-intl / vue-i18n / própria
- **Locale padrão**: pt-BR / en-US
- **Onde ficam as traduções**: [Caminho dos arquivos]
- **Estratégia**: Por chave / Formato de mensagem ICU

## Desempenho

Só entra o que tem número. Sem medição, a linha não existe.

- **Carregamento sob demanda**: [Como e onde — ex.: React.lazy, import dinâmico]
- **Divisão de bundle**: [Configuração do bundler]
- **Paginação**: [Estratégia — por cursor / por offset, tamanho padrão da página]
- **Otimização de banco**: [Estratégia de índice, padrões de consulta]

## Guia de mudança

| Ao mexer em | Verifique |
|---|---|
| `src/infra/http/error-filter.ts` | O formato de resposta contratado: os testes que batem nele falham em bloco, e todo consumidor que lê `error.code` quebra de uma vez |
| `src/schemas/` | Todo chamador que já mandava o payload antigo — apertar um schema rejeita requisição que ontem passava, e o erro aparece no cliente, não aqui |
| `src/cache/` | A invalidação correspondente: mudar o que compõe a chave sem mudar quem invalida deixa entrada órfã servindo dado velho até o TTL expirar |
```

## Good vs. bad

The failure mode of this file is the concern named with no location, and — in `## Desempenho` above all — the adjective standing in for a measurement.

| Write this | Not this |
|------------|----------|
| Paginação por cursor, página padrão de 50 itens (`src/infra/pagination.ts`); a consulta de margem responde em 180 ms no p95, medido em `scripts/bench-margem.ts` | Consultas otimizadas para performance |
| `maxWorkers: 2` em `vitest.config.ts` — mitigação do flake de carga descrito em `AD-036`, não conserto | Testes ajustados para rodar melhor |
| Sem i18n no repo — nenhuma biblioteca declarada e nenhum arquivo de tradução | Internacionalização: não implementada |
| `src/infra/http/error-filter.ts` — o formato de resposta é contrato: mudá-lo derruba em bloco os testes que batem nele | Ao mexer no tratamento de erro, verifique os impactos |

## Field Guidance

- **Bloco de armadilha**: the first thing under the `#` title, above any table or section, in the form `> ⚠️ **Armadilha** — …`. **A pitfall is a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is not a surprising finding, not technical debt, and not the consequence of a change.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - The pitfall of *this* file is the cross-cutting mechanism that swallows the signal: a global handler that catches and does not log, a validation disabled by config, a cache that never invalidates, an authorization check that returns empty instead of refusing. This is the one file where the failure is *the absence of the failure*. **A concern that is merely thin is not a pitfall** — it is section content.
  - Where a finding goes when it is not a pitfall: fragility goes to `risks.md`, the consequence of an edit goes to `## Guia de mudança`, anything else to the section that describes it.
  - Stacking more than one, and the boundary with the bare `⚠` of the reference-docs reconciliation, are written once in `architecture-reference.md`'s `## Field Guidance`.
- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Local**: Always include the file path where the concern is configured or implemented. This is the most useful information for agents.
- **Estratégia**: Name the specific approach, not just the concept. "JWT com refresh token em cookie HTTP-only" is more useful than "auth por token".
- **Bibliotecas**: Include the actual package name so agents can look up the correct API.
- **Desempenho**: **A performance or scale claim with no number does not go in.** No measurement, no claim — and when there is no number, **omit the line**: never a placeholder, and never the phrase "não medido". A number is a measured value with its unit and where it was measured, not an adjective.
- **Omit empty sections**: If the project has no i18n or no caching, omit those sections entirely rather than writing "não se aplica". The third row of the table above is the exception that proves the rule: a *verified* absence, with what was searched, is a finding — a blank placeholder is not.
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
| Middleware chain / pipeline | Auth, logging, error handling, validation |
| `src/middleware/`, `src/guards/` | Security and auth implementations |
| Logger imports and configuration | Logging approach |
| Validation schema files | Validation library and patterns |
| `helmet`, `cors`, `rate-limit` imports | Security middleware |
| Benchmark scripts, load-test configs, APM dashboards | The only admissible source of a performance number |
