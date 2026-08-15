# API

The local API is implemented in `apps/bot/src/http.mjs` and mounted by
`scripts/dev-server.mjs`.

## Endpoints

### `GET /api/health`

Returns service status and whether Telegram/n8n env vars are configured.

### `POST /api/lead`

Accepts raw landing form submissions. This is kept for fallback/intake tests.
The main landing now uses `/api/lead/qualify` after the web qualification chat.

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

### `POST /api/lead/qualify`

Accepts landing form fields plus completed web qualification answers.

```json
{
  "name": "Anna Petrova",
  "school": "Online design academy",
  "contact": "@anna_demo",
  "need": "Lead qualification",
  "answers": {
    "goal": "Change career",
    "level": "Beginner",
    "start": "Within 7 days",
    "format": "Group",
    "budget": "Ready to discuss",
    "contactTime": "Today"
  }
}
```

Creates a scored `lead.qualified` event. This is the production landing path:
n8n receives the full lead profile, writes the CRM row, sends an admin summary,
and routes Hot/Warm/Cold manager alerts.

### `POST /api/telegram`

Receives Telegram webhook updates and runs the same 6-question qualification flow
as an alternate channel.
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

### `PATCH /api/leads/:id`

Updates manager-only local CRM fields for the protected dashboard. The `id`
is the row `eventId` when available, otherwise the lead `id`.

```json
{
  "pipelineStatus": "contacted",
  "owner": "Admissions manager",
  "managerNote": "Asked for available call windows."
}
```

Allowed statuses: `new`, `needs_qualification`, `contacted`, `no_answer`,
`won`, `lost`, `nurture`.

## Deployment note

The code is written with Node built-ins only, so it can be moved into Vercel
functions later without changing the business logic modules.
