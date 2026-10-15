---
name: api-validation
description: Backend Template request validation using Joi with custom extensions (databaseId, cpf, cnpj), createValidationSchema helper, and the validateBody/validateQuery/validateParams middleware pattern. Use when creating validators for request bodies, query strings, or URL parameters.
---

# Backend Template - Validation

## Overview

All input validation is done with **Joi** via the extended factory in `src/factories/joi.ts`. Validators are defined per domain in `validators.ts` and applied as Express middleware using the functions in `src/middlewares/validations.ts`.

```
src/
├── factories/joi.ts          # Extended Joi with custom types
├── config/joi.ts             # Default Joi options
├── helpers/validation.ts     # createValidationSchema + checkAndReturnValidationResult
├── middlewares/validations.ts # validateBody / validateQuery / validateParams
└── domains/<entity>/
    └── validators.ts         # Domain-specific Joi schemas
```

---

## Always import Joi from the factory

```ts
// ✅ Correct — uses custom extensions
import Joi from '~/factories/joi';

// ❌ Wrong — misses databaseId, cpf, cnpj, etc.
import Joi from 'joi';
```

---

## Custom Joi types (`src/factories/joi.ts`)

### `Joi.databaseId()`
Integer ≥ 1, used for all entity IDs:
```ts
const schema = Joi.object({
    userId: Joi.databaseId().required(),
});
```

### `Joi.pessoa().cpf()`
Validates Brazilian CPF format:
```ts
const schema = Joi.object({
    cpf: Joi.pessoa().cpf().required(),
});
```

### `Joi.pessoa().cnpj()`
Validates Brazilian CNPJ format:
```ts
const schema = Joi.object({
    cnpj: Joi.pessoa().cnpj().required(),
});
```

### `Joi.customValidate().json()`
For JSON string fields that require parse validation.

### `Joi.request().orders()`
For sort/order query parameters (validates order tuples).

---

## `createValidationSchema` helper (`src/helpers/validation.ts`)

Builds a schema object from a flat map and marks specific keys as required:

```ts
import { createValidationSchema } from '~/helpers/validation';

const fieldSchema = {
    name:  Joi.string().trim().min(3).max(100),
    email: Joi.string().trim().email().max(200),
    role:  Joi.string().valid('ADMIN', 'USER'),
};

// Create + mark required fields
const createSchema = Joi.object(
    createValidationSchema(fieldSchema, ['name', 'email', 'role'])
);

// Update — all optional
const updateSchema = Joi.object(
    createValidationSchema(fieldSchema)
);
```

---

## Defining validators in a domain

**`src/domains/<entity>/validators.ts`**
```ts
import Joi from '~/factories/joi';
import { createValidationSchema } from '~/helpers/validation';

// Reusable field definitions
const entitySchema = {
    name:        Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().max(500).allow(null, ''),
    category_id: Joi.databaseId().allow(null),
    active:      Joi.boolean(),
};

// Create — required fields declared here
const createEntitySchema = Joi.object(
    createValidationSchema(entitySchema, ['name'])
);

// Update — all optional
const updateEntitySchema = Joi.object(
    createValidationSchema(entitySchema)
);

// ID param
const entityIdParamSchema = Joi.object({
    entityId: Joi.databaseId().required(),
});

export default {
    createEntitySchema,
    updateEntitySchema,
    entityIdParamSchema,
};
```

---

## Applying validation in routes

```ts
import { validateBody, validateQuery, validateParams } from '~/middlewares/validations';
import validators from './validators';

export default [
    {
        method: 'post',
        path: '/entities',
        handlers: [
            authMiddleware,
            controllers.create,
        ],
        validationBody: validators.createEntitySchema,
    },
    {
        method: 'put',
        path: '/entities/:entityId',
        handlers: [
            authMiddleware,
            controllers.update,
        ],
        validationBody: validators.updateEntitySchema,
        validationParams: validators.entityIdParamSchema,
    },
] as Array<App.Router.Route>;
```

## Default Joi config (`src/config/joi.ts`)

```ts
{
    abortEarly: false,   // collect ALL errors, not just the first
    allowUnknown: true,  // accept extra fields without error
    stripUnknown: false, // validateBody overrides this to true
}
```

---

## Common Joi patterns used in the template

```ts
// Trimmed string with length limits
Joi.string().trim().min(3).max(100)

// Email
Joi.string().trim().email().max(200)

// Password with confirmation
password: Joi.string().trim().min(6).max(200),
repeat_password: Joi.when(Joi.ref('password'), {
    is: Joi.exist(),
    then: Joi.equal(Joi.ref('password')),
}),

// Enum from model
Joi.string().valid(...Object.values(MyEnum))

// Nullable foreign key
Joi.databaseId().allow(null)

// Boolean
Joi.boolean()

// Optional string with null allowed
Joi.string().allow(null, '')
```
