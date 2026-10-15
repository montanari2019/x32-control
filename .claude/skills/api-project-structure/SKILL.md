---
name: api-project-structure
description: Backend Template project structure, domain organization, services, utils, and environment setup. Use when creating new domains, understanding project layout, or scaffolding backend features.
---

# Backend Template - Project Structure

## Domain-Based Architecture

The project follows a **domain-based architecture** where each entity has its own folder inside `src/domains/`, alongside shared services, utilities, and infrastructure:

```
src/
├── domains/           # Domain modules (entity-specific controllers, models, routes, validators)
│   └── <entity>/
│       ├── controllers.ts
│       ├── validators.ts
│       ├── model.ts
│       ├── routes.ts
│       ├── errors.ts
│       └── swagger.ts
├── errors/            # HTTP error classes (bad-request, forbidden, not-found, etc.)
├── helpers/           # Helper functions (crud.ts, etc.)
├── middlewares/       # Express middlewares (errors, auth, etc.)
├── models.ts          # BaseModel for ORM
├── routes.ts          # Factory route that auto-imports domain routes
├── services/          # External services (email, etc.)
├── utils/             # Shared utility functions
database/
└── migrations/        # Knex.js database migrations
```

## Creating a New Entity

When creating a new entity (e.g., `products`), create these files:
- `src/domains/products/controllers.ts`
- `src/domains/products/validators.ts`
- `src/domains/products/model.ts`
- `src/domains/products/routes.ts`
- `src/domains/products/errors.ts`
- `src/domains/products/swagger.ts`

Follow the pattern in `src/domains/users` as reference.

## Routes

- The factory route in `src/routes.ts` auto-imports all routes from `src/domains` that have a `routes.ts` file. Export your router from your entity's `routes.ts`.
- Use the `public` prop in your route file to define if routes are public or private.

## Services (`src/services/`)

For external services like API calls or libraries used in multiple places, create a service in `src/services/` to encapsulate the logic.

### Email Handling (`src/services/email.ts`)

Use the functions in `src/services/email.ts` to send emails. If you need a specific email, create a new function in that file:

```ts
export async function sendEmailPasswordReset(user: User, token: string) {
  try {
    const [firstName] = user.name.split(' ');
    const props = { firstName, token };
    const content = reactRenderToHtml(EmailPasswordReset, props);
    await noreplySender({
      html: content,
      subject: 'Redefinição de senha',
      to: user.email,
    });
  } catch (error) {
    console.warn(error);
  }
}
```

## Utils (`src/utils/`)

For utility functions used in multiple places, create them in `src/utils/` to encapsulate shared logic.
