export function getConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    adminChatId: process.env.ADMIN_CHAT_ID || "",
    telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
    n8nLeadWebhookUrl: process.env.N8N_LEAD_WEBHOOK_URL || "",
    n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || "skillbridge-local-secret",
    publicSiteUrl: process.env.PUBLIC_SITE_URL || "http://127.0.0.1:5173/apps/landing/",
    port: Number.parseInt(process.env.BOT_PORT || "8787", 10),
    host: process.env.BOT_HOST || "127.0.0.1",
  };
}

export function hasTelegram(config = getConfig()) {
  return Boolean(config.botToken && config.botToken !== "replace_me");
}

export function hasManager(config = getConfig()) {
  return Boolean(config.adminChatId && config.adminChatId !== "replace_me");
}
