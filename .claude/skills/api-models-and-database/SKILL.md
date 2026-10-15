---
name: api-models-and-database
description: Backend Template ORM models with Objection.js, relationships, modifiers, migrations with Knex.js, and database query patterns. Use when creating models, migrations, relationships, or writing database queries.
---

# Backend Template - Models & Database

## Models

- Use the `extend` method passing `BaseModel` from `src/models.ts` for your models to ensure consistency.
- Define the database schema and interact with the database using the ORM.

## Models Structure
```ts
import { BaseModel } from '~/models';

export class YourEntity extends BaseModel {
  static get tableName() {
    return 'your_entity';
  }

  static get idColumn() {
    return 'id';
  }

  property1: string;
  nullable?: string;

  // Define relationMappings, modifiers, etc. here
}
```

## Relationships
**ALWAYS** import related models at the top of your model file to avoid circular dependencies. Define relationships in the `relationMappings` property of your model class.
Set relationships in `model.ts` using the `relationMappings` property:

```ts
import { BaseModel } from '~/models';
import Category from '~/domains/categories/model';

export class Product extends BaseModel {
  static get tableName() {
    return 'products';
  }

  static get relationMappings() {
    return {
      category: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: 'products.category_id',
          to: 'categories.id',
        },
      },
    };
  }
}
```

## Modifiers
You can create other modifiers as needed for different query patterns, such as filtering by status, date range, etc.
Use modifiers to create reusable query snippets. Use `getOneModifier` for single record queries and `getListModifier` for multiple records:

```ts
import { BaseModel } from '~/models';

export class Product extends BaseModel {
  static get tableName() {
    return 'products';
  }

  static get modifiers() {
    return {
      getOneModifier(queryBuilder: AnyQueryBuilder) {
        queryBuilder.withGraphFetched({
          category: {
            type: true,
          },
        });
      },
      getListModifier(queryBuilder: AnyQueryBuilder) {
        queryBuilder.withGraphFetched({
          category: true,
        });
      },
    };
  }
}
```

## Migrations

- To create or alter tables, use Knex.js migrations in `database/migrations`.
- Migrations must be tested by running and rolling back.

## Database Queries

- Prefer Model methods and QueryBuilder provided by Objection over raw queries for optimizations and security.
- Use indexing for frequently queried fields.

## Transactions

- Any operation that writes to 2+ tables or has multi-step side effects **MUST** run inside a single transaction.
- Use `transacting` consistently in all queries within the workflow.
