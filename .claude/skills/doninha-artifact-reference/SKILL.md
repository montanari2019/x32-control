---
name: doninha-artifact-reference
description: Register, consult, and maintain visual references for a feature. Allows all agents to share visual context through images, HTML prototypes, Figma links, and external URLs. References are feature-scoped and shared across all PBIs.
---

# Goal

Provide a single, feature-level location for all UX/UI references. Any agent can:

- Discover existing references before producing artifacts.
- Understand purpose and screen/state coverage.
- Retrieve the original file or URL.

---

# Directory Structure

```text
.doninha/
└── docs/
    └── {module}/
        └── {feature}/
            ├── references/
            │   ├── references.md
            │   └── assets/
            │       ├── login-screen.png
            │       ├── checkout-flow.html
            │       └── dashboard.figma.url
            ├── structure.md
            └── pbis/
                ├── pbi-slug-1/
                └── pbi-slug-2/
```

---

# Reference Index

File: `{feature_dir}/references/references.md`

```markdown
# References

| ID      | Title         | Type       | File / URL            | Coverage             |
| ------- | ------------- | ---------- | --------------------- | -------------------- |
| REF-001 | Login Screen  | png        | login-screen.png      | Login Page           |
| REF-002 | Checkout Flow | html       | checkout-flow.html    | Checkout Page        |
| REF-003 | Design System | figma-link | https://figma.com/... | Global Design System |
```

# Supported Types

| Type       | Description         |
| ---------- | ------------------- |
| png        | Screenshot          |
| jpg        | Screenshot          |
| jpeg       | Screenshot          |
| html       | Navigable prototype |
| figma-link | Figma link          |
| url        | External reference  |

---

# Operations

## Register reference

When an agent identifies a new visual reference at any stage:

1. Create `{feature_dir}/references/assets/` if it does not exist.
2. **Copy** the source file into `{feature_dir}/references/assets/{filename}` (local files only — PNG, HTML, etc.). Use the file's original name. URLs and Figma links are NOT copied; use the URL directly in the `File / URL` column.
3. Add a row to `{feature_dir}/references/references.md`:
   - Local files: `File / URL` = `assets/{filename}` (relative path, never the original source path).
   - URLs / Figma links: `File / URL` = the full URL.
4. Never duplicate a reference already in the index.

**The calling skill (doninha-analisar, doninha-desenvolver) is responsible for steps 1–3 before handing off to `doninha-copy-writer`.** The copy-writer only formats and persists `references.md` — it does not copy files.

---

## Consult references

Before producing any artifact (structure, technical, spec, plan, task, review), read:

```text
{feature_dir}/references/references.md
```

---

## Link reference to a PBI

Add to the PBI artifact:

```markdown
## References

- REF-001 — [Login Screen](../../references/references.md#ref-001)
- REF-002 — [Checkout Flow](../../references/references.md#ref-002)
```

---

# Rules

- References are feature-scoped — one `references/references.md` per feature, shared by all PBIs.
- Never duplicate an already-registered reference.
- Always update the index after adding a new reference.
- Never move referenced files without updating the index.
