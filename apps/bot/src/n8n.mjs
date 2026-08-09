export function buildN8nPayload(lead, scoring, ragSources = [], event = "lead.qualified") {
  return {
    event,
    version: "1.0",
    lead: {
      id: lead.id,
      createdAt: lead.createdAt,
      name: lead.name,
      school: lead.school,
      contact: lead.contact,
      need: lead.need,
      source: lead.source,
      telegramChatId: lead.telegramChatId,
      answers: lead.answers,
    },
    scoring,
    rag: {
      sources: ragSources,
    },
    routing: {
      crm: "google_sheets_or_local_csv",
      managerAlert:
        scoring.score === "pending"
          ? "after_qualification"
          : scoring.score === "hot"
            ? "urgent"
            : scoring.score === "warm"
              ? "today"
              : "nurture",
      followUp:
        scoring.score === "pending"
          ? "qualification"
          : scoring.score === "hot"
          ? "call_window"
          : scoring.score === "warm"
            ? "fit_questions"
            : "intro_material",
    },
  };
}

export async function sendToN8n(config, payload) {
  if (!config.n8nLeadWebhookUrl) {
    return { ok: false, skipped: true, reason: "N8N_LEAD_WEBHOOK_URL is not configured" };
  }

  const response = await fetch(config.n8nLeadWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SkillBridge-Secret": config.n8nWebhookSecret,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`n8n webhook failed: ${response.status} ${body}`);
  }

  return { ok: true, status: response.status, body };
}
