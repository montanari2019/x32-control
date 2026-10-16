# Excalidraw Wireframe Renderer

Subagent prompt. Produce an `.excalidraw` file at `.working/ia-{date}.excalidraw` (IA diagram) or `.working/flow-{name}-{date}.excalidraw` (flow wireframe).

## CRITICAL: `index` fields with exactly two characters

Each element's `index` field must be **exactly two characters** (`a0`, `aZ`, `b3`, ...). Three-character indices cause a silent *"Error: invalid file"* with no diagnostic output. Assign sequentially across all elements; advance the leading letter when the trailing alphanumeric runs out (`a0..a9, aA..aZ`, then `b0..`). Verify before writing.

## Structure

Valid Excalidraw file: `{type: "excalidraw", version: 2, source: "https://excalidraw.com", elements: [...], appState: {gridSize: null, viewBackgroundColor: "#ffffff"}, files: {}}`. Each element needs the standard Excalidraw fields (`id, type, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, groupIds, frameId, roundness, seed, version, versionNonce, isDeleted, boundElements, updated, link, locked, index`). Text elements add `text, fontSize, fontFamily, textAlign, verticalAlign, baseline, containerId, originalText, lineHeight`.

## Content

**IA diagram:** boxes and arrows representing the authentication stack, the app's main surfaces, modal routes, the settings stack, and cross-cutting affordances. Use color sparingly to distinguish categories. Lay out for human readability, not graph correctness.

**Flow wireframe:** screen rectangles in left-to-right sequence, simple internal shapes (nav bar, CTA, content blocks) at low fidelity. Arrows labeled with the user action that triggers the transition. Side annotations noting climax moments and edge cases.

Keep all user-facing text in PT-BR (Doninha artifact convention). Return to the parent agent: file path, type, one-line subject, element count, and confirmation that all indices are two characters. Do not dump the JSON into the parent context. Direct the user to open the file in Excalidraw desktop or at excalidraw.com.
