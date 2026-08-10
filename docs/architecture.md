# Architecture

```mermaid
flowchart LR
  A["Landing form"] --> B["API lead endpoint"]
  B --> C["n8n lead.created"]
  C --> D["Google Sheets intake row"]
  C --> E["Intake manager alert"]
  B --> F["Telegram qualification bot"]
  F --> G["Lead scoring"]
  G --> H["n8n lead.qualified"]
  H --> I["Google Sheets qualified row"]
  H --> J{"Score route"}
  J --> K["Hot: call first"]
  J --> L["Warm: write today"]
  J --> M["Cold: nurture"]
```

## Main Services

- Landing app: public entry point.
- API: validation, routing, RAG lookup, and webhook handling.
- Telegram bot: conversational qualification with 6 questions.
- Scoring: hot/warm/cold priority and next action.
- CRM: local CSV/JSON fallback now, Google Sheets target for n8n.
- n8n: duplicate checks, Google Sheets append, Telegram alerts, reminders, and workflow visibility.
- Event model: `lead.created` for intake rows, `lead.qualified` for scored bot rows.

## Current Local Endpoints

- `GET /api/health`
- `POST /api/lead`
- `POST /api/telegram`
- `POST /api/rag`
