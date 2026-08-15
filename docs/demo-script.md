# Demo Script

Target demo length: 60-90 seconds.

## Setup

- Dev server is running.
- n8n workflow is published.
- Google Sheets credentials are connected.
- Telegram bot webhook is connected only if you also want to show the alternate bot channel.
- Admin dashboard password is set.

## Walkthrough

1. Open the landing page.
2. Submit a request with name, school/project, contact, and automation need.
3. Answer the web qualification questions: goal, level, start date, format, budget, and contact time.
4. Show the `lead.qualified` event in n8n.
5. Show the Google Sheets qualified row.
6. Show the admin summary.
7. Show the routed manager alert: Hot, Warm, or Cold.
8. Open the protected manager dashboard.
9. Filter/select the lead, update status, and add a manager note.

## Talk Track

SkillBridge qualifies online school leads before the admissions manager joins.
The landing captures the request, the web chat asks the missing questions,
scoring assigns priority, n8n writes CRM rows and routes alerts, and the
protected dashboard gives the manager the next action.

## Close

The case shows a practical automation path:

```text
Lead -> qualification chat -> score -> CRM -> manager alert -> next action -> follow-up
```
