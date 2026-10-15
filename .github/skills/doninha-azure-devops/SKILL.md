---
name: doninha-azure-devops
description: 'Generic Azure DevOps integration skill — reads/creates/updates/links work items respecting the fixed Feature→PBI→Task hierarchy, with every work-item type name, state name, and custom field resolved from the project''s own .doninha/integrations/azure-devops.yml config or discovered at runtime — never a hardcoded literal (e.g. never a fixed "PBI"/"Bug" type name). Used by doninha-analisar and doninha-desenvolver as their single interface to the tracker; never called directly by the user. Absent config → the caller offers an interactive first-run setup (writes the config); only if declined does it run local-only, no error. Use when another skill needs to read a work-item, create/update a Feature/PBI/Task, link a child to its parent, or sync a local status change to Azure DevOps.'
---

# Doninha Azure DevOps

`doninha-azure-devops` is the single interface other Doninha skills (`doninha-analisar`, `doninha-desenvolver`) use to talk to an Azure DevOps project. It is **not** meant to be invoked directly by the user — it is a service skill other skills delegate to.

## Why this skill exists

Every Azure DevOps project names its work-item types, states, and custom fields differently. This skill never assumes a fixed vocabulary (no literal `"PBI"`, `"Bug"`, `"Active"`, or any specific custom-field GUID baked in anywhere). Instead it resolves everything from the calling project's own `.doninha/integrations/azure-devops.yml`, falling back to runtime discovery via the MCP server's own tools when the config doesn't map something. The only fixed assumption is the **hierarchy shape**: Feature → PBI → Task. Extra levels a project might have (e.g. an Epic above Feature) are ignored, not modeled.

## Configuration this skill reads

`.doninha/integrations/azure-devops.yml`, written by `doninha init` when the user opts in:

```yaml
org: minhaorg
project: MeuProjeto

# work_item_types:
#   feature: Feature
#   pbi: Product Backlog Item
#   task: Task
#   bug: Bug

# states:
#   new: New
#   active: Active
#   resolved: Resolved
#   closed: Closed

# custom_fields:
#   Custom.MeuCampo: valor

# area_path: 'MeuProjeto\Time'
# iteration_path: 'MeuProjeto\Time\Sprint X'
```

- **File absent** → the caller first **offers to configure the integration now** (see "First-run configuration" below); only if the user declines does the session operate **local-only** (no work-item reads/writes, no error). Say the offer/fallback once, don't repeat it on every call.
- **`org`/`project` present, `work_item_types`/`states`/`custom_fields` commented out or absent** → the normal case. Resolve type/state names via runtime discovery (see below).
- **A map is present** → it wins over discovery for the keys it defines; still fall back to discovery for any canonical key it doesn't map.
- **`area_path` / `iteration_path` present** → every work item created is placed at that area path and iteration (sprint) via the standard `System.AreaPath` / `System.IterationPath` fields. **Absent → ask the user where to create, never fall through to the Azure DevOps project/team default** (which drops items at the project root with no sprint); the answer is written back to this config so it's asked once per project. See the mandatory destination gate in [references/crud-hierarchy.md](references/crud-hierarchy.md) → "Resolve the destination". These are generic ADO concepts, never a hardcoded literal in this skill.

## First-run configuration — offer to set it up, don't silently fall back

When a caller (`doninha-analisar` / `doninha-desenvolver`) finds `.doninha/integrations/azure-devops.yml` **absent**, it does not silently drop to local-only. It first **offers** to configure the integration now; if the user accepts, it runs this short interactive setup, writes the config, and the session then proceeds in **ado mode**. If the user declines, it proceeds local-only (and may offer again on a future run).

The setup Q&A (facilitated in the caller's language — PT-BR for Doninha):

1. **Organization** (required) — the Azure DevOps organization. Accept the org name or a full URL and derive it (`https://dev.azure.com/<org>` or `https://<org>.visualstudio.com` → `<org>`).
2. **Project** (required) — the project name inside that organization.
3. **Type/state vocabulary** (optional — recommend skipping) — explain that work-item **type** and **state** names are discovered automatically on first use and cached back into the config, so they normally don't need to be entered. Only capture them now if the user wants to pin specific names.
4. **Area / iteration path** (ask — don't offer to skip blindly) — ask where new items should be created: which `area_path` (team/area, not the project root) and which `iteration_path` (sprint). Offer the real options discovered from the project — the area paths (classification nodes) and the team's iterations, with the **current sprint** (the one whose date range contains today) as the default suggestion. The user may answer "no sprint", which is recorded as a deliberate choice. If they'd rather decide later, leave both keys commented — the destination gate will then ask on the first create instead of silently defaulting to the project root.

Confirm `org`/`project` back to the user, then write `.doninha/integrations/azure-devops.yml` with `org`/`project` filled in and the `work_item_types` / `states` / `custom_fields` / `area_path` / `iteration_path` blocks left **commented** (exact shape in "Configuration this skill reads" above), so runtime discovery fills types/states on first use. Uncomment a block only for values the user explicitly provided.

**Auth is set up separately — never captured in this Q&A:**

- **Claude (interactive):** no secret to enter — the first work-item call triggers the MCP server's browser login (MSAL). Tell the user the sign-in will appear on the first tracker operation.
- **VSCode (PAT):** the server reads a PAT from `.env` via `envFile`. Tell the user to place their PAT there — never ask them to paste it into chat, and never write it into `azure-devops.yml`.

Once the file is written, hand control back to the caller to continue in ado mode.

## Resolving type and state names — config first, then discovery, never a literal

For any canonical key (`feature`, `pbi`, `task`, `bug`, or a state like `new`/`active`/`resolved`/`closed`):

1. **Config lookup (always first)** — if `work_item_types`/`states` in `azure-devops.yml` maps this canonical key, use that literal string. This is the common case after the first run (see caching below) — no discovery cost.
2. **Runtime discovery (only when unmapped) — keep it cheap.** If the config doesn't map the key, discover the real name with the **fewest possible** MCP calls:
   - Prefer a **direct lookup**: list the project's work-item types once, or read the child type of a single existing parent (e.g. inspect one existing Feature's child to learn the `pbi`-level type name).
   - **Do NOT crawl the backlog** — no WIQL sweeps + batch-fetching many items + faceted searches just to enumerate types. That burns tokens; one targeted call is enough.
   - This resolves stock templates ("Product Backlog Item") *and* custom processes (e.g. `Feature → Deliverable → Development`, where `pbi` = "Deliverable", `task` = "Development") with zero code change.
3. **Cache the result (write-back).** As soon as discovery resolves the canonical keys, **write them back** into `azure-devops.yml` under `work_item_types`/`states`, so the next run is config-first and pays no discovery cost. Discovery should happen **once per project**, not every session.
4. **Indescoberto** — if neither config nor a cheap discovery can resolve a key that's actually needed, stop and tell the user plainly which key couldn't be resolved (never guess a name, never silently skip a required hierarchy level).

## Tools

MCP tools are provided by the `@azure-devops/mcp` server (official Microsoft), installed opt-in by `doninha init`. Tool names are **discovered at call time** — this skill never hardcodes a literal tool name (e.g. never writes `mcp__azure-devops__wit_get_work_item` as a fixed string anywhere in its own instructions); whatever the server exposes for reading/creating/updating work items and for discovering types/states is what gets called.

Auth is per client tool, set up by `doninha init` and out of this skill's control: Claude uses interactive browser login (MSAL) on the first unauthenticated call; VSCode uses a PAT read from `.env` via `envFile`. This skill never asks for or handles credentials directly — see [references/crud-hierarchy.md](references/crud-hierarchy.md) for how auth failures are reported.

## What this skill does

See [references/crud-hierarchy.md](references/crud-hierarchy.md) for the full CRUD + hierarchy + sync discipline: reading a work item, the **whole-card read** (fields + comments + attachments, including images pasted inline, which do not always show up in the relations list), creating a child with a mandatory parent link, the get-before-update rule, comment-based discussion (never overwriting description), the local→ADO sync direction, and failure handling.

**Three user-confirmation gates are mandatory and non-negotiable**, all defined canonically in that reference — callers cite them rather than restating them:

- **Resolve the destination** ("Resolve the destination — MANDATORY gate") — no work item is created before its area path and iteration (sprint) are resolved. Config first; if either is missing, ask the user with the project's real areas/sprints as options, then cache the answer. Never create at the project root because the config was silent.
- **Confirm before creating** ("Confirm before creating — MANDATORY gate") — no work item is created until the user approves the batch. Takes 1..N pending items in a single numbered confirmation, headed by the resolved destination.
- **Confirm before closing / finalizing** ("Confirm before closing / finalizing — MANDATORY gate") — no terminal-state transition is applied without explicit approval.

Everything else (non-terminal transitions, content-only updates) proceeds without a gate.

## Language

Skill instructions (this file + references) are in **English**. Facilitation with the user and any generated content follow the calling skill's own convention (Doninha's is PT-BR) — this skill doesn't own user-facing text, it's invoked by other skills.
