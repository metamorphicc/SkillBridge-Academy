# n8n Automation

This folder contains the automation layer for the SkillBridge Academy case:

Landing form -> n8n -> Google Sheets -> Telegram manager routing -> follow-up task.

## Files

- `workflow.production.json` - import this workflow for the full pipeline.
- `workflow.stub.json` - smaller starter/reference workflow.
- `lead-created.contract.json` - intake payload emitted after the landing form.
- `lead-qualified.contract.json` - qualified payload emitted after the Telegram bot finishes.

## Production Workflow

Import `workflow.production.json` in n8n, then configure:

1. `Lead Event Webhook`
   - Path: `skillbridge/lead-events`
   - Method: `POST`
   - Response mode: `On received`
   - Use the Production URL only after the workflow is published.

2. `Validate Secret`
   - Set n8n env `N8N_WEBHOOK_SECRET`.
   - It must match the app `.env` value.

3. `Append Google Sheets Row`
   - Select your Google Sheets credentials.
   - Select the spreadsheet document.
   - Select the `Leads` sheet.
   - Keep retry enabled.

4. Telegram nodes
   - Select Telegram credentials.
   - Set chat IDs through n8n env:

```text
ADMIN_CHAT_ID=1825089798
HOT_MANAGER_CHAT_ID=1825089798
WARM_MANAGER_CHAT_ID=1825089798
COLD_MANAGER_CHAT_ID=1825089798
```

For a simple demo, all manager chat IDs can be the same. Later, route Hot/Warm/Cold
to different manager bots or group chats.

## App Environment

Set this in the project `.env`:

```text
N8N_LEAD_WEBHOOK_URL=http://127.0.0.1:5678/webhook/skillbridge/lead-events
N8N_WEBHOOK_SECRET=your_shared_secret
N8N_TIMEOUT_MS=2500
```

Use `/webhook-test/...` only while the n8n webhook node is listening for a test
event. Use `/webhook/...` after the workflow is published.

## Google Sheets Columns

Create these headers in row 1:

```text
event	eventId	emittedAt	createdAt	qualifiedAt	name	school	contact	need	goal	level	start	format	budget	contactTime	score	points	status	nextAction	source	managerAlert	followUp	ragSources
```

The workflow appends both events:

- `lead.created` from the landing form with `score=pending`.
- `lead.qualified` from the Telegram bot with `score=hot`, `warm`, or `cold`.

## Payload Normalization

`Prepare CRM Row` is the key node. It flattens webhook payloads into:

- `row.*` fields for Google Sheets.
- `telegram.*` messages for manager alerts.
- `isIntake`, `isHot`, `isWarm`, `isCold` booleans for routing.
- `followUpTask` for the next workflow step.

This keeps Sheets and Telegram expressions stable. They do not reach into
`$json.body.lead.answers...` directly.

## Duplicate Protection

`Duplicate Guard` uses `eventId` and n8n workflow static data to skip repeated
webhook events. This is enough for local/demo usage.

For a real deployed client, replace it with one of:

- n8n Data Store lookup by `eventId`;
- CRM lookup by `eventId`;
- Google Sheets lookup by `eventId` before append.

## Routing

After duplicate protection, the workflow splits into two lines:

- Google Sheets append.
- Telegram/follow-up routing.

This is intentional: if Google Sheets times out, manager alerts are not blocked.

Routing rules:

- Intake -> `Notify Intake` -> `Wait For Qualification Follow-up`.
- Hot -> `Notify Hot Manager` -> `Create Call Window Follow-up`.
- Warm -> `Notify Warm Manager` -> `Create Fit Questions Follow-up`.
- Cold -> `Notify Cold Manager` -> `Create Nurture Follow-up`.

The follow-up nodes currently produce structured task payloads. Replace them
with Google Calendar, CRM task, Telegram reminder, email, or Make/n8n delay nodes
when you want real reminders.

## Retry Settings

Keep retry enabled on:

- Google Sheets append: 3 tries, 5 seconds between tries.
- Telegram messages: 2 tries, 3 seconds between tries.

This protects the demo from temporary `ETIMEDOUT` errors from Google APIs.

## Test Checklist

1. Publish the workflow.
2. Copy the Production URL into `N8N_LEAD_WEBHOOK_URL`.
3. Restart the dev server.
4. Submit the landing form.
5. Expected: one `lead.created` row, one intake alert.
6. Finish the Telegram bot questions.
7. Expected: one `lead.qualified` row, one Hot/Warm/Cold manager alert, one follow-up task output.

If test URL works but production URL does nothing, the workflow is not published
or the app still has `/webhook-test/...` in `.env`.
