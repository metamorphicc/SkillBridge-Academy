# n8n Automation

This folder prepares the n8n side of the SkillBridge case.

## Files

- `lead-qualified.contract.json` - exact payload shape emitted by the bot/API.
- `workflow.stub.json` - starter workflow skeleton for n8n import and wiring.

## Pipeline

1. Webhook receives `lead.qualified`.
2. Validate `X-SkillBridge-Secret`.
3. Normalize and deduplicate by `contact`.
4. Append lead to Google Sheets CRM.
5. Notify manager in Telegram:
   - hot: contact urgently
   - warm: write today
   - cold: add to nurture
6. Create follow-up task/reminder.
7. Return `{ "ok": true }`.

## Bot connection

Set:

```text
N8N_LEAD_WEBHOOK_URL=https://your-n8n/webhook/skillbridge/lead-qualified
N8N_WEBHOOK_SECRET=skillbridge-local-secret
```

The bot sends the payload after a lead is created or qualified.
