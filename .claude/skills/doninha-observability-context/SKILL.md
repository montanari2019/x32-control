---
name: doninha-observability-context
description: 'Resolves which observability and source capabilities a session actually has — logs, metrics, runtime, code index, edge, source, tracker — from the project''s own .doninha/integrations/observability.yml, from the codebase docs, from the environment, or by asking the user and writing the answer back. Every capability is a ROLE (logs, metrics, …), never a product name: one unit runs Grafana + OpenSearch, another Datadog, another nothing at all, and the calling skill''s instructions do not change. Used by doninha-analisar (INVESTIGAÇÃO mode) as its single interface to "what can I actually observe here"; never called directly by the user. Nothing configured → declared LACUNA and a confidence ceiling, never a silent gap and never an invented tool.'
---

# Doninha Observability Context

`doninha-observability-context` resolves the **capability map** for a session: which of the seven investigation capabilities exist in this project, how each one is reached, and what is missing. It is **not** meant to be invoked directly by the user — it is a service skill other skills delegate to, like `doninha-workspace-detection` and `doninha-azure-devops`.

## Why this skill exists

A root-cause investigation is only as good as what it can read. But every unit observes its systems differently: one has OpenSearch for logs and Grafana for metrics, the next has Datadog for both, the next has a `docker logs` and nothing else. A skill that names products in its instructions works in exactly one unit.

So the caller's instructions name **roles**, never products. "Consult the `logs` capability" is portable; "consult the Grafana dashboard" is not. This skill is where a role becomes a concrete provider — and where the absence of a provider becomes a declared gap instead of a silent one.

**Nothing here is ever guessed.** A capability that cannot be resolved is `none`, and `none` travels into the report as a `LACUNA` with a confidence ceiling attached. An investigation that quietly skipped the logs and concluded anyway is worse than one that says it could not read them.

## The capability contract

Seven roles. `source` is the only one an investigation cannot run without.

| Capability | Answers | Without it |
|---|---|---|
| `source` | what the code actually says, pinned at a commit | **required** — stop and tell the user; there is no investigation without code |
| `tracker` | the bug report, its comments, sibling items already closed with the same symptom | the user's own account becomes the report; precedent narrows to commit history |
| `logs` | which line emitted this message; what else failed in the window | the log→code bridge is `LACUNA Alto`; findings cap at **Média** |
| `metrics` | throughput, latency, error rate — did this track load or a release? | "load, not release" stays a hypothesis with no falsifier |
| `code_index` | fan-in, symbol search, blast radius | fall back to `rg`/`git grep` and declare the boundary reached |
| `runtime` | thread/heap/profiler state of a live or captured process | only matters for the concurrency/CPU/memory symptom class |
| `edge` | who answered when the application logged nothing (proxy, gateway, ingress, WAF) | the "who responded?" question of the entry-point gate stays open |

Each resolved capability carries four fields:

| Field | Meaning |
|---|---|
| `provider` | free-form product name — `opensearch`, `datadog`, `kibana`, `loki`, `cloudwatch`, `sentry`, `grafana`, `prometheus`, `new-relic`, `pharos`, `gitlab`, `github`, `cloudflare`, `nginx`, … or `none` |
| `access` | how it is reached: `mcp:<server-name>`, `cli:<binary>`, `url:<endpoint>`, `manual` (a human pastes the data) or `none` |
| `scope` | the narrowing the provider needs — index pattern, service name, dashboard id, project key |
| `notes` | anything the next run should know, including why something is `none` |

`access: manual` is a first-class answer, not a degraded one: a user who exports a log slice and pastes it is a real `logs` capability, and the report says so.

## Configuration this skill reads

`.doninha/integrations/observability.yml` — written by `doninha init` when the user opts in, or by this skill's own write-back. Everything commented means "discover at runtime", exactly like `azure-devops.yml`:

```yaml
# Observabilidade e fontes de investigação (gerado pelo `doninha init`).
# Segredo NÃO fica aqui — token/credencial vêm do ambiente ou do .env.
#
# Cada bloco é um PAPEL, não um produto. Comentado = descoberta em runtime:
# a skill PERGUNTA na primeira vez que precisar do papel e grava a resposta aqui.

# source:     { provider: gitlab,     access: 'cli:glab',   scope: 'grupo/servico' }
# tracker:    { provider: azure-devops, access: 'mcp:azure-devops' }
# logs:       { provider: opensearch, access: 'mcp:opensearch', scope: '*logstash-v2*' }
# metrics:    { provider: grafana,    access: 'mcp:grafana', scope: 'dash/kong-gateway' }
# code_index: { provider: none }
# runtime:    { provider: jvm,        access: 'mcp:jvm-diagnostics' }
# edge:       { provider: nginx,      access: manual, notes: 'config pedida ao time de infra' }
```

The same file in another unit, and not one line of any skill changes:

```yaml
source:  { provider: github,  access: 'cli:gh',  scope: 'org/checkout-api' }
logs:    { provider: datadog, access: 'cli:dog', scope: 'service:checkout' }
metrics: { provider: datadog, access: 'cli:dog' }
runtime: { provider: none }
edge:    { provider: cloudflare, access: none, notes: 'sem acesso; pedir ao time de plataforma' }
```

- **File absent** → do **not** silently assume everything is `none`. Run the resolution below; the ask rung offers to configure what the session actually needs.
- **A capability present** → it wins over every other rung, including a live probe that disagrees. The user pinned it on purpose.
- **A capability absent or commented** → resolve it through the rungs, then write back what was learned.

## Resolution — five rungs, in order

Resolve **per capability**, not all-or-nothing. A project can have `logs` configured, `metrics` discovered and `runtime` unknown in the same session.

1. **Config** — `.doninha/integrations/observability.yml`. Present → done, no cost.
2. **Codebase docs** — the `Observabilidade` section of `CODEBASE_DIR/integrations.md` (resolved per `doninha-workspace-detection`), written by `doninha-project-research` from the repo's own declared dependencies. A project shipping `@datadog/browser-logs`, `@sentry/node` or an OTel exporter has already told you who its `logs` provider is. This rung reads what is written there; it never sweeps the tree itself. A file researched before that section was keyed by capability carries a product-keyed table instead — read what it offers, resolve nothing from it by guesswork, and fall through to the next rung.
3. **Environment probe** — which MCP servers are actually **connected** this session (by name, from what the harness exposes — never a hardcoded tool-name literal), and which CLIs answer on `PATH` (`glab`, `gh`, `dog`, `aws`, `kubectl`, …). A configured-but-unreachable server is **not** a capability: report it as `none` with the connection error in `notes`, so the report says "unavailable", not "clean".
4. **Ask the user** — only for the capabilities this session actually needs (see below), one question per capability, then **write the answer back to the config**. The write-back is the whole reason this rung is acceptable; without it the user answers the same question every run.
5. **`none`** — nothing resolved and the user could not say. Record it, carry the `LACUNA` into the report, apply the confidence ceiling. Never substitute a provider the project did not name.

## Ask once, ask late

Two rules keep rung 4 from becoming an interrogation:

- **Ask once.** Every answer is written back. A capability is asked about once per project, not once per session.
- **Ask late, and only what the case needs.** The caller supplies a **symptom class**; only the capabilities that class requires are resolved through rung 4. The rest stay unresolved and cost nothing until something actually needs them.

| Symptom class | Requires | Asked if unresolved |
|---|---|---|
| wrong data / logic defect | `source` | `logs` offered, not pressed |
| 5xx / timeout / latency | `source`, `logs`, `metrics`, `edge` | all four |
| concurrency / memory / CPU | `source`, `logs`, `runtime` | `runtime` offered, not pressed |
| regression after a deploy | `source`, `tracker` | `tracker` offered, not pressed |

The question, facilitated in the caller's language (PT-BR for Doninha), names the role and what it buys — never a product list the user has to recognize:

> "Para investigar **latência/5xx** eu preciso ler o log da aplicação na janela do incidente.
> Onde esse log vive neste projeto?
>
> **[1]** Tenho uma ferramenta configurada — digo qual e como acessar
> **[2]** Consigo exportar e colar um trecho aqui
> **[3]** Não tenho acesso a log neste projeto
>
> (a resposta fica gravada em `.doninha/integrations/observability.yml` — pergunto uma vez só)"

**STOP — wait for the answer.**

- **[1]** → capture `provider`, `access` and `scope` in the user's own words, confirm back, write to the config.
- **[2]** → `access: manual`, and the caller asks for the slice when it reaches the step that needs it.
- **[3]** → `provider: none` with the reason in `notes`. Write it back too: a deliberate "no" is a resolution, and re-asking it every run is the failure this rung exists to avoid.

Never ask for a credential in this Q&A, and never write one to the config — same rule as `doninha-azure-devops`. Tokens come from the environment or `.env`.

## Three states, never two

A capability is in exactly one of these, and the report must be able to tell them apart:

| State | Meaning | Allowed to conclude |
|---|---|---|
| `NÃO CONFIGURADO` | no provider for this role | nothing about it |
| `NÃO CONSULTADO` | provider exists, this run did not use it | nothing about it |
| `CONSULTADO` | provider exists and was queried, with the query recorded | what the result actually shows |

**Absence of log is not absence of error.** In neither of the first two states may the report say "no errors in the log", "the metric was flat" or "nothing in the profiler". This is the same discipline a scanner gate uses: a scanner that did not run is not a clean scanner.

A query that came back empty is `CONSULTADO` and a real result — but only after it has been re-run at least once with a widened term or window, and both attempts recorded. An empty result from one narrow guess is not evidence.

## Confidence ceilings

A missing capability does not stop an investigation; it bounds what the investigation may claim. The caller applies these when it assigns confidence:

| Missing | Ceiling |
|---|---|
| `logs` | no finding above **Média** — the log→code bridge is unbuilt |
| `metrics` | "correlates with load, not with a release" is **not assertable**; it stays a hypothesis with its falsifier written down |
| `code_index` | blast radius is bounded by what text search reached; the report names the boundary instead of implying coverage |
| `runtime` | a mechanism claim about threads, heap or GC is **not assertable** from inference alone |
| `edge` | if the application logged nothing, "who answered" is `LACUNA Alto` and the verdict is at best **Inconclusivo** for that link |

A ceiling is floor-like: the lowest ceiling among the capabilities a finding depends on is the one that applies. Ceilings are never averaged into a score.

## Output

The caller receives, and carries into its report:

1. **The capability map** — the seven roles with `provider`/`access`/`scope`, plus the state of each.
2. **The `LACUNA` list** — every `none`, with its reason and the ceiling it imposes.
3. **The tool-substitution note** — anything resolved to `access: manual` or to a provider that differs from what the config claimed, so a reader knows what the session actually read.

Re-resolution inside one session is forbidden: resolve once, at the caller's setup step, and pass the map down. A step that finds itself wanting a capability the session resolved as `none` declares the gap — it does not re-ask.

## Language

Skill instructions (this file) are in **English**. Facilitation with the user follows the calling skill's convention (Doninha's is PT-BR) — this skill does not own user-facing text, it is invoked by other skills.
