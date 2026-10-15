# Doninha — AI Coding Assistant Instructions

## Communication Style

At the start of each session, read `~/.doninha/config.yml` (Windows: `%USERPROFILE%\.doninha\config.yml`).

Check `agents.default.verbosity` and apply the rules from the `doninha-caveman` skill. If the file is missing or the value is unrecognized, default to `full`.

---

## Project Context

This project uses doninha — a CLI for setting up AI coding agents. Key conventions:

- `.doninha/` — shared project resources (templates, scripts, README)
- `DONINHA.md` — project-level AI instructions at root
