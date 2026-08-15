# Project Handoff

SkillBridge Academy is a finished portfolio case for an AI-assisted admissions
pipeline for online schools.

## What Is Ready

- Responsive landing page for the B2B product.
- Protected manager dashboard with login, filters, lead profile, manager notes,
  owner field, and pipeline status controls.
- Telegram qualification bot with a short question flow.
- Back/reset behavior in the bot.
- RAG lookup from the local knowledge base.
- Hot/Warm/Cold lead scoring.
- Local CRM fallback in JSON/CSV.
- n8n production workflow artifact.
- Google Sheets CRM contract.
- Telegram manager routing contract.
- Follow-up route payloads for call window, fit questions, and nurture.
- API documentation, CRM schema, architecture notes, and demo script.

## Demo Flow

1. Open the landing page.
2. Submit a lead request.
3. Show the intake row or intake alert.
4. Open Telegram and finish the bot qualification.
5. Show the final score and answer summary in Telegram.
6. Show the Google Sheets row from n8n.
7. Show the manager alert routed by Hot/Warm/Cold.
8. Open the protected dashboard.
9. Filter the queue and select the lead.
10. Change pipeline status and add a manager note.

## Local Commands

```powershell
cd "C:\Users\User\Documents\New project\skillbridge-academy"
node scripts/dev-server.mjs
```

Open:

```text
http://127.0.0.1:5173/apps/landing/
http://127.0.0.1:5173/apps/admin/
```

Checks:

```powershell
node scripts/check.mjs
node apps/bot/src/simulate.mjs
```

## Required Environment

```text
TELEGRAM_BOT_TOKEN=
ADMIN_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=

N8N_LEAD_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
N8N_TIMEOUT_MS=2500

ADMIN_DASHBOARD_PASSWORD=
ADMIN_SESSION_SECRET=
PUBLIC_SITE_URL=http://127.0.0.1:5173/apps/landing/
```

Optional manager routing IDs for n8n:

```text
HOT_MANAGER_CHAT_ID=
WARM_MANAGER_CHAT_ID=
COLD_MANAGER_CHAT_ID=
```

For the local n8n import, paste manager chat IDs directly into the Telegram
nodes. Some local n8n installs deny `$env` inside node expressions.

## Google Sheets Headers

```text
event	eventId	emittedAt	createdAt	qualifiedAt	name	school	contact	need	goal	level	start	format	budget	contactTime	score	points	status	nextAction	source	managerAlert	followUp	ragSources
```

## n8n Setup

Import:

```text
automations/n8n/workflow.production.json
```

Then configure:

- Google Sheets credentials and target document.
- Telegram credentials and manager chat IDs.
- `Validate Secret` value2: paste the same secret string as app `.env`
  `N8N_WEBHOOK_SECRET`.
- Published production webhook URL in the app `.env`.

Use `/webhook-test/...` only while manually listening for test events. Use
`/webhook/...` after publishing the workflow.

## Manual Parts

These are intentionally left as integration wiring, not app code:

- Real CRM task creation after follow-up payloads.
- Real calendar booking for Hot leads.
- Real email/SMS/nurture campaign for Cold leads.
- Deployment hosting and public domain.
- Production database instead of local JSON/CSV.

## Portfolio Positioning

This is not just a landing page. The case demonstrates:

- Lead intake.
- Bot qualification.
- Structured scoring.
- CRM hygiene.
- Manager routing.
- n8n automation.
- Protected operations dashboard.

Use the business framing: the system reduces manual lead sorting, routes
important requests faster, and gives admissions teams a cleaner next action.
