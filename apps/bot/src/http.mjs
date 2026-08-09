import { getConfig } from "./config.mjs";
import { createLeadFromLanding, handleTelegramUpdate } from "./bot.mjs";
import { answerWithRag } from "./rag.mjs";

export async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function sendJson(response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  response.end(JSON.stringify(body, null, 2));
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-SkillBridge-Secret",
  };
}

export async function handleApiRequest(request, response, config = getConfig()) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {}, corsHeaders());
    return true;
  }

  if (url.pathname === "/health" || url.pathname === "/api/health") {
    sendJson(
      response,
      200,
      {
        ok: true,
        service: "skillbridge-bot",
        telegramConfigured: Boolean(config.botToken),
        n8nConfigured: Boolean(config.n8nLeadWebhookUrl),
      },
      corsHeaders(),
    );
    return true;
  }

  if (url.pathname === "/api/lead" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const result = await createLeadFromLanding(config, { ...body, source: body.source || "landing_form" });
      sendJson(response, result.status || 200, result, corsHeaders());
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message }, corsHeaders());
    }
    return true;
  }

  if (url.pathname === "/api/telegram" && request.method === "POST") {
    try {
      const telegramSecret = request.headers["x-telegram-bot-api-secret-token"];
      if (config.telegramWebhookSecret && telegramSecret !== config.telegramWebhookSecret) {
        sendJson(response, 401, { ok: false, error: "Invalid Telegram webhook secret." }, corsHeaders());
        return true;
      }

      const update = await readJsonBody(request);
      const result = await handleTelegramUpdate(config, update);
      sendJson(response, 200, result, corsHeaders());
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message }, corsHeaders());
    }
    return true;
  }

  if (url.pathname === "/api/rag" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const result = await answerWithRag(body.query || "");
      sendJson(response, 200, { ok: true, ...result }, corsHeaders());
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message }, corsHeaders());
    }
    return true;
  }

  return false;
}
