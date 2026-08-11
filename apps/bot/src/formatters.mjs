export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatManagerAlert(lead, scoring, ragSources = []) {
  const answers = lead.answers || {};
  return [
    `New ${scoring.score.toUpperCase()} lead`,
    `Name: ${lead.name || "Unknown"}`,
    `School/project: ${lead.school || "Not provided"}`,
    `Contact: ${lead.contact || "Not provided"}`,
    `Need: ${lead.need || "Lead qualification"}`,
    `Goal: ${answers.goal || "Not answered"}`,
    `Level: ${answers.level || "Not answered"}`,
    `Start: ${answers.start || "Not answered"}`,
    `Format: ${answers.format || "Not answered"}`,
    `Budget: ${answers.budget || "Not answered"}`,
    `Contact time: ${answers.contactTime || "Not answered"}`,
    `Score: ${scoring.score} (${scoring.points}/100)`,
    `Reasons: ${scoring.reasons.join(", ") || "not enough signal"}`,
    `Next action: ${scoring.nextAction}`,
    ragSources.length ? `RAG sources: ${ragSources.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatIntakeAlert(lead) {
  return [
    "New intake lead",
    `Name: ${lead.name || "Unknown"}`,
    `School/project: ${lead.school || "Not provided"}`,
    `Contact: ${lead.contact || "Not provided"}`,
    `Need: ${lead.need || "Lead qualification"}`,
    "Status: waiting for qualification answers",
    "Next action: continue qualification in Telegram.",
  ].join("\n");
}

export function formatClientReply() {
  return "Thanks. I saved your answers. A manager will review the request and contact you with the next steps.";
}

export function formatLeadSummary(lead) {
  const answers = lead.answers || {};
  return [
    "Qualification complete.",
    "",
    `<b>Lead profile</b>`,
    `Goal: ${escapeHtml(answers.goal || "Not answered")}`,
    `Level: ${escapeHtml(answers.level || "Not answered")}`,
    `Start: ${escapeHtml(answers.start || "Not answered")}`,
    `Format: ${escapeHtml(answers.format || "Not answered")}`,
    `Budget: ${escapeHtml(answers.budget || "Not answered")}`,
    `Contact time: ${escapeHtml(answers.contactTime || "Not answered")}`,
  ].join("\n");
}

export function makeReplyMarkup(question, options = {}) {
  if (!question?.quickReplies?.length) return undefined;
  const rows = question.quickReplies.map((reply) => [{ text: reply }]);
  const controls = [];
  if (options.canGoBack) controls.push({ text: "Back" });
  controls.push({ text: "Reset" });
  rows.push(controls);

  return {
    keyboard: rows,
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}
