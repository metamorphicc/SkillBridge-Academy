# CRM Schema

Local fallback file: `crm/leads.local.csv` and `crm/leads.local.json`.

Production target: Google Sheets with the same columns.

| Column | Meaning |
| --- | --- |
| `event` | `lead.created` for landing intake, `lead.qualified` after bot qualification |
| `eventId` | Stable event key used by n8n duplicate protection |
| `emittedAt` | ISO timestamp when the app emitted the webhook event |
| `createdAt` | ISO timestamp when lead entered the system |
| `qualifiedAt` | ISO timestamp when the bot qualification completed |
| `name` | Lead name |
| `school` | School, academy, bootcamp, or project name |
| `contact` | Telegram, phone, or email |
| `need` | What automation the requester wants |
| `goal` | Student learning goal from bot qualification |
| `level` | Current student level |
| `start` | Start window |
| `format` | Preferred learning format |
| `budget` | Budget/payment readiness |
| `contactTime` | Convenient manager contact time |
| `score` | `pending`, `hot`, `warm`, or `cold` |
| `points` | 0-100 scoring value |
| `status` | Lead state, starts as `intake`, then `new` after qualification |
| `nextAction` | Manager action suggested by scoring |
| `source` | `landing_form`, `telegram_bot`, etc. |
| `managerAlert` | n8n routing priority for manager notification |
| `followUp` | Follow-up route: qualification, call window, fit questions, intro material |
| `ragSources` | Knowledge-base source ids used for the lead brief |
