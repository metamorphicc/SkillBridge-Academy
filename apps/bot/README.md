# Telegram Bot

Lead qualification bot for the SkillBridge Academy automation case.

## What works now

- Telegram webhook handler: `POST /api/telegram`
- Landing lead handler: `POST /api/lead`
- RAG endpoint: `POST /api/rag`
- 6-question qualification flow:
  1. goal
  2. current level
  3. start timeline
  4. preferred format
  5. budget/readiness
  6. convenient contact time
- Lead score: `hot`, `warm`, or `cold`
- Local CRM fallback: `crm/leads.local.csv` and `crm/leads.local.json`
- Manager Telegram alert when `ADMIN_CHAT_ID` is configured
- n8n webhook delivery when `N8N_LEAD_WEBHOOK_URL` is configured
- Optional Telegram webhook secret check via `TELEGRAM_WEBHOOK_SECRET`
- RAG lookup from `apps/bot/data/knowledge-base.json` via `/ask <question>`

## Local run

From project root:

```powershell
node scripts/dev-server.mjs
```

This serves the landing page and API together:

- Landing: `http://127.0.0.1:5173/apps/landing/`
- Health: `http://127.0.0.1:5173/api/health`
- Lead intake: `POST http://127.0.0.1:5173/api/lead`
- Telegram webhook: `POST http://127.0.0.1:5173/api/telegram`

If `TELEGRAM_WEBHOOK_SECRET` is set, Telegram webhook requests must include:

```text
X-Telegram-Bot-Api-Secret-Token: your_secret
```

Bot-only API server:

```powershell
node apps/bot/src/server.mjs
```

Simulation:

```powershell
node apps/bot/src/simulate.mjs
```

## Telegram commands

- `/start` starts qualification
- `/reset` clears the current session
- `/ask <question>` searches the local school knowledge base
