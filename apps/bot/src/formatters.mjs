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

export function makeReplyMarkup(question) {
  if (!question?.quickReplies?.length) return undefined;
  return {
    keyboard: question.quickReplies.map((reply) => [{ text: reply }]),
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}
