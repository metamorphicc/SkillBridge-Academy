# Architecture

```mermaid
flowchart LR
  A["Landing form"] --> B["API lead endpoint"]
  B --> C["Telegram qualification bot"]
  C --> D["Lead scoring"]
  D --> E["Google Sheets CRM"]
  D --> F["Manager Telegram alert"]
  D --> G["n8n follow-up workflow"]
```

## Main Services

- Landing app: public entry point.
- API: validation, routing, RAG lookup, and webhook handling.
- Telegram bot: conversational qualification with 6 questions.
- Scoring: hot/warm/cold priority and next action.
- CRM: local CSV/JSON fallback now, Google Sheets target for n8n.
- n8n: duplicate checks, Google Sheets append, Telegram alerts, reminders, and workflow visibility.

## Current Local Endpoints

- `GET /api/health`
- `POST /api/lead`
- `POST /api/telegram`
- `POST /api/rag`
