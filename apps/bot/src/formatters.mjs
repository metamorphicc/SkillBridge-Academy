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

export function formatClientReply(scoring) {
  if (scoring.score === "hot") {
    return "Thanks. I have enough context to route this as a priority request. A manager should contact you with available call slots.";
  }
  if (scoring.score === "warm") {
    return "Thanks. I saved the request and will pass the context to the manager. They may clarify timing and format before suggesting next steps.";
  }
  return "Thanks. I saved the request. I will send helpful intro material first, then the team can follow up when the timing is clearer.";
}

export function formatLeadSummary(lead, scoring) {
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
    "",
    `<b>Priority</b>: ${escapeHtml(scoring.score.toUpperCase())} (${scoring.points}/100)`,
    `Next action: ${escapeHtml(scoring.nextAction)}`,
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
