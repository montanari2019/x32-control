---
name: doninha-commit
description: >
  Stages an explicit list of files, writes a commit message that matches the repository's
  own conventions, commits, and pushes. Use whenever the user asks to commit, to commit and
  push, to "subir as alterações", to "fazer commit", or when the Doninha CLI's "Fazer commit"
  button invokes it with a file list. Built for non-technical users: it never asks them to
  choose git flags, and it reports the result in plain language.
---

# Commit and push a reviewed selection

You are committing work on behalf of someone who may not use git directly — a business
analyst who watched the agent edit files and decided the result is good. Two consequences
shape everything below:

- **The file list you receive is a contract.** The person deliberately chose those files.
  Never widen the selection.
- **The report at the end is the only thing they will read.** Write it in Portuguese, in
  plain language, with no git jargon left unexplained.

## Input

The invocation carries:

- **`Arquivos a commitar:`** — a bullet list of repository-relative paths. This is the
  selection. It is always present.
- **`Instruções do usuário:`** — free-form text about how the commit should be made. This is
  **optional** and frequently absent. Its absence is normal and must not be questioned.

If the file list is missing or empty, stop and say so — do not fall back to committing
everything.

## Steps

### 1. Learn the repository's commit convention

```bash
git log -n 10 --oneline
```

Read the style off these messages: language, whether a `type(scope):` prefix is used, whether
a ticket or milestone id is included, typical length. **Do not assume Conventional Commits**
— use what this repository actually does. If the history is empty or gives no clear signal,
write a short imperative summary line and say in the final report which convention you used
and why.

### 2. Confirm the selection still matches reality

```bash
git status --porcelain
```

Any selected path that no longer appears as changed should be reported and skipped, not
silently dropped. If **none** of the selected paths are still changed, stop: there is
nothing to commit.

### 3. Stage exactly what was selected

```bash
git add -- <path1> <path2> ...
```

**Never use `git add -A`, `git add .`, or `git add -u`.** The person may have deliberately
left files out — staging them anyway commits work they chose not to ship, and that is the
one failure this skill exists to prevent. Always use `--` before the paths so a filename
that starts with a dash is not read as a flag.

### 4. Read what you are about to commit

```bash
git diff --cached --stat
git diff --cached
```

The message must describe **what is staged**, not what you remember doing earlier in the
session.

### 5. Guard the main branch

```bash
git rev-parse --abbrev-ref HEAD
```

If the branch is `main` or `master`, **ask the user to confirm before pushing.** Pushing to
the main branch reaches the whole team and is not undone by a local command. Say plainly
which branch it is and ask whether to continue. On any other branch, ask nothing.

If `HEAD` is detached, stop: there is no branch to push, and creating one is a decision the
person should make.

### 6. Commit

Write the message in the convention learned in step 1, honouring the user's instructions when
they gave any. Their instructions win over the repository convention when the two conflict —
they were explicit, the convention was inferred.

```bash
git commit -m "<subject>" -m "<body, when the change needs one>"
```

Body only when it earns its place: a one-file typo fix does not need one.

### 7. Push

```bash
git push
```

If the branch has no upstream, git says so — then:

```bash
git push -u origin <branch>
```

### 8. Report, in Portuguese

Cover four things, briefly:

- which files went in (by name, not by count alone)
- the commit message you used
- the branch, and where it was pushed
- anything skipped, and why

## Failures — report, do not resolve

Each of these ends the run with a clear explanation and a suggested next step. **None of
them is worked around automatically** — resolving them is outside this skill's scope, and
guessing here damages the repository.

| Situation | What to say |
| --- | --- |
| Nothing staged after step 3 | The selected files have no changes left; nothing was committed. |
| Push rejected (`non-fast-forward`) | Someone pushed first. The commit **is** saved locally; the push needs a `git pull` that has to be reviewed by someone technical. |
| A commit hook failed | Show the hook's own message. The commit did not happen. |
| Merge conflict markers in a staged file | Name the file. Committing a conflict would ship broken code. |
| Detached `HEAD` | There is no branch to push to. |
| Not a git repository | Nothing to do here. |

Never use `--no-verify`, `--force`, or `--force-with-lease`. If a guard blocks the commit,
the guard is the answer.
