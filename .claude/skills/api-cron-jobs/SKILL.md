---
name: api-cron-jobs
description: Backend Template cron job setup using node-cron with automatic domain discovery. Use when creating scheduled tasks, background jobs, or periodic processes within a domain.
---

# Backend Template - Cron Jobs

## Overview

The template auto-discovers and registers cron jobs from every domain. Any domain folder that exports a `define()` function from a `cron.ts` file will have its jobs scheduled automatically at startup.

```
src/
├── cron.ts               # Auto-discovery and scheduler bootstrap
├── config/cron.ts        # CRON_DISABLE and TZ env vars
└── domains/
    └── <entity>/
        └── cron.ts       # Domain cron module (optional)
```

---

## Configuration (`src/config/cron.ts`)

| Env var | Default | Description |
|---|---|---|
| `CRON_DISABLE` | `true` | Set to `'false'` to enable cron jobs |
| `TZ` | system | Timezone for schedule expressions (e.g. `America/Sao_Paulo`) |

> Cron jobs are **disabled by default**. Set `CRON_DISABLE=false` in production.

---

## Creating a Cron Job in a Domain

Add a `cron.ts` file to your domain folder. It **must** export a `define()` function that returns an array of job configs.

**`src/domains/<entity>/cron.ts`**
```ts
import { App } from '~/types'; // App.Cron.CronModule

export const name = 'my-entity-cron';

export function define(): App.Cron.CronJob[] {
    return [
        {
            schedule: '0 0 * * *',          // cron expression (daily at midnight)
            handler: async () => {
                // job logic here
                console.log('Running daily cleanup...');
            },
            options: {
                scheduled: true,
                timezone: 'America/Sao_Paulo',
            },
        },
    ];
}
```

### `App.Cron.CronJob` fields

| Field | Type | Description |
|---|---|---|
| `schedule` | `string` | Standard cron expression (`* * * * *`) |
| `handler` | `() => void \| Promise<void>` | The function to execute |
| `options` | `node-cron ScheduleOptions` | Optional — supports `timezone`, `scheduled` |

---

## Cron Module contract (`App.Cron.CronModule`)

Each discovered module must conform to:
```ts
interface CronModule {
    name?: string;          // optional identifier for logging
    define(): CronJob[];    // required — returns job definitions
}
```

If `define` is missing, the bootstrap will throw an error to prevent silent misconfiguration.

---

## Multiple jobs per domain

```ts
export function define(): App.Cron.CronJob[] {
    return [
        {
            schedule: '*/15 * * * *',   // every 15 minutes
            handler: syncExternalData,
        },
        {
            schedule: '0 3 * * 0',      // every Sunday at 3am
            handler: weeklyReport,
        },
    ];
}
```

---

## Managing the cron lifecycle (testing / programmatic use)

```ts
import { startCron, stopCron } from '~/cron';

// Start all discovered jobs
await startCron();

// Stop and clear all running jobs
stopCron();
```

`stopCron` is useful in integration tests to ensure jobs don't bleed across test suites.

---

## Cron expression reference

| Expression | Meaning |
|---|---|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour (on the hour) |
| `0 0 * * *` | Every day at midnight |
| `0 9 * * 1-5` | Weekdays at 9am |
| `*/15 * * * *` | Every 15 minutes |
| `0 0 1 * *` | First day of every month |

---

## Best practices

- Keep job handlers lean — delegate heavy logic to a service function.
- Always handle errors inside the handler to prevent the job from crashing silently.
- Use `console.warn` for non-critical failures, throw for unrecoverable ones.
- Do not perform direct DB queries inside `cron.ts` — use a service or repository layer.

```ts
// Good pattern
import { cleanupExpiredTokens } from '~/services/tokens';

export function define() {
    return [{
        schedule: '0 2 * * *',
        handler: async () => {
            try {
                await cleanupExpiredTokens();
            } catch (err) {
                console.warn('Token cleanup failed:', err);
            }
        },
    }];
}
```
