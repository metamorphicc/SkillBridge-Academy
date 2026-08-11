# API

The local API is implemented in `apps/bot/src/http.mjs` and mounted by
`scripts/dev-server.mjs`.

## Endpoints

### `GET /api/health`

Returns service status and whether Telegram/n8n env vars are configured.

### `POST /api/lead`

Accepts landing form submissions.

```json
{
  "name": "Anna Petrova",
  "school": "Online design academy",
  "contact": "@anna_demo",
  "need": "Lead qualification"
}
```

Creates a lead, validates fields, writes local CRM fallback, prepares scoring,
and attempts n8n webhook delivery if `N8N_LEAD_WEBHOOK_URL` is configured.
The form submission is an intake event, so its event name is `lead.created`
and its score is `pending` until the bot collects qualification answers.

### `POST /api/telegram`

Receives Telegram webhook updates and runs the 6-question qualification flow.
If `TELEGRAM_WEBHOOK_SECRET` is configured, the request must include
`X-Telegram-Bot-Api-Secret-Token`.
When the flow completes, the bot emits `lead.qualified` with a `hot`, `warm`,
or `cold` score.

### `POST /api/rag`

Searches the local knowledge base.

```json
{ "query": "what should warm leads receive?" }
```

### `GET /api/admin/session`

Returns whether the current browser has a valid admin dashboard session.

### `POST /api/admin/login`

Accepts `{ "password": "..." }`, checks `ADMIN_DASHBOARD_PASSWORD`, and sets
a signed HttpOnly admin session cookie.

### `POST /api/admin/logout`

Clears the admin session cookie.

### `GET /api/leads`

Returns local CRM rows plus dashboard stats for the manager view. Requires the
admin session cookie from `/api/admin/login`.

```json
{
  "ok": true,
  "stats": {
    "total": 12,
    "qualified": 5,
    "openIntake": 7
  },
  "leads": []
}
```

## Deployment note

The code is written with Node built-ins only, so it can be moved into Vercel
functions later without changing the business logic modules.
