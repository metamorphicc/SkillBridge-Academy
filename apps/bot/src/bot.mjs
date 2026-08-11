import {
  formatClientReply,
  formatIntakeAlert,
  formatLeadSummary,
  formatManagerAlert,
  makeReplyMarkup,
} from "./formatters.mjs";
import { buildN8nPayload, sendToN8n } from "./n8n.mjs";
import { QUALIFICATION_STEPS, nextQuestion, previousAnsweredQuestion, questionIndex } from "./questions.mjs";
import { answerWithRag } from "./rag.mjs";
import { normalizeLeadFromLanding, scoreLead, validateLandingLead } from "./scoring.mjs";
import { appendLead, clearSession, getSession, saveSession } from "./storage.mjs";
import { deleteMessage, notifyManager, sendMessage } from "./telegram.mjs";

const textOf = (update) => update?.message?.text?.trim() || "";
const chatIdOf = (update) => update?.message?.chat?.id;
const messageIdOf = (update) => update?.message?.message_id;
const nameOf = (update) => {
  const from = update?.message?.from || {};
  return [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Telegram lead";
};
const usernameOf = (update) => {
  const username = update?.message?.from?.username;
  return username ? `@${username}` : "";
};

function buildSessionFromTelegram(update) {
  const lead = normalizeLeadFromLanding({
    name: nameOf(update),
    contact: usernameOf(update),
    school: "SkillBridge Academy lead",
    need: "Lead qualification",
    source: "telegram_bot",
    telegramChatId: chatIdOf(update),
  });
  lead.ui = { promptMessageId: null };
  return lead;
}

function canGoBack(lead) {
  return QUALIFICATION_STEPS.some((step) => lead.answers?.[step.key]);
}

function isAllowedQuestionAnswer(question, text) {
  return question?.quickReplies?.includes(text);
}

async function cleanupActivePrompt(config, chatId, lead, userMessageId) {
  await deleteMessage(config, chatId, lead?.ui?.promptMessageId);
  await deleteMessage(config, chatId, lead?.ui?.validationMessageId);
  await deleteMessage(config, chatId, userMessageId);
  if (lead?.ui) {
    lead.ui.promptMessageId = null;
    lead.ui.validationMessageId = null;
  }
}

async function askQuestion(config, chatId, lead, question, intro = "") {
  const prefix = intro ? `${intro}\n\n` : "";
  const message = await sendMessage(
    config,
    chatId,
    `${prefix}<b>Question ${questionIndex(question)}/${QUALIFICATION_STEPS.length}</b>\n${question.prompt}`,
    makeReplyMarkup(question, { canGoBack: canGoBack(lead) }),
  );
  const messageId = message?.result?.message_id || null;
  lead.ui = { ...(lead.ui || {}), promptMessageId: messageId };
  await saveSession(chatId, lead);
  return message;
}

async function rejectInvalidAnswer(config, chatId, lead, question, userMessageId) {
  await deleteMessage(config, chatId, userMessageId);
  await deleteMessage(config, chatId, lead?.ui?.validationMessageId);
  const message = await sendMessage(
    config,
    chatId,
    "Please choose one of the options below.",
    makeReplyMarkup(question, { canGoBack: canGoBack(lead) }),
  );
  lead.ui = { ...(lead.ui || {}), validationMessageId: message?.result?.message_id || null };
  await saveSession(chatId, lead);
}

async function resetConversation(config, chatId, lead, userMessageId) {
  await cleanupActivePrompt(config, chatId, lead, userMessageId);
  await clearSession(chatId);
  await sendMessage(config, chatId, "Progress cleared. Send /start to begin again.", { remove_keyboard: true });
}

async function finalizeLead(config, lead) {
  const qualifiedAt = new Date().toISOString();
  const scoring = scoreLead(lead);
  const rag = await answerWithRag(
    `${lead.need} ${Object.values(lead.answers || {}).join(" ")} ${scoring.nextAction}`,
  );
  const payload = buildN8nPayload(lead, scoring, rag.sources, "lead.qualified", { qualifiedAt });
  await appendLead(lead, scoring, {
    event: payload.event,
    eventId: payload.eventId,
    emittedAt: payload.emittedAt,
    routing: payload.routing,
    ragSources: rag.sources,
    qualifiedAt,
  });

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

  await appendLead(lead, scoring, {
    event: payload.event,
    eventId: payload.eventId,
    emittedAt: payload.emittedAt,
    routing: payload.routing,
    ragSources: rag.sources,
  });

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
  const userMessageId = messageIdOf(update);
  if (!chatId || !text) return { ok: true, ignored: true };

  if (text === "/help") {
    await sendMessage(
      config,
      chatId,
      "Commands: /start starts qualification, /reset clears progress, /ask <question> searches the school knowledge base.",
    );
    return { ok: true };
  }

  if (text === "/reset" || text === "Reset") {
    const lead = await getSession(chatId);
    await resetConversation(config, chatId, lead, userMessageId);
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
    if (lead) await cleanupActivePrompt(config, chatId, lead, userMessageId);
    else await deleteMessage(config, chatId, userMessageId);
    lead = buildSessionFromTelegram(update);
    const question = nextQuestion(lead.answers);
    await askQuestion(
      config,
      chatId,
      lead,
      question,
      "Hi. I will ask a few questions and build a lead profile for the admissions manager.",
    );
    return { ok: true, started: true };
  }

  if (text === "Back") {
    await cleanupActivePrompt(config, chatId, lead, userMessageId);
    const previous = previousAnsweredQuestion(lead.answers);
    if (previous) {
      lead.answers[previous.key] = "";
    }
    const question = previous || nextQuestion(lead.answers);
    await askQuestion(config, chatId, lead, question);
    return { ok: true, wentBack: Boolean(previous), question: question.key };
  }

  const question = nextQuestion(lead.answers);
  if (!question) {
    if (lead.finalizingAt) {
      await deleteMessage(config, chatId, userMessageId);
      await sendMessage(config, chatId, "I am already preparing the lead profile. One moment.", {
        remove_keyboard: true,
      });
      return { ok: true, finalizing: true };
    }
    lead.finalizingAt = new Date().toISOString();
    await saveSession(chatId, lead);
    const result = await finalizeLead(config, lead);
    await clearSession(chatId);
    await sendMessage(config, chatId, `${formatLeadSummary(lead, result.scoring)}\n\n${result.clientReply}`, {
      remove_keyboard: true,
    });
    return { ok: true, completed: true, result };
  }

  if (!isAllowedQuestionAnswer(question, text)) {
    await rejectInvalidAnswer(config, chatId, lead, question, userMessageId);
    return { ok: false, invalidAnswer: true, question: question.key };
  }

  await cleanupActivePrompt(config, chatId, lead, userMessageId);
  lead.answers[question.key] = text;
  await saveSession(chatId, lead);

  const followUp = nextQuestion(lead.answers);
  if (followUp) {
    await askQuestion(config, chatId, lead, followUp);
    return { ok: true, answered: question.key, next: followUp.key };
  }

  lead.finalizingAt = new Date().toISOString();
  await saveSession(chatId, lead);
  const result = await finalizeLead(config, lead);
  await clearSession(chatId);
  await sendMessage(config, chatId, `${formatLeadSummary(lead, result.scoring)}\n\n${formatClientReply(result.scoring)}`, {
    remove_keyboard: true,
  });
  return { ok: true, completed: true, result };
}
