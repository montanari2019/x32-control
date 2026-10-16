---
name: doninha-product-context
description: Fetches product/business context (product goal, glossary, scope & features, personas, interviews, similar systems, PRDs) from the doninha-docs-mcp MCP server instead of local files. Invoked by Doninha agents whenever they need business/product context for alignment, naming, or requirements grounding. Handles artifact discovery, selection budget, first-run product selection, and silent fallback to legacy local files when the MCP server is unavailable.
---

# Skill: Product Context (via doninha-docs-mcp)

Product and business context artifacts (product goal, glossary, scope & features, personas, interviews, similar-system references, PRDs) live in the Doninha API and are served by the **doninha-docs-mcp** MCP server. They are **not** authored in the local repository. This skill defines how to discover, select, and read them.

All artifacts fetched through this skill are **read-only** reference material. Never attempt to write or modify them.

## Tools

| Tool | Purpose |
| --- | --- |
| `mcp__doninha-docs-mcp__list-artifacts` | List available artifacts. Optional filters: `type`, `source`, `status`, `limit`. Returns a table: `id \| name \| type \| status \| source \| v \| path`. |
| `mcp__doninha-docs-mcp__get-artifact` | Fetch the full markdown content of one artifact by `artifactId`. |
| `mcp__doninha-docs-mcp__get-artifact-versions` | List previous versions of an artifact (rarely needed; use only when the user asks about history). |
| `mcp__doninha-docs-mcp__list-products` | List products available to the account. Only needed for the Product Selection flow below. |
| `mcp__doninha-docs-mcp__set-product-id` | Persist a chosen `productId` for the current MCP session. Only needed for the Product Selection flow below. |

## Product Selection (missing/unknown PRODUCT_ID)

On `no_product_selected` error from any doninha-docs-mcp tool: `list-products` → ask user → `set-product-id` (unblocks current session) → persist for next time → retry the original call.

Persist by editing whichever MCP config exists (skip if none):
- `.mcp.json` present (Claude Code) → edit `.claude/settings.local.json`, set `env.PRODUCT_ID` (create `env` if missing, keep other keys). Don't touch `.mcp.json` — its header is `${PRODUCT_ID}`, a reference.
- `.vscode/mcp.json` present (Copilot) → edit it directly, set the `doninha-docs-mcp` entry's `headers.X-Product-Id` to the literal id (no env indirection for this client).
- Both present → update both. Write fails (permissions) → skip silently, session is already unblocked.

Report which file was updated in one line. At most once per session — a repeat failure after a successful `set-product-id` is a real bug, not a re-trigger.

## Procedure

1. **Discover**: call `list-artifacts` once (no filters, or a `limit` high enough to see everything). Do NOT guess artifact ids.
2. **Select**: artifact `type` values are dynamic (defined per product in the Doninha API — e.g. `PRD`, `Requirements`, `UserFlow`, `Docs`). Never assume a fixed type exists. Instead, match the listed `name`, `type`, and `path` columns against the concept you need (case-insensitive):

   | Concept needed | Match hints (name/type/path) |
   | --- | --- |
   | Project goal / vision | goal, vision, overview, objetivo, PRD |
   | Glossary / domain terms | glossary, glossario, ubiquitous, terms |
   | Scope & features | scope, feature, escopo, requirements, backlog |
   | Personas | persona |
   | User interviews | interview, entrevista, discovery |
   | Similar systems / benchmarks | similar, reference, benchmark, concorrente |

   Prefer artifacts with an approved/published `status` over drafts when both exist.
3. **Fetch**: call `get-artifact` for each selected id.
4. **Budget**: carry **at most 3–4 artifacts** into the session. Fetch only what is relevant to the current request — never bulk-download the whole list.

## Fallback (silent)

`PRODUCT_ID` missing is handled above (Product Selection), not here. This fallback is for the other failure modes: the `doninha-docs-mcp` tools are unavailable, error out for a reason other than `no_product_selected`, or return no artifacts (server not configured, auth failure, empty product):

1. Fall back to the legacy local files, if present: `.doninha/product/` and `.doninha/docs/product/` (e.g. `overview/project_goal_context.md`, `overview/glossary_context.md`, `scope_features_context.md`, `discovery/interviews/`, `discovery/personas/`, `references/similar_systems/`). Resolve paths under `DONINHA_ROOT`. The same 3–4 file budget applies.
2. If neither source is available, **skip silently** and proceed without business context. Do not block the workflow, do not surface an error to the user; at most note in the produced artifact that product context was unavailable.

## Referencing artifacts in produced documents

When a produced artifact (discovery, business.md, spec, etc.) cites product context fetched via MCP, reference it as `artifact <id> — <name> (v<version>)` so downstream agents can re-fetch it with `get-artifact`.
