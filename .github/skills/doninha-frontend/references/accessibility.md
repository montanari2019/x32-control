# Accessibility

The accessibility floor every UI change must meet. These are baseline obligations, independent of framework. Where the project's own conventions or its EXPERIENCE.md contract raise the bar, follow the higher bar.

## Semantics

- Use semantic elements for their meaning: a real button for an action, a real form control with a label, headings/sections/lists/tables for their structures.
- **Never** wire an interactive control as a non-interactive element with a click handler (e.g. a clickable generic container instead of a real button). An interactive control must be a real, focusable, keyboard-operable element.
- Every input has either a visible label or a clear accessible name (title/aria-label).
- Meaningful images have alternative text; a decorative icon that stands in for information must keep the information available as nearby visible text.

## Keyboard and focus

- Custom modals/dialogs declare `role="dialog"` and `aria-modal="true"`, expose an accessible name (e.g. `aria-labelledby`), and support **Escape** to close and **outside-click** to dismiss when the pattern calls for it.
- Icon-only buttons need both a `title` and an `aria-label`.
- Keep a **visible focus indicator**. If a default outline is removed, replace it with an equivalent visible focus style — never remove focus visibility outright.
- Interactive elements are reachable and operable by keyboard in a sensible order.

## Composite widgets

- Tabs use the tab roles (`role="tablist"` / `role="tab"`) with selected state (`aria-selected`).
- Menus/dropdowns opened by a control close on outside click and are keyboard-dismissible.
- Badges and counters **do not replace text** — always keep a textual label alongside a count or status indicator.

## Test-ids — semantic, and NOT a substitute for a11y

- Put a **semantic, kebab-case `data-testid`** on every interactive element that is added or changed (e.g. `user-search-input`, `order-history-download-<id>`). Keep ids meaningful and domain-oriented, and use a stable key plus a domain identifier for list items.
- **State explicitly:** a `data-testid` is for test targeting only. It does **NOT** substitute for `aria-label`, `title`, `alt`, roles, labels, or focus management. An element needs its real a11y attributes regardless of any test-id.
