---
name: api-crud-operations
description: Backend Template CRUD operations using createCrud helper, including create, update, remove, get, and find with callbacks and filtering. Use when implementing entity CRUD controllers.
---

# Backend Template - CRUD Operations

## Entities CRUD

- Follow the pattern in `src/domains/users` for creating new entities and their CRUD operations.
- **Do not** create services; prefer to put the logic in controllers.
- **ONLY** create functions outside `createCrud` if they have very specific logic that cannot be handled by `createCrud` callbacks.
- For CRUD operations, use the `createCrud` method from `src/helpers/crud.ts`.

## `createCrud` Method

The `createCrud` method simplifies the creation of CRUD operations. It takes an object with:

### `model`
The import of the model class for the entity.

### `create`
- `fields`: Array of strings — fields required to create a new entity.
- `beforeCreateCallback(request, values, transacting)`: Runs before creating.
- `afterCreateCallback(request, record, transacting)`: Runs after creating.
- `formatValues(request, values)`: Formats values before creating.
- `thenCallback(request, record)`: Runs after creation and formatting.
- `catchCallback(error)`: Runs on error.

### `update`
- `fields`: Array of strings — fields that can be updated.
- `primaryKey`: String — primary key of the entity.
- `paramName`: String — route parameter name containing the primary key.
- `beforeUpdateCallback(request, record, values, transacting)`: Runs before updating.
- `afterUpdateCallback(request, record, transacting)`: Runs after updating.
- `formatValues(request, record, values)`: Formats values before updating.
- `thenCallback(request, record)`: Runs after update and formatting.
- `catchCallback(error)`: Runs on error.

### `remove`
- `paramName`: String — route parameter name containing the primary key.
- `softDelete`: Object with `columnName` for soft delete column. If omitted, hard deletes.
- `beforeRemoveCallback(request, record, transacting)`: Runs before removing.
- `afterRemoveCallback(request, record, transacting)`: Runs after removing.
- `catchCallback(error)`: Runs on error.

### `get`
- `primaryKey`: String — primary key of the entity.
- `paramName`: String — route parameter name containing the primary key.
- `beforeGetCallback(request, QueryBuilder)`: Runs before getting.
- `afterGetCallback(request, record)`: Runs after getting.
- `transformResponseCallback(response, record)`: Transforms the response.
- `catchCallback(error)`: Runs on error.

### `find`
- **CRITICAL**: Find already has pagination and filtering (for model fields) by default. Only implement `beforeFindCallback` for filters with relations or custom filters not in the model fields.
- `beforeFindCallback(request, QueryBuilder)`: Runs before finding.
- `afterFindCallback(request, records)`: Runs after finding.
- `ReturnExtraDataCallback(request, QueryBuilder)`: Adds extra data to the response.
- `catchCallback(error)`: Runs on error.

## Find Method — Important Rules

- The find method already has pagination and filtering implemented by default.
- **NEVER** create filtering logic in `beforeFindCallback` if it can be done using default model field filtering. Default filtering allows filtering by any model field via query parameter with the same name.
- Only use `beforeFindCallback` for filters with relations or custom filters not in the model fields.
