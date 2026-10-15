---
name: api-errors-and-permissions
description: Backend Template error handling with HTTP error classes, permission rules with CASL, and security practices. Use when implementing error handling, permissions, or input validation.
---

# Backend Template - Errors & Permissions

## Error Handling

- Create an `errors.ts` file in your entity folder to manage error codes and messages.
- The error codes should be unique across the project and follow the existing pattern.
- The error handler is in `src/middlewares/errors.ts`. Create error codes consistent with existing ones.
- Use the callback pattern for error handling in controllers.

- Example — Error Codes in `domains/<entity>/errors.ts`
```ts
export default {
    200: 'Credenciais inválidas.',
    201: 'O endereço de e-mail informado já está cadastrado.',
    202: 'O avatar informado não pode ser encontrado.',
};
```

### Available HTTP Error Classes (`src/errors/http/`)

- `bad-request-error.ts`
- `forbidden-error.ts`
- `http-error.ts`
- `not-found-error.ts`
- `precondition-failed-error.ts`
- `unauthorized-error.ts`
- `unprocessable-entity-error.ts`

### Example — Throwing an Error

```ts
import PreconditionFailedError from '~/errors/http/precondition-failed-error';

// Inside your controller function
if (!isValid) {
  throw new PreconditionFailedError(201);
}
```

## Permissions

- Permissions are set in `src/domains/users/users-rules.ts`. Define rules based on user role.
- **CRITICAL**: If your controller has a customized query not using `createCrud`, you must apply permission rules manually:

```ts
const { ability } = request;
ForbiddenError.from(ability!).throwUnlessCan('create', 'Products');
```

### Example — Role-Based Rules

```ts
function getUserRules(user: User): App.Permission.AbilityRule[] {
  if (isAdmin(user)) {
    return [
      {
        action: ['manage'],
        subject: 'all',
      },
    ];
  }

  if (isManager(user)) {
    return [
      {
        action: ['read', 'update'],
        subject: Orders.name,
        conditions: {
          user_id: user.id,
        },
      },
    ];
  }

  // default regular user rules
  return [
    {
      action: ['read'],
      subject: Orders.name,
      conditions: {
        user_id: user.id,
      },
    },
  ];
}
```