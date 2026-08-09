import { hasManager, hasTelegram } from "./config.mjs";

async function telegramRequest(config, method, payload) {
  if (!hasTelegram(config)) {
    return { ok: false, skipped: true, reason: "TELEGRAM_BOT_TOKEN is not configured" };
  }

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(`Telegram ${method} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

export async function sendMessage(config, chatId, text, replyMarkup) {
  return telegramRequest(config, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
  });
}

export async function notifyManager(config, text) {
  if (!hasManager(config)) {
    return { ok: false, skipped: true, reason: "ADMIN_CHAT_ID is not configured" };
  }
  return sendMessage(config, config.adminChatId, text);
}
