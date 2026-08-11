import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value.replace(/\\n/g, "\n");
  }
}

export function getConfig() {
  loadLocalEnv();

  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    adminChatId: process.env.ADMIN_CHAT_ID || "",
    telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
    n8nLeadWebhookUrl: process.env.N8N_LEAD_WEBHOOK_URL || "",
    n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || "skillbridge-local-secret",
    n8nTimeoutMs: Number.parseInt(process.env.N8N_TIMEOUT_MS || "2500", 10),
    adminDashboardPassword: process.env.ADMIN_DASHBOARD_PASSWORD || "",
    adminSessionSecret: process.env.ADMIN_SESSION_SECRET || process.env.N8N_WEBHOOK_SECRET || "",
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
