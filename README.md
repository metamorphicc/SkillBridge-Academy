# SkillBridge Academy

Portfolio case for an online school lead pipeline.

## Case Idea

A visitor lands on the course page, leaves a request, then a Telegram bot qualifies the lead with a short question flow. The system scores the lead, writes it to CRM, alerts the manager, and schedules a follow-up.

## Product Scope

- Landing page for an online course or expert program.
- Telegram bot that qualifies leads before the manager joins.
- RAG knowledge lookup for program, format, budget, and follow-up answers.
- CRM table in local CSV/JSON fallback now, Google Sheets target for n8n.
- n8n workflow contract for lead routing, duplicate checks, alerts, and reminders.
- Case-study documentation with screenshots and workflow explanation.

## Target Workflow

1. Visitor submits a form on the landing.
2. Bot asks goal, level, start date, format, budget, and contact preference.
3. Lead gets a score: hot, warm, or cold.
4. Data goes to Google Sheets CRM.
5. Manager gets a Telegram alert with priority and next action.
6. Follow-up reminder is created if the lead does not book a call.

## Structure

```text
apps/
  landing/        Public course landing page.
  bot/            Telegram lead qualification bot.
api/              Serverless endpoints for form and Telegram webhooks.
automations/
  n8n/            Importable n8n workflow and setup notes.
crm/              CRM schema, sample rows, and local fallback format.
docs/             Case study, architecture, offer, and demo script.
assets/           Images, icons, screenshots, and brand materials.
scripts/          Small maintenance/setup scripts.
```

## Portfolio Angle

This case is not about simple booking. It shows lead qualification, scoring, CRM hygiene, and manager routing for a business that sells consultations or education.

## Local Run

```powershell
node scripts/dev-server.mjs
```

Open:

```text
http://127.0.0.1:5173/apps/landing/
```

Useful checks:

```powershell
node scripts/check.mjs
node apps/bot/src/simulate.mjs
```
