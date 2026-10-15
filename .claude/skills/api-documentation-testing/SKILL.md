---
name: api-documentation-testing
description: Backend Template testing patterns with Jest, including unit and integration tests for controllers, validators, and models. Also covers API documentation with Swagger/OpenAPI specifications. Use when writing tests or documenting API endpoints.
---

# Backend Template - Testing

## Testing Patterns

- Write unit and integration tests using the **Jest** testing framework.
- For unit tests, create a `__tests__` folder inside the entity folder and create test files for controllers, validators, and models.
- Write tests that cover at least 80% coverage.
- Write tests for controllers, validators, models, and services.

## Documentation

- Create a `swagger.ts` file in the entity folder to document API endpoints using Swagger/OpenAPI specifications.
```ts
import { OpenAPIV3 } from 'openapi-types';

const stateObjectSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {  
        id: {
            type: 'integer',
        },
        ibge_code: {
            type: 'string',
        },
        abbreviation: {
            type: 'string',
        },
        name: {
            type: 'string',
        },
        ddd: {
            type: 'string',
        },
        time_zone: {
            type: 'string',
        },
    },
};

const update: App.Router.SwaggerRouteObject = {
    summary: 'Atualização de estados.',
    responses: {
        200: {
            description: 'Operação realizada com sucesso.',
            content: {
                'application/json': {
                    schema: stateObjectSchema,
                },
            },
        },
    },
};

const get: App.Router.SwaggerRouteObject = {
    summary: 'Visualização de estados.',
    responses: {
        200: {
            description: 'Operação realizada com sucesso.',
            content: {
                'application/json': {
                    schema: stateObjectSchema,
                },
            },
        },
    },
};

const list: App.Router.SwaggerRouteObject = {
    summary: 'Listagem de estados.',
    responses: {
        200: {
            description: 'Operação realizada com sucesso.',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            metadata: {
                                type: 'object',
                                properties: {
                                    total: { type: 'integer' },
                                    pages: { type: 'integer' },
                                    page: { type: 'integer' },
                                    limit: { type: 'integer' },
                                    length: { type: 'integer' },
                                },
                            },
                            result: {
                                type: 'array',
                                items: stateObjectSchema,
                            },
                        },
                    },
                },
            },
        },
    },
};

export default {
    update,
    get,
    list,
};
```

- **CRITICAL**: set the swagger in the route definition to link it to the controller:
```ts
const routes: App.Router.Route[] = [
    {
        method: 'put',
        path: '/states/:stateId',
        validationBody: validators.update,
        validationParams: validators.stateIdparam,
        handlers: [
            controllers.update!,
        ],
        swagger: swagger.update,
    },
];
```