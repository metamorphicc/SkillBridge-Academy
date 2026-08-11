export function buildN8nPayload(lead, scoring, ragSources = [], event = "lead.qualified", meta = {}) {
  const emittedAt = meta.emittedAt || new Date().toISOString();
  const eventId =
    meta.eventId || `${event}:${lead.id || lead.contact || "unknown"}:${meta.qualifiedAt || lead.createdAt || emittedAt}`;

  return {
    event,
    eventId,
    emittedAt,
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
    lifecycle: {
      qualifiedAt: meta.qualifiedAt || null,
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

  const timeoutMs = Number.isFinite(config.n8nTimeoutMs) ? config.n8nTimeoutMs : 2500;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(config.n8nLeadWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SkillBridge-Secret": config.n8nWebhookSecret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`n8n webhook failed: ${response.status} ${body}`);
  }

  return { ok: true, status: response.status, body };
}
