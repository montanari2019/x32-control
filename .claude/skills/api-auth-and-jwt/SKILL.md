---
name: api-auth-and-jwt
description: Backend Template authentication with RS256 JWT, auth helper functions, authorization middleware, and the login/refresh/signUp controller pattern. Use when implementing auth endpoints, protecting routes, or working with the user session context.
---

# Backend Template - Auth & JWT

## Overview

Authentication is based on **RS256 asymmetric JWT**. The private key signs tokens; the public key verifies them. Both keys are injected via environment variables.

```
src/
├── config/auth.ts            # Key and expiration config
├── helpers/auth.ts           # generateAuthToken, validateAuthToken, extractTokenWithScheme
├── middlewares/authorization.ts  # Express middleware that populates request.user / request.ability
└── domains/users/
    ├── controllers.ts        # login, refresh, signUp endpoints
    └── users-rules.ts        # CASL rules for the authenticated user
```

---

## Configuration (`src/config/auth.ts`)

Required environment variables:
```
AUTH_PRIVATE_KEY          # RSA private key (PEM format, used to sign)
AUTH_PUBLIC_KEY           # RSA public key (PEM format, used to verify)
AUTH_TOKEN_EXPIRES_IN_DAYS  # e.g. 7
```

Generate a key pair with:
```bash
node bin/generate-key-pair.js
```

---

## Auth Helpers (`src/helpers/auth.ts`)

### `generateAuthToken(payload)`
Signs a JWT payload with RS256. Throws `ForbiddenError` on signing failure.
```ts
import { generateAuthToken, extractUserPayloadAttributes } from '~/helpers/auth';

const payload = extractUserPayloadAttributes(user);
// payload: { id, name, email, role, photo }

const token = generateAuthToken(payload);
```

### `validateAuthToken(token)`
Verifies and decodes a JWT. Throws `UnauthorizedError(30)` if token is absent, `ForbiddenError` if invalid/expired.
```ts
import { validateAuthToken } from '~/helpers/auth';

const decoded = validateAuthToken(token); // returns IJWTUserPayload
```

### `extractTokenWithScheme(scheme, authorization)`
Parses the `Authorization` header. Returns the token string or `null`.
```ts
import { extractTokenWithScheme } from '~/helpers/auth';

const token = extractTokenWithScheme('Bearer', request.headers.authorization);
// e.g. authorization = 'Bearer eyJ...' → returns 'eyJ...'
```

---

## Private Routes

In any route file, the `public` property controls whether the route is protected by the `authorizationMiddleware`:
```ts
{
    method: 'post',
    path: '/login',
    public: true, // no auth required, default is false
    handlers: [controllers.login],
}
```
By passing `public: false` or omitting it, the `authorizationMiddleware` will run, enforcing authentication and populating `request.user` and `request.ability`.

The middleware:
1. Extracts the `Bearer` token from `Authorization` header
2. Validates the JWT and decodes the user ID
3. Loads the active, non-deleted user from the database (using `getLoginModifier`)
4. Creates a CASL `ability` for the user
5. Throws `UnauthorizedError(31)` if the user is not found or token is missing

### `generateAuthorizationData(token)` — reusable helper
Used internally and by the GraphQL factory. Can be called directly when you need user + ability outside of the middleware chain:
```ts
import { generateAuthorizationData } from '~/middlewares/authorization';

const { user, ability } = await generateAuthorizationData(token);
```

### Guest context
When `token` is `null`, a guest user is created:
```ts
{ name: 'Guest', role: 'GUEST' }
```
This allows unauthenticated routes to still use CASL checks.

---

## Login, Refresh & SignUp Pattern

### `login` — `POST /users/login`
```ts
async function login(request, response, next) {
    const userSelected = await User.query()
        .modify('getLoginModifier')
        .findOne({ email: body.email, active: true, deleted_at: null });

    if (!userSelected?.isPasswordCorrect(body.password)) {
        throw new UnauthorizedError(200);
    }

    const payload = extractUserPayloadAttributes(userSelected);
    const token = generateAuthToken(payload);
    const rules = createUserRules(userSelected); // CASL rules for frontend

    response.status(200).json({ token, user: userSelected, rules });
}
```

### `refresh` — `GET /users/refresh` (requires auth middleware)
```ts
async function refresh(request, response, next) {
    const payload = extractUserPayloadAttributes(request.user);
    const token = generateAuthToken(payload);
    const rules = createUserRules(request.user);

    response.json({ token, user: request.user, rules });
}
```

### Using `request.user` and `request.ability` in controllers
After the auth middleware runs, these are always available:
```ts
async function getMe(request, response, next) {
    const { user, ability } = request;

    // Check permission (CASL)
    ability.throwUnlessCan('read', user);

    response.json(user);
}
```

---

## JWT Payload shape (`App.Auth.IJWTUserPayload`)

```ts
interface IJWTUserPayload {
    id: number;
    name: string;
    email: string;
    role: string;
    photo?: number; // photo_id
}
```

---

## TypeScript — extending Express Request

`request.user` and `request.ability` are typed via `src/@types/`:
```ts
declare namespace Express {
    interface Request {
        user: User;
        ability: AppAbility;
    }
}
```

---

## Security notes

- Keys must be stored as env vars, never committed to source control.
- Tokens expire according to `AUTH_TOKEN_EXPIRES_IN_DAYS`.
- The `getLoginModifier` on the User model must include `passwordHash` and exclude it from the default serialization for security.
- Always check `active: true` and `whereNull('deleted_at')` when loading users from auth context.
