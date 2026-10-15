# Forbidden patterns

Generalized anti-patterns. None of these are stack-specific; they hold whatever the project's framework or styling system is. Read this before copying any existing code, and prefer the project's predominant modern pattern over its legacy layers.

## Data and layering

- **No data/API calls inside JSX or inside presentational components.** The data layer lives outside components (see [state-and-data.md](state-and-data.md)).
- **No inline mock/sample data inside a component.** Keep any local/mock data in the project's data location, never embedded in render code.
- **No stray, ad-hoc fetch calls** when the project has a configured data/HTTP layer — go through the project's layer.

## Typing

- **No** `any`, `Function`, boxed primitive wrappers, `Object`, or wide casts, and no public DTO without a real type. Use precise types, unions, generics, and `unknown` with narrowing.

## Hygiene

- **No empty catch blocks.** Every catch handles or surfaces the error.
- **No stray `console.log` or `debugger`** left in the code, and no sensitive payload dumped to logs.

## Reuse and structure

- **Do not duplicate existing base components** (buttons, cards, badges, tables, toolbars, modals, pagination, and the like) — compose with them.
- **Do not create a global provider or store for state that is local** to a single screen. Use the project's existing providers only for genuinely shared concerns.
- **Do not add an undecided library.** Do not introduce a new framework, state store, form library, styling utility, data-fetching library, or component library without a **recorded project decision** (in `DONINHA.md` or the codebase docs). Use what the project already uses.
- **Do not spawn a parallel styling helper or one-off palette** alongside the project's tokens/helper (see [components-and-forms.md](components-and-forms.md)).
- Do not leave user-facing text hardcoded when the project has an i18n mechanism — route it through that mechanism and update all its locales.

## Routing, auth, and permissions

- **Do not change a route or permission without tracking its ripple:** update the corresponding menu entries, links, and permission checks together.
- **Do not bypass a permission check on the client.** The backend is the authority; the UI only hides/disables/routes (see [state-and-data.md](state-and-data.md)).
- Do not drop required tenant/account/permission parameters an endpoint expects.

## Never invent a flow from a prototype (SKL-08 anchor)

- **Never create a modal, drawer, wizard, route, screen, or any new flow solely because it appears in a prototype, mockup, screenshot, or print.** A visual artifact is a **visual reference only** — it never authorizes a new flow by itself.
- A new flow is created **only** when the explicit contract requires it: the PBI's `DESIGN.md`/`EXPERIENCE.md`, or its `spec.md`/`design.md`/`tasks.md`, or the real current flow.
- When a visual artifact conflicts with the contract (or spec/design), **follow the contract and record the divergence** — do not silently implement the visual.
