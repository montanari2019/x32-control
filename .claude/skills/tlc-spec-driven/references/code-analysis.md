# Code Analysis

Use available repository tools with graceful degradation.

Order:

1. `rg --files` to list files.
2. `rg` to find symbols, routes, tests, strings, and patterns.
3. Read targeted files.
4. Inspect package scripts and config.
5. Run focused tests or typecheck when needed.

Prefer code facts over assumptions. If external documentation is needed, use official docs first.
