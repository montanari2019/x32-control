---
name: api-email-and-templates
description: Backend Template email sending with Nodemailer, React-based HTML email templates, i18n support, and the email service layer pattern. Use when implementing email notifications, transactional emails, or new email templates.
---

# Backend Template - Email & Templates

## Architecture Overview

```
src/
├── config/email.ts          # SMTP env vars
├── helpers/email.ts         # createMailSender / noreplySender
├── helpers/react.tsx        # reactRenderToHtml — React → HTML string
├── helpers/i18n.ts          # i18next setup and instance factory
├── translations/            # pt.json, en.json, es.json
├── templates/               # React email template components
│   ├── components/          # Shared layout components (EmailTemplate, LinkButton, etc.)
│   ├── EmailAccountConfirmation/index.tsx
│   ├── EmailConfirmation/index.tsx
│   └── EmailPasswordRecovery/index.tsx
└── services/email.ts        # High-level send functions consumed by controllers
```

---

## Configuration (`src/config/email.ts`)

Required environment variables:
```
EMAIL_HOST
EMAIL_PORT
EMAIL_SECURE        # 'true' | 'false'
EMAIL_NOREPLY_FROM  # sender address
EMAIL_NOREPLY_USER  # SMTP username
EMAIL_NOREPLY_PASS  # SMTP password
```

---

## Sending Emails — `src/helpers/email.ts`

### `createMailSender` — create a custom sender
```ts
import { createMailSender } from '~/helpers/email';

const mySender = createMailSender({
    name: 'My App',
    from: 'no-reply@myapp.com',
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
});

await mySender({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' });
```

Parameters for the returned sender function:
| Field | Required | Description |
|---|---|---|
| `to` | ✅ | Recipient address |
| `subject` | ✅ | Email subject |
| `html` | ✅ | HTML body |
| `bcc` | ❌ | BCC address |
| `replyTo` | ❌ | Reply-to address |

### `noreplySender` — pre-configured no-reply sender
Use this for all standard transactional emails:
```ts
import { noreplySender } from '~/helpers/email';

await noreplySender({ to: user.email, subject: '...', html: content });
```

---

## HTML Email Templates — `src/templates/`

Templates are React components rendered to static HTML strings.

### Rendering a template (`src/helpers/react.tsx`)
```ts
import { reactRenderToHtml } from '~/helpers/react';
import MyEmailTemplate from '~/templates/MyEmailTemplate';

const html = reactRenderToHtml(MyEmailTemplate, { firstName: 'João', token: 'abc123' });
// Returns a full <!DOCTYPE html> string ready to send
```

### Creating a new template

Create `src/templates/MyEmailTemplate/index.tsx`:
```tsx
import React from 'react';
import EmailTemplate from '../components/EmailTemplate';
import LinkButton from '../components/LinkButton';
import Row from '../components/FixedTable/Row';
import Col from '../components/FixedTable/Col';

// Props are passed directly from reactRenderToHtml
const MyEmailTemplate = ({ firstName, actionUrl }) => (
    <EmailTemplate title="My Subject">
        <Row>
            <Col align="center">
                <h2>{`Olá, ${firstName}!`}</h2>
            </Col>
        </Row>
        <LinkButton href={actionUrl}>
            Clique aqui
        </LinkButton>
    </EmailTemplate>
);

export default MyEmailTemplate;
```

Available shared components in `src/templates/components/`:
- `EmailTemplate` — base wrapper (handles title, global styles)
- `LinkButton` — styled CTA button with `href`
- `FixedTable/Row` — table row wrapper
- `FixedTable/Col` — table cell with `align` and `style` props

---

## Email Service Layer — `src/services/email.ts`

Add all public send functions here. Keep controllers free of email rendering logic.

```ts
import { noreplySender } from '~/helpers/email';
import { reactRenderToHtml } from '~/helpers/react';
import MyEmailTemplate from '~/templates/MyEmailTemplate';

export async function sendMyEmail(user: User, token: string) {
    try {
        const [firstName] = user.name.split(' ');
        const html = reactRenderToHtml(MyEmailTemplate, { firstName, token });

        await noreplySender({
            to: user.email,
            subject: 'Meu assunto',
            html,
        });
    } catch (error) {
        // Never let email failures crash the flow — log and swallow
        console.warn(error);
    }
}
```

> **Important**: Always wrap send functions in try/catch and use `console.warn`. Email failures should not break the main request flow.

### Calling from a controller
```ts
import { sendMyEmail } from '~/services/email';

// If the response is already sent (sendStatus 204), fire-and-forget is acceptable:
response.sendStatus(204);
sendMyEmail(user, token);
```

---

## Internationalization — `src/helpers/i18n.ts`

### Setup (called once at app startup)
```ts
import { setupI18n } from '~/helpers/i18n';
await setupI18n();
```

### Per-request translation instance
```ts
import { createI18nInstance } from '~/helpers/i18n';

const i18n = await createI18nInstance(user.language); // e.g. 'pt', 'en', 'es'
const message = i18n.t('some.translation.key');
```

### Adding translations
Add keys to all three files in `src/translations/`:
- `pt.json` — Portuguese
- `en.json` — English
- `es.json` — Spanish

---

## Existing email templates (reference)

| Template | Trigger | Key props |
|---|---|---|
| `EmailAccountConfirmation` | User registration | `firstName`, `token` |
| `EmailConfirmation` | Email address change | `firstName`, `token` |
| `EmailPasswordRecovery` | Password reset request | `firstName`, `token` |

All three use `noreplySender` via `src/services/email.ts`.
