# Integrations Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 2,000 tokens (~1,200 words). **Input cap:** 10 files, 6 searches, 30 results each.

**Purpose:** Document external dependencies — databases, APIs, brokers, cloud services, CI/CD — and the project's observability capabilities.

**Extract from:**

- **Declared dependencies** in the manifests the inventory listed — this is the primary source for which SDKs and clients exist
- `.env.example` / `.env.sample`, `docker-compose.yml`
- Up to **4** CI/CD and IaC files
- Integration config code (`src/config/`, `src/infra/`) only when a dependency's purpose is otherwise unclear
- The logging/telemetry config the project already carries — appender or transport setup (`logback.xml`, `log4j2.*`, winston/pino), an OTel exporter's env vars, the container log driver — inside the same input cap, not on top of it

The SDK inventory comes from **declared dependencies**, not from a repo-wide import sweep. When you do need to know whether a declared package is actually wired up, use one alternation search over the package names (`rg -l --max-count 1 -e '<pkg-a>' -e '<pkg-b>' | head -30`) — not one search per package.

Template and guidance for documenting project integrations in `<CODEBASE_DIR>/integrations.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Integrações

> ⚠️ **Armadilha** — `REDIS_URL` está no `.env.example` e não no deploy: sem ela o cliente cai em modo sem cache e não registra nada, e a aplicação sobe normalmente (`.env.example`, `docker-compose.yml`).

## Bancos de dados

| Banco | Cliente/ORM | Onde é configurado | Papel |
|----------|-----------|-----------------|---------|
| PostgreSQL | Prisma | prisma/schema.prisma | Armazenamento principal |
| Redis | ioredis | src/config/redis.ts | Cache e sessão |

## APIs externas

| Serviço | SDK/Cliente | Env var da URL base | Papel |
|---------|-----------|------------------|---------|
| Stripe | @stripe/stripe-node | STRIPE_API_URL | Processamento de pagamento |
| SendGrid | @sendgrid/mail | SENDGRID_API_KEY | E-mail transacional |

## Provedores de autenticação

| Provedor | Protocolo | Onde é configurado | Papel |
|----------|----------|-----------------|---------|
| Auth0 | OAuth 2.0 / OIDC | src/config/auth.ts | Autenticação de usuário |
| Google | OAuth 2.0 | .env (GOOGLE_CLIENT_ID) | Login social |

## Mensageria e filas

| Broker | Cliente | Onde é configurado | Papel |
|--------|--------|-----------------|---------|
| RabbitMQ | amqplib | src/infra/messaging/ | Processamento assíncrono de evento |
| SQS | @aws-sdk/client-sqs | src/config/aws.ts | Jobs em segundo plano |

## Serviços de nuvem

| Serviço | SDK | Papel |
|---------|-----|---------|
| S3 | @aws-sdk/client-s3 | Armazenamento de arquivo |
| CloudWatch | @aws-sdk/client-cloudwatch | Monitoramento |

## CI/CD

| Plataforma | Arquivo de config | Estágios |
|----------|-------------|------------|
| GitHub Actions | .github/workflows/*.yml | lint, test, build, deploy |
| Azure DevOps | azure-pipelines.yml | build, test, deploy |

## Monitoramento e observabilidade

Uma linha por capacidade, `none` inclusive — chaveada pelo papel que a ferramenta cumpre, não pelo produto:

| Capacidade | Ferramenta | Evidência no repo | Escopo |
|------------|----------|------------------|-------|
| logs | Datadog | @datadog/browser-logs, DD_SERVICE no .env.example | service:checkout |
| metrics | Prometheus | prom-client, /metrics em src/server.ts | — |
| runtime | none | nenhum profiler/agente declarado | — |
| edge | nginx | deploy/nginx.conf | — |
| rastreio de erro | Sentry | @sentry/node, SENTRY_DSN | — |
| APM e tracing | Datadog | import de dd-trace | — |

## Variáveis de ambiente

As variáveis que configuram integração (de .env.example ou equivalente):

| Variável | Integração | Obrigatória |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL | Sim |
| REDIS_URL | Redis | Sim |
| STRIPE_SECRET_KEY | Stripe | Sim |
| SENTRY_DSN | Sentry | Não |

## Guia de mudança

| Ao mexer em | Verifique |
|---|---|
| `.env.example` | A variável nova precisa entrar também na config de deploy e no CI: o app sobe local e morre no ambiente, onde ninguém lê o `.env.example` |
| `src/infra/messaging/` | Quem consome o tópico do outro lado — mudar o formato da mensagem quebra um repo que não compila junto com este, e nenhum teste daqui acusa |
| `src/config/` | É onde o cliente da API externa é instanciado: subir a versão do SDK muda o shape da resposta, e o compilador não reclama quando o tipo chega como `any` |
```

## Good vs. bad

The failure mode of this file is the dependency list copied off the manifest: a package name with no endpoint, no config file and no answer to *what breaks if this is down*.

| Write this | Not this |
|------------|----------|
| Doninha Hub — HTTP em `DONINHA_HUB_URL` (embutido no pacote; `https:` exigido fora de `localhost`); o CLI confere o `sha256` de cada arquivo baixado | Consome a API do Hub |
| Azure DevOps via MCP configurado pelo `init`; Claude Code autentica interativo, VSCode+Copilot por PAT gravado no `.env` do projeto | Integração com Azure DevOps |
| `SONAR_URL` / `SONAR_TOKEN` — obrigatórias para o gate; ausentes, `sonar-run` devolve erro de configuração e o gate é pulado | Variáveis do Sonar |
| `.env.example` — variável nova entra aqui **e** na config de deploy; só aqui, o app sobe local e morre no ambiente | Ao mexer nas integrações, verifique os impactos |

## Field Guidance

- **Bloco de armadilha**: the first thing under the `#` title, above any table or section, in the form `> ⚠️ **Armadilha** — …`. **A pitfall is a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is not a surprising finding, not technical debt, and not the consequence of a change.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - The pitfall of *this* file is the dependency that is absent and does not announce itself: a variable in `.env.example` and not in the deploy, a compose service the documented command does not start, a credential whose absence degrades the client instead of failing it. Name the path of **both** sides — where it is declared and where it is missing. **An integration that is merely undocumented is not a pitfall** — it is section content.
  - Where a finding goes when it is not a pitfall: fragility goes to `risks.md`, the consequence of an edit goes to `## Guia de mudança`, anything else to the section that describes it.
  - Stacking more than one, and the boundary with the bare `⚠` of the reference-docs reconciliation, are written once in `architecture-reference.md`'s `## Field Guidance`.
- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Onde é configurado**: Point to the actual file where the integration is configured or the client is instantiated.
- **Env var da URL base**: For external APIs, note which environment variable holds the URL — this prevents hardcoded values.
- **Variáveis de ambiente**: Only list variables related to integrations. General app config (PORT, NODE_ENV) belongs in conventions.
- **Obrigatória**: Mark whether the integration is required for the app to start or optional (graceful degradation).
- **`## Guia de mudança`**: the last section of the file, and the only one that speaks to the *moment of the edit* rather than to the current state.
  - **Column 1 is always a concrete path** — a file or a directory. **A directory path is valid when the consequence belongs to the whole directory**; what is refused is the layer description with no path at all: "a camada de serviço", "os componentes" and every equivalent.
  - **Column 2 is the consequence, never the description**: what breaks, what has to be regenerated, what has to be tested. If the sentence would fit unchanged in a descriptive section above, the entry is not a guide entry — drop it.
  - **No known consequence, no entry.** The table is never filled to justify the header, and with no entry at all **the whole section is omitted** (rule 3).
  - **A verification command comes from the manifest, the config or the CI** (rule 4). With no origin the entry ships without a command — never with a plausible one.
  - **Derive it from what this step already read.** Migrations, generated clients, contract tests, lint config, path aliases and environment variables are already in this step's evidence. The guide never authorises opening an extra file, and no `Input cap` rises because of it.
  - **Boundary with `risks.md`**: `## Áreas frágeis` records **that** a file is fragile; this section records **what to check** when you touch it. Never the same sentence in both.
  - **Over the ceiling, descriptive prose is cut before a guide entry.** The `Size limit` is never raised to fit the guide — the guide displaces description.

### Monitoring & Observability

- **Capability**: the role the tool plays — `logs`, `metrics`, `runtime`, `edge`, `error tracking`. A tool that covers two roles gets two rows; a role nothing covers gets a row with provider `none`. This table is what `doninha-observability-context` reads to resolve what an investigation can actually observe, so the capability key matters more than the product name.
- **Evidence in repo**: the declared dependency, env var or config file that proves it. No evidence, no row — this table records what the repo states, never what a stack of that kind usually has.
- **Scope**: the narrowing a query would need — service name, index pattern, dashboard id — only when the repo names it (e.g. `DD_SERVICE`, `OTEL_SERVICE_NAME`). Leave `—` otherwise.
- **The repo names the provider; it almost never says how to query it.** Endpoint, credential and index live outside the code, so leaving that unknown here is correct, not incomplete — `doninha-observability-context` asks the user for it once and caches the answer.
- **Write the section even when it is empty.** A project with no observability at all gets rows with provider `none`; omitting the section makes "not researched" and "nothing there" indistinguishable to its readers, and they behave differently.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| `.env.example`, `.env.sample` | Required environment variables |
| `docker-compose.yml` | Infrastructure dependencies (DB, Redis, queues) |
| Package dependencies | SDKs and clients in use |
| `src/config/`, `src/infra/` | Integration configuration code |
| CI/CD pipeline files | Build and deployment integrations |
| Import statements for SDKs | Which services are actually used in code |
| Appender/transport config (`logback.xml`, `log4j2.*`, winston/pino) | Where logs are written and in what format — the `logs` capability |
| `OTEL_*` env vars, agent/sidecar in compose or k8s manifests | The telemetry backend behind `metrics`/`logs` when no SDK is declared |
| Log driver in `docker-compose.yml` / k8s manifests | Whether logs leave the container at all |
| Proxy, ingress or WAF config in the deploy dir | The `edge` capability — who answers when the app logs nothing |
