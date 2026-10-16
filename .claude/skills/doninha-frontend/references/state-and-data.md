# State and data

Principles only. The concrete state store, data-fetch client, and refresh mechanism come from the target project's `.doninha/docs/codebase/*` and real code. Use whatever the project already uses; never introduce a new library without a recorded project decision.

## Model finite states as unions

- Represent a finite lifecycle as an explicit union, e.g. `IDLE | LOADING | READY | ERROR`, not as a scatter of loose booleans (`isLoading`, `hasError`, `isReady`) that can drift into impossible combinations.
- Keep the state value and any accompanying error/message in one place so the view reads a single source.

## Every data-dependent view covers four states

Any view that depends on remote data must handle all of:

- **Loading** — a stable placeholder while data is in flight.
- **Recoverable error** — a message plus an explicit **retry** action; never a dead end.
- **Empty** — a clear empty state when the request succeeds but returns nothing.
- **Disabled** — controls disabled (visually and functionally) while an action is in flight or unavailable.

## The data layer lives outside components

- Fetchers and mutations belong in the data/api layer, not inside JSX and not inside presentational components.
- Presentational components receive already-fetched data and callbacks; they do not initiate requests.
- If the project has no real data layer yet (e.g. it still uses local/mock data), keep that data out of components (in the project's data location) and only introduce a real adapter when the project actually gains a data layer.

## Defensive handling of unstable payloads

- When a backend payload shape is known and stable, type the call directly.
- When the payload can vary or is untrusted, receive it as `unknown` and pass it through a **defensive normalizer** with **type guards** before use. Do not assume shape.
- Normalizers return a known shape (or a safe default) so the rest of the code never touches raw, unchecked data.

## Mutation flow

A mutation (create/update/delete/submit) follows this order:

1. **Validate** inputs first; if invalid, surface the typed error and stop before any call.
2. Enter a **submitting** state (disable the trigger, show progress).
3. Make the **typed** backend call.
4. On success, **update or refresh** the affected data.
5. On error, read the error message **defensively** (never assume the error shape) and surface a safe, translated fallback.
6. **Clear the submitting** state in a `finally` so it is always reset, success or failure.

Refresh through **explicit callbacks** the code owns (e.g. a `refresh`/`reload` function passed down), not through an implicit cache-invalidation of a specific named cache library. If the project uses such a library, follow the project's own convention for it — but do not adopt one that the project has not decided on.

## Derived state

Compute filtered lists, summaries, and derived labels once (memoize where the framework supports it) and pass them down, rather than recomputing inside render loops. Keep the pure derivation in the business-rules layer so it is testable.

## Local persistence

Use session/local persistence only when the real flow needs continuity. Namespace keys by domain (and tenant, when applicable). Wrap every read/write in try/catch so a restricted browser cannot break the app.

## Auth and permission — the backend is the authority

- The client may **hide, disable, or route around** UI based on the user's permissions/roles read from the project's account/auth state.
- The client is **never** the authority on authorization and must **never bypass a permission check**. The backend remains the source of truth; the UI only reflects it.
- Preserve any required tenant/account/permission parameters the endpoint expects — do not drop them.

## Never leave an empty catch

Every catch handles the error (surface it, log through the project's mechanism, or recover). No empty catch blocks; no sensitive payload dumped to the console.
