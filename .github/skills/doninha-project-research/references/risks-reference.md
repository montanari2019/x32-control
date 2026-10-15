# Risks Reference

> **Non-negotiable rules** — these bind before any other instruction in this file.
>
> 1. **Output language is PT-BR, headers included.** The domain vocabulary of the researched project stays exactly as that team writes it — never translated.
> 2. **No claim without a path.** A relevant claim with no concrete file path does not go in.
> 3. **Omit empty sections.** A section with no finding is omitted, never filled with a placeholder.
> 4. **Never invent a command.** It comes from the manifest, the config or the CI, or the cell stays empty.
> 5. **No performance or scale claim without a number.** No measurement, no claim.
> 6. **Size limit:** 1,500 tokens (~900 words). **Input cap:** 8 files, 6 searches, 30 results each.

**Purpose:** Answer one question — **what is risky to touch here**. Technical debt, known bugs, security holes, measured bottlenecks, scale limits, dependencies at risk, test-coverage gaps, and the named list of fragile areas.

**Boundary with `concerns.md`:** that file documents the **approach** to a concern — which caching strategy, which pagination, which lazy-loading. This file documents the **measured bottleneck** and the limit that approach runs into. A pagination strategy belongs there; "the margin query answers in 4.2 s at p95 above 50k rows" belongs here. Neither file repeats the other, and a finding that fits both is written once, here, with a pointer from there only if the approach itself is the risk.

**Extract from:**

- Debt and bug markers left in the code: `TODO`, `FIXME`, `HACK`, `XXX`, `@Deprecated`, skipped/disabled tests — **one capped search, a single alternation covering all six**, the hits are the candidates. One search per marker would spend the step's whole cap of 6 on this bullet and leave nothing for the ones below; the alternation is the form `SKILL.md` § Research Techniques already requires
- The issue tracker or `CHANGELOG` only if the repo carries one in-tree; never a remote lookup
- The dependency manifests — the same ones `stack.md` reads, **opened here too**: this step is in the same fan-out wave, so nothing reaches it already read. Versions pinned behind, unmaintained packages, advisories declared in-tree (`npm audit` output committed, lockfile advisories, `.snyk`)
- The coverage report or CI config — the same ones `testing.md` reads, **opened here too**, for the reason above. The excluded paths are the coverage gaps
- Benchmark scripts, load-test configs and APM dashboards — the **only** admissible source of a number
- Up to **8** files, chosen from the hits above. Never open a file to confirm a hint; the hit plus its path is the evidence

A category that its search or its file came back empty on is **omitted** from the output — same discipline as the omit-empty-sections rule above, and cheaper than proving an absence.

**The eight categories are not eight searches.** Four cover them, inside the cap of 6: the marker alternation, the in-tree `CHANGELOG`/issue export, the declared advisories, and the benchmark/load-test configs. Coverage gaps and dependency risk come from the files above, not from a search of their own, and `## Áreas frágeis` is derived from what the other seven already found. A category is never reported absent without having been probed — by a search or by the file that owns it.

Template and guidance for documenting known risk in `<CODEBASE_DIR>/risks.md`.

## Template

```markdown
---
analisado_em: 2026-09-14
commit: a1b2c3d
---

# Registro de risco

> ⚠️ **Armadilha** — `npm run migrate` é idempotente só na ida: repetir a última migração após um rollback parcial recria a coluna sem os dados, e o comando termina com sucesso (`migrations/0042_add_status.sql`, `package.json`).

## Débito técnico

- **[O que está em débito]** — `caminho/do/arquivo.ext`. [Por que é débito: o que a forma atual impede ou custa.] [Marcador que o registra, quando houver: `TODO` na linha 84, `@Deprecated`, issue em `CHANGELOG.md`.]

## Bugs conhecidos

- **[Sintoma observável]** — `caminho/do/arquivo.ext`. [Condição em que aparece.] [Onde está registrado: teste marcado como skip, comentário `FIXME`, entrada no changelog.]

## Falhas de segurança

- **[A falha, nomeada]** — `caminho/do/arquivo.ext`. [O que expõe.] [Evidência: advisory declarado no repo, dependência com CVE fixada, configuração permissiva no arquivo.]

## Gargalos medidos

Só entra o que tem número. Sem medição, a linha não existe.

- **[Operação]** — [número com unidade] [em que percentil ou carga], medido em `caminho/do/benchmark`. [Caminho do código responsável.]

## Limites de escala

Só entra o que tem número. Sem medição, a linha não existe.

- **[O que satura]** — [o limite, com unidade e a condição em que foi medido], medido em `caminho/da/medição`. [O que acontece ao passar dele.]

## Dependências em risco

- **[pacote@versão]** — `caminho/do/manifesto`. [O risco: sem manutenção desde [data declarada no manifesto/lockfile], advisory [id], major atrás da usada pelo resto do ecossistema.]

## Lacunas de cobertura de teste

- **[Caminho ou padrão sem cobertura]** — `caminho/do/config-de-cobertura`. [Como se sabe: exclusão declarada, threshold ausente, suíte que não roda no CI.]

## Áreas frágeis

Um caminho de arquivo por linha. Uma área descrita por módulo ou por camada não é um achado — é uma impressão.

- `caminho/do/arquivo.ext` — [o que torna este arquivo frágil, com o número que sustenta: linhas, complexidade, número de correções que o tocaram, ausência de teste.]
- `caminho/de/outro.ext` — [idem.]
```

## Good vs. bad

The failure mode of this file is the fragility asserted about a layer instead of a file, and the bottleneck named with an adjective instead of a measurement.

| Write this | Not this |
|------------|----------|
| `src/orchestrator/state-derivation.ts` — 1.240 linhas, complexidade 34 em `deriveState`; três dos últimos seis bugfixes tocaram este arquivo | A camada de orquestração é frágil |
| `src/reports/margin.ts` — a consulta de margem responde em 4,2 s no p95 acima de 50 mil linhas, medido em `scripts/bench-margem.ts` | A geração de relatório fica lenta com muito dado |
| `left-pad@0.3.0` (`package.json`) — sem release desde 2018 e duas majors atrás da usada pelo resto do ecossistema | Algumas dependências estão desatualizadas |

## Field Guidance

- **Cabeçalho — the trace of the pass**: the file opens with the two-field frontmatter shown in the block above, filled from the `analisado_em` and `commit` of the payload. Nothing is derived here: an absent `commit` means the pass has none, and the field is omitted rather than guessed. The rule itself — the two fields, the repo that is not a git work tree, the `adopted` file, and why the trace never decides freshness — is written once, in `architecture-reference.md`'s `## Field Guidance` and in `SKILL.md` Step 0.4. Do not restate it here.
- **Bloco de armadilha**: the first thing under the `#` title, above any section, in the form `> ⚠️ **Armadilha** — …`. **A pitfall is a documented command that fails silently** — it ends well, or looks like it ends well, and does not do what the reader assumes. It is not a surprising finding, not technical debt, and not the consequence of a change.
  - Rule 3 applied to the top of the file: no pitfall, no block — no empty header, and never "nenhuma armadilha encontrada" as filler.
  - **The boundary matters most here, because both live in this one file.** The body of this file is fragility and debt: what is risky to touch, what is known to be broken, where the coverage is missing. The block at the top is only the command that runs, succeeds, and does something other than what it says. The two coexist, and it is **never the same sentence in both** — a finding that earns the top block is named there and is not repeated below.
  - Where a finding goes when it is not a pitfall: it goes into the body's own section; the consequence of an edit goes to `## Guia de mudança`.
  - Stacking more than one, and the boundary with the bare `⚠` of the reference-docs reconciliation, are written once in `architecture-reference.md`'s `## Field Guidance`.
- **Path first, always.** Every item in every section carries a concrete file path. **An item with no path does not go in** — it is an impression, and an impression in a risk register is worse than a silence, because the reader acts on it. This is rule 2 applied at item level.
- **The item leaves; the section stays.** When one item of a section has no path and the others do, drop **that item** and keep the section. Rule 3 omits a section only once it is actually empty.
- **`## Gargalos medidos` and `## Limites de escala`**: **a performance or scale claim with no number does not go in.** No measurement, no claim — and when there is no number, **omit the line**: never a placeholder, and never the phrase "não medido". A real but unmeasured bottleneck leaves the file entirely; labelling it is not a weaker form of reporting it, it is reporting an adjective as a finding. A number is a measured value with its unit and where it was measured.
- **`## Áreas frágeis` names files, never layers.** One file path per line. "The persistence layer is fragile", "the legacy module is risky", "the frontend needs care" — none of those are findings. What makes the line useful is the file the reader is about to open, plus the number that makes the fragility checkable.
- **Say how you know.** Each item carries its evidence: the marker and its line, the declared advisory, the coverage exclusion, the benchmark script. An item nobody can re-verify is an item nobody can retire.
- **Never invent a command** to produce a number. The number comes from a benchmark, a load test or an APM dashboard that already exists in the repo. If none exists, the section is omitted — running one is not this pass's job.
- **The file is written even when nothing is found.** Rule 3 omits a **section**, never the file. A pass that searched all eight categories and found nothing writes `risks.md` with a single explicit line saying so — for example: `Esta passada procurou risco nas oito categorias e não encontrou achado com evidência. Isto é ausência de achado, não prova de ausência de risco.` Without that line the reader cannot tell "no risk here" from "nobody ever looked", which is the whole reason this file exists.
- **Over the ceiling: cut before writing.** Dimension what you established against the **word** figure of rule 6 — `1,500 tokens (~900 words)` — and reduce **before** writing the file. Measuring `wc -w` against the token number loosens this ceiling by ~67% and approves exactly the file the check exists to stop (`SKILL.md` § Size verification) — drop the weakest-evidence items first, never the path or the number of the ones that stay. A truncated file and an over-budget file are both failures; a shorter file of checkable findings is not.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| `TODO` / `FIXME` / `HACK` / `XXX` markers | Technical debt the team already named |
| `@Deprecated`, deprecation comments, legacy folders | Debt with a declared direction |
| Skipped, disabled or quarantined tests | Known bugs and coverage gaps at once |
| `CHANGELOG.md`, in-tree issue exports | Bugs the team recorded but did not fix |
| Lockfile advisories, committed audit output, `.snyk` | Dependencies at risk, with the advisory id |
| Coverage config exclusions, CI test steps | What is not covered, and what does not run |
| Benchmark scripts, load-test configs, APM dashboards | The only admissible source of a performance or scale number |
| File size and complexity output, `git log` touch counts | The number that turns "fragile" into a checkable claim |
