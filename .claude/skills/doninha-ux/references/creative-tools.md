# Creative Tools

`{workflow.creative_tools}` is a registry of collaborative renderers invoked on demand when visualizing options helps the user decide. Entries follow the standard prefix convention: `skill:NAME`, `file:PATH`, `tool:MCP_TOOL_NAME: <directive>`, or a plain-text directive.

The defaults are self-contained HTML color themes, HTML design directions, Excalidraw wireframes (Discovery), and 1:1 HTML key-screen mocks (Finalize) — none depend on an external MCP. Teams can add more via an override TOML — a design-tool MCP, custom skills, prompt-based mood boards.

## When to invoke

Decision moments where a visualization beats more conversation: choosing color tokens, choosing a visual personality among directions, sketching the information architecture, mocking a complex flow. Fast-path users usually skip; coaching-path users usually go deeper. Read the context. Creative tools are OFF by default in headless mode (see `references/headless.md`).

## Artifact handling

Each renderer writes to `{doc_workspace}/.working/` with a descriptive filename. `.working/` is the audit trail and survives the run. At Finalize, the facilitator walks `.working/` with the user and promotes artifacts with lasting reference value to `{doc_workspace}/mockups/` (HTML that anchors a brand or layout decision) or `{doc_workspace}/wireframes/` (Excalidraw a developer would consult). Promotion criterion: *would a future reader of `DESIGN.md` or `EXPERIENCE.md` open this file?* The default is to leave it in `.working/`.

## Renderer contract

The parent agent passes the subagent: the current `.decision-log.md`, relevant prior captures from `.working/`, the user's stated intent for this pass, and the output path. The subagent writes its artifact to `.working/` and returns ONLY a compact summary (file path, one line per variant, mode coverage). The parent agent never retains the full payload.

For HTML, open in the browser when interactive: `python3 -c "import webbrowser, pathlib; webbrowser.open(pathlib.Path('PATH').resolve().as_uri())"`. Skip in headless mode.
