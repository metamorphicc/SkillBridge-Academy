# CRM Schema

Local fallback file: `crm/leads.local.csv` and `crm/leads.local.json`.

Production target: Google Sheets with the same columns.

| Column | Meaning |
| --- | --- |
| `createdAt` | ISO timestamp when lead entered the system |
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
| `score` | `hot`, `warm`, or `cold` |
| `points` | 0-100 scoring value |
| `status` | Lead state, starts as `new` |
| `nextAction` | Manager action suggested by scoring |
| `source` | `landing_form`, `telegram_bot`, etc. |
