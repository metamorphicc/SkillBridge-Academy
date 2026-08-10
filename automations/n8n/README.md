# n8n Automation

This folder prepares the n8n side of the SkillBridge case.

## Files

- `lead-created.contract.json` - intake payload emitted by the landing form.
- `lead-qualified.contract.json` - exact qualified payload shape emitted by the bot.
- `workflow.stub.json` - starter workflow skeleton for n8n import and wiring.

## Pipeline

1. Webhook receives `lead.created` from the landing or `lead.qualified` from the bot.
2. Validate `X-SkillBridge-Secret`.
3. Normalize and deduplicate by `contact`.
4. Append lead to Google Sheets CRM.
5. For `lead.created`, send an intake manager alert and wait for qualification.
6. For `lead.qualified`, branch by score and notify manager in Telegram:
   - hot: contact urgently
   - warm: write today
   - cold: add to nurture
7. Create follow-up task/reminder.
8. Return immediately from the webhook so the bot does not wait for Sheets/Telegram.

## Google Sheets columns

Use these headers in row 1:

```text
event	createdAt	qualifiedAt	name	school	contact	need	goal	level	start	format	budget	contactTime	score	points	status	nextAction	source	managerAlert	followUp	ragSources
```

The workflow appends both intake and qualified events. Intake rows have empty
qualification answers and `score=pending`. Qualified rows include bot answers,
final score, routing, follow-up, and RAG source ids.

## Bot connection

Set:

```text
N8N_LEAD_WEBHOOK_URL=https://your-n8n/webhook/skillbridge/lead-events
N8N_WEBHOOK_SECRET=skillbridge-local-secret
```

The bot sends the payload after a lead is created or qualified.
