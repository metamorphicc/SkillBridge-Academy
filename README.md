# SkillBridge Academy

Portfolio case for an online school lead pipeline.

## Case Idea

A visitor lands on the course page, leaves a request, then completes a short web qualification flow. The system scores the lead, writes it to CRM, alerts the right manager in Telegram, and prepares a follow-up.

## Product Scope

- Landing page for an online course or expert program.
- Web qualification chat that asks the key lead questions before the manager joins.
- Telegram bot as an optional/alternate qualification channel.
- RAG knowledge lookup for program, format, budget, and follow-up answers.
- CRM table in local CSV/JSON fallback now, Google Sheets target for n8n.
- Manager dashboard for queue stats, follow-up routes, and latest leads.
- Importable n8n production workflow for lead routing, duplicate checks, alerts, and follow-up tasks.
- Case-study documentation with screenshots and workflow explanation.

## Target Workflow

1. Visitor submits a form on the landing.
2. The web chat asks goal, level, start date, format, budget, and contact preference.
3. Lead gets a score: hot, warm, or cold.
4. n8n writes `lead.qualified` to Google Sheets.
5. n8n sends an admin summary and routes the manager alert by score.
6. Follow-up route is selected: call window, fit questions, or nurture.

## Structure

```text
apps/
  landing/        Public course landing page.
  admin/          Manager dashboard for pipeline visibility.
  bot/            Telegram lead qualification bot.
api/              Serverless endpoints for form and Telegram webhooks.
automations/
  n8n/            Importable production workflow, contracts, and setup notes.
crm/              CRM schema, sample rows, and local fallback format.
docs/             Case study, architecture, offer, and demo script.
assets/           Images, icons, screenshots, and brand materials.
scripts/          Small maintenance/setup scripts.
```

## n8n Workflow

Import:

```text
automations/n8n/workflow.production.json
```

The workflow validates `X-SkillBridge-Secret`, normalizes the webhook payload,
skips duplicate `eventId` values, appends Google Sheets rows, routes Telegram
alerts by score, and creates structured follow-up task payloads.

## Portfolio Angle

This case is not about simple booking. It shows lead qualification, scoring, CRM hygiene, and manager routing for a business that sells consultations or education.

## Local Run

```powershell
node scripts/dev-server.mjs
```

Open:

```text
http://127.0.0.1:5173/apps/landing/
http://127.0.0.1:5173/apps/admin/
```

The manager dashboard is protected by an admin login. Set these in `.env`:

```powershell
ADMIN_DASHBOARD_PASSWORD=replace_me_with_strong_password
ADMIN_SESSION_SECRET=replace_me_with_long_random_text
```

`/api/leads` uses the same admin session, so the CRM stream is not readable without logging in.

Useful checks:

```powershell
node scripts/check.mjs
node apps/bot/src/simulate.mjs
```

Final handoff:

```text
docs/project-handoff.md
```
