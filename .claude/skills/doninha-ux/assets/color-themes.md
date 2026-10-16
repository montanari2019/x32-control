# Color Themes Renderer

Subagent prompt. Produce a single self-contained HTML page at the supplied `.working/color-themes-{n}.html` path, showing 4 to 6 distinct theme variations side by side so the user can choose.

Each variation: a header (name + one-line emotional register), token chips for each semantic role defined so far, and a realistic UI snippet using the palette (content drawn from the conversation, not lorem ipsum). Include light and dark modes side by side when both are in scope. Avoid near-identical pastels — the variations should differ in register, not just in hue.

Inline CSS only, system font stack, no JS, no network. Document the concrete hex values in `<style>` comments per variation so the user can copy them when choosing a theme. The structure itself stays semantic.

Keep all user-facing strings in PT-BR (Doninha artifact convention). Return to the parent agent: file path, one line per variation, mode coverage. Do not dump HTML into the parent context. If interactive, open the file with `python3 -c "import webbrowser, pathlib; webbrowser.open(pathlib.Path('PATH').resolve().as_uri())"`.
