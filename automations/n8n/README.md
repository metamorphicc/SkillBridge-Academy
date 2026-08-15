# n8n Automation

This folder contains the automation layer for the SkillBridge Academy case:

Landing form -> web qualification -> n8n -> Google Sheets -> admin summary -> Telegram manager routing -> follow-up task.

## Files

- `workflow.production.json` - import this workflow for the full pipeline.
- `workflow.stub.json` - smaller starter/reference workflow.
- `lead-created.contract.json` - intake payload emitted after the landing form.
- `lead-qualified.contract.json` - qualified payload emitted after the web chat or Telegram bot finishes.

## Production Workflow

Import `workflow.production.json` in n8n, then configure:

1. `Lead Event Webhook`
   - Path: `skillbridge/lead-events`
   - Method: `POST`
   - Response mode: `On received`
   - Use the Production URL only after the workflow is published.

2. `Validate Secret`
   - `value1`: `={{$json.headers["x-skillbridge-secret"]}}`
   - `value2`: paste the same secret string as the app `.env` `N8N_WEBHOOK_SECRET`.
   - The imported workflow uses `skillbridge-local-secret` by default.
   - Do not use `$env` here for the local demo if n8n shows `access to env vars denied`.

3. `Append Google Sheets Row`
   - Select your Google Sheets credentials.
   - Select the spreadsheet document.
   - Select the `Leads` sheet.
   - Keep retry enabled.

4. Telegram nodes
   - Select Telegram credentials.
   - Replace the placeholder chat IDs in each Telegram node:

```text
Notify Intake: PASTE_ADMIN_CHAT_ID
Notify Admin Summary: PASTE_ADMIN_CHAT_ID
Notify Hot Manager: PASTE_HOT_MANAGER_CHAT_ID
Notify Warm Manager: PASTE_WARM_MANAGER_CHAT_ID
Notify Cold Manager: PASTE_COLD_MANAGER_CHAT_ID
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

Important: the app `.env` is still needed because the app must know where to
send events and which secret header to include. The n8n workflow itself does not
need env access in the local setup.

## Google Sheets Columns

Create these headers in row 1:

```text
event	eventId	emittedAt	createdAt	qualifiedAt	name	school	contact	need	goal	level	start	format	budget	contactTime	score	points	status	nextAction	source	managerAlert	followUp	ragSources
```

The workflow appends both events:

- `lead.qualified` from the main landing web-chat flow with `score=hot`, `warm`, or `cold`.
- `lead.created` from the fallback intake endpoint with `score=pending`.

## Payload Normalization

`Prepare CRM Row` is the key node. It flattens webhook payloads into:

- `row.*` fields for Google Sheets.
- `telegram.*` messages for admin summaries and manager alerts.
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

- Intake fallback -> `Notify Intake` -> `Wait For Qualification Follow-up`.
- Qualified -> `Notify Admin Summary` -> Hot/Warm/Cold routing.
- Hot -> `Notify Hot Manager` -> `Create Call Window Follow-up`.
- Warm -> `Notify Warm Manager` -> `Create Fit Questions Follow-up`.
- Cold -> `Notify Cold Manager` -> `Create Nurture Follow-up`.

If you do not want intake alerts, disconnect or delete `Notify Intake`. The app
does not send a direct manager alert when `N8N_LEAD_WEBHOOK_URL` is configured,
so duplicate Telegram messages usually mean both direct bot alerts and n8n
alerts are enabled somewhere.

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
4. Submit the landing form and finish the web qualification chat.
5. Expected: one `lead.qualified` row.
6. Expected: one admin summary plus one Hot/Warm/Cold manager alert.
7. Expected: one follow-up task output.

If test URL works but production URL does nothing, the workflow is not published
or the app still has `/webhook-test/...` in `.env`.
