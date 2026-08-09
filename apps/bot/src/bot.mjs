import { formatClientReply, formatIntakeAlert, formatManagerAlert, makeReplyMarkup } from "./formatters.mjs";
import { buildN8nPayload, sendToN8n } from "./n8n.mjs";
import { nextQuestion } from "./questions.mjs";
import { answerWithRag } from "./rag.mjs";
import { normalizeLeadFromLanding, scoreLead, validateLandingLead } from "./scoring.mjs";
import { appendLead, clearSession, getSession, saveSession } from "./storage.mjs";
import { notifyManager, sendMessage } from "./telegram.mjs";

const textOf = (update) => update?.message?.text?.trim() || "";
const chatIdOf = (update) => update?.message?.chat?.id;
const nameOf = (update) => {
  const from = update?.message?.from || {};
  return [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Telegram lead";
};
const usernameOf = (update) => {
  const username = update?.message?.from?.username;
  return username ? `@${username}` : "";
};

function buildSessionFromTelegram(update) {
  return normalizeLeadFromLanding({
    name: nameOf(update),
    contact: usernameOf(update),
    school: "SkillBridge Academy lead",
    need: "Lead qualification",
    source: "telegram_bot",
    telegramChatId: chatIdOf(update),
  });
}

async function finalizeLead(config, lead) {
  const scoring = scoreLead(lead);
  const rag = await answerWithRag(
    `${lead.need} ${Object.values(lead.answers || {}).join(" ")} ${scoring.nextAction}`,
  );
  await appendLead(lead, scoring);
  const payload = buildN8nPayload(lead, scoring, rag.sources);

  const deliveries = {
    manager: null,
    n8n: null,
  };

  if (config.n8nLeadWebhookUrl) {
    deliveries.manager = { ok: false, skipped: true, reason: "manager alert is routed through n8n" };
  } else {
    try {
      deliveries.manager = await notifyManager(config, formatManagerAlert(lead, scoring, rag.sources));
    } catch (error) {
      deliveries.manager = { ok: false, error: error.message };
    }
  }

  try {
    deliveries.n8n = await sendToN8n(config, payload);
  } catch (error) {
    deliveries.n8n = { ok: false, error: error.message };
  }

  return {
    lead,
    scoring,
    rag,
    payload,
    deliveries,
    clientReply: formatClientReply(scoring),
  };
}

export async function createLeadFromLanding(config, input) {
  const validation = validateLandingLead(input);
  if (!validation.ok) {
    return { ok: false, status: 422, errors: validation.errors };
  }

  const lead = normalizeLeadFromLanding(input);
  const scoring = {
    score: "pending",
    points: 0,
    reasons: ["waiting for qualification answers"],
    nextAction: "Continue qualification in Telegram.",
    status: "intake",
  };
  const rag = await answerWithRag(`${lead.need} ${input.school || ""}`);
  const payload = buildN8nPayload(lead, scoring, rag.sources, "lead.created");

  await appendLead(lead, scoring);

  const deliveries = {
    manager: null,
    n8n: null,
  };

  if (config.n8nLeadWebhookUrl) {
    deliveries.manager = { ok: false, skipped: true, reason: "manager alert is routed through n8n" };
  } else {
    try {
      deliveries.manager = await notifyManager(config, formatIntakeAlert(lead));
    } catch (error) {
      deliveries.manager = { ok: false, error: error.message };
    }
  }

  let n8nDelivery = null;
  try {
    n8nDelivery = await sendToN8n(config, payload);
  } catch (error) {
    n8nDelivery = { ok: false, error: error.message };
  }
  deliveries.n8n = n8nDelivery;

  return {
    ok: true,
    status: 201,
    lead,
    scoring,
    rag,
    payload,
    deliveries,
    n8n: n8nDelivery,
    nextBotQuestion: "Telegram bot should continue with goal, level, start, format, budget, and contact time.",
  };
}

export async function handleTelegramUpdate(config, update) {
  const chatId = chatIdOf(update);
  const text = textOf(update);
  if (!chatId || !text) return { ok: true, ignored: true };

  if (text === "/help") {
    await sendMessage(
      config,
      chatId,
      "Commands: /start starts qualification, /reset clears progress, /ask <question> searches the school knowledge base.",
    );
    return { ok: true };
  }

  if (text === "/reset") {
    await clearSession(chatId);
    await sendMessage(config, chatId, "Progress cleared. Send /start to begin again.");
    return { ok: true };
  }

  if (text.startsWith("/ask")) {
    const query = text.replace("/ask", "").trim();
    const rag = await answerWithRag(query);
    await sendMessage(config, chatId, rag.answer);
    return { ok: true, ragSources: rag.sources };
  }

  let lead = await getSession(chatId);
  if (!lead || text === "/start") {
    lead = buildSessionFromTelegram(update);
    await saveSession(chatId, lead);
    const question = nextQuestion(lead.answers);
    await sendMessage(
      config,
      chatId,
      `Hi. I will ask a few questions and build a lead profile for the admissions manager.\n\n${question.prompt}`,
      makeReplyMarkup(question),
    );
    return { ok: true, started: true };
  }

  const question = nextQuestion(lead.answers);
  if (!question) {
    const result = await finalizeLead(config, lead);
    await clearSession(chatId);
    await sendMessage(config, chatId, result.clientReply, { remove_keyboard: true });
    return { ok: true, completed: true, result };
  }

  lead.answers[question.key] = text;
  await saveSession(chatId, lead);

  const followUp = nextQuestion(lead.answers);
  if (followUp) {
    await sendMessage(config, chatId, followUp.prompt, makeReplyMarkup(followUp));
    return { ok: true, answered: question.key, next: followUp.key };
  }

  const result = await finalizeLead(config, lead);
  await clearSession(chatId);
  await sendMessage(config, chatId, result.clientReply, { remove_keyboard: true });
  return { ok: true, completed: true, result };
}
