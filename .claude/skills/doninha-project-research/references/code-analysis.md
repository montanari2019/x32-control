# Code Analysis Tools

Use graceful degradation for code search and structural analysis.

## Tool Priority

1. **ast-grep** (`sg`) - Structural pattern-based search
2. **ripgrep** (`rg`) - Fast context-aware text search
3. **grep** - Standard text search (always available)

## Detection

Check tool availability before use:

```bash
# Check for ast-grep
if command -v sg >/dev/null 2>&1; then
  # Use ast-grep for structural search
elif command -v rg >/dev/null 2>&1; then
  # Fall back to ripgrep
else
  # Use standard grep as final fallback
fi
```

## Usage Examples

Every example is shown in its capped form. Copy the cap along with the command.

**Finding function definitions:**

```bash
sg -p 'function $NAME($$$) { $$$ }' -l | head -30
rg -l '^function\s+\w+\(' --type-add 'source:*.[extension]' -t source | head -30
grep -rl '^function ' --include="*.[extension]" | head -30
```

**Finding imports/requires — which SDK or package is actually used:**

```bash
sg -p 'import { $$$ } from "$MODULE"' -l | head -30
rg -l --max-count 1 -e '<pkg-a>' -e '<pkg-b>' -e '<pkg-c>' | head -30
grep -rl -e '<pkg-a>' -e '<pkg-b>' --include="*.[extension]" | head -30
```

One alternation covering every package you care about beats one search per package.

**Finding class/component definitions:**

```bash
sg -p 'class $NAME { $$$ }' -l | head -30
rg -l '^(class|export class)\s+\w+' --type-add 'source:*.[extension]' -t source | head -30
grep -rl '^class ' --include="*.[extension]" | head -30
```

## Search Scope — hard rules, not tips

These are not performance suggestions. They are the mechanism that keeps a research pass inside its context budget (see `SKILL.md` § Context budget). A search that ignores them can pull thousands of lines into the session on a large repository.

**Every search is capped at the wire, not by intention.** Flag or pipe each command so it *physically cannot* exceed its cap:

```bash
rg -l --max-count 1 '<pattern>' | head -30
grep -rl '<pattern>' --include='*.<ext>' | head -30
```

A search whose output would exceed its cap is a signal to narrow the pattern — never a reason to raise the cap.

**Fixed exclusions**, always: `node_modules`, `vendor`, `dist`, `build`, `target`, `bin`, `obj`, `coverage`, `.git`.

**Prefer `git ls-files` as the file set.** It already honours `.gitignore`, so build output and dependencies never enter the scan:

```bash
git -C <repo> ls-files | grep -E '<pattern>' | head -40
```

**Escalation ladder — stop at the cheapest rung that answers the question:**

1. The pass inventory (`SKILL.md` Step 0.5) — already has the directory shape, extensions and declared units.
2. A path listing (`git ls-files | grep … | head -N`) — answers "does this exist / where".
3. `rg -l` (names only) or `rg -m 3` (a few matches) — answers "is this the pattern in use".
4. A line range of a file (`sed -n '1,120p'`) — answers "how is this configured".
5. The whole file — last resort, and only when it is the sole carrier of the fact.

**Never read a file in full just to confirm a hint.** Never read a lock file (`package-lock.json`, `yarn.lock`, `poetry.lock`): confirm it exists, and grep one line if a version matters.

**Never re-walk the tree.** The directory tree is walked exactly once per pass, in Step 0.5. A worker needing a path the inventory does not carry may glob **once**, scoped to its own module or config family, and that glob counts against its search cap.

**Dominance, not completeness.** Almost every claim in the generated docs is about what is *predominant* ("kebab-case is the convention here"), which 30 hits settle. The one claim that needs completeness — the module list — comes from the inventory and the parent manifest, which are deterministic and bounded.

## Fallback Notice

If ast-grep unavailable, display once per session:

```
⚠️ ast-grep not detected. Install for more precise structural code analysis.
   https://ast-grep.github.io/guide/quick-start.html
```

## When to Use

- Finding usage patterns across codebase
- Identifying code structure and organization
- Locating function/class/component definitions
- Analyzing import/dependency patterns
- Refactoring impact analysis
- Code navigation in unfamiliar codebases
