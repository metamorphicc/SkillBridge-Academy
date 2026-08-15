import { getConfig } from "./config.mjs";
import { clearAdminCookie, createAdminCookie, isAdminAuthenticated, isAdminPasswordValid } from "./admin-auth.mjs";
import { createLeadFromLanding, handleTelegramUpdate, qualifyLeadFromWeb } from "./bot.mjs";
import { answerWithRag } from "./rag.mjs";
import { buildLeadStats, listLeads, updateLead } from "./storage.mjs";

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

function sendWithCookie(response, status, body, cookie, extraHeaders = {}) {
  sendJson(response, status, body, {
    ...extraHeaders,
    "Set-Cookie": cookie,
  });
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

  if (url.pathname === "/api/admin/session" && request.method === "GET") {
    sendJson(response, 200, { ok: true, authenticated: isAdminAuthenticated(request, config) }, corsHeaders());
    return true;
  }

  if (url.pathname === "/api/admin/login" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      if (!isAdminPasswordValid(config, body.password)) {
        sendJson(response, 401, { ok: false, error: "Invalid admin password." }, corsHeaders());
        return true;
      }
      sendWithCookie(response, 200, { ok: true }, createAdminCookie(config), corsHeaders());
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message }, corsHeaders());
    }
    return true;
  }

  if (url.pathname === "/api/admin/logout" && request.method === "POST") {
    sendWithCookie(response, 200, { ok: true }, clearAdminCookie(), corsHeaders());
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

  if (url.pathname === "/api/lead/qualify" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const result = await qualifyLeadFromWeb(config, { ...body, source: body.source || "web_qualification" });
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

  if (url.pathname === "/api/leads" && request.method === "GET") {
    try {
      if (!isAdminAuthenticated(request, config)) {
        sendJson(response, 401, { ok: false, error: "Admin login required." }, corsHeaders());
        return true;
      }
      const limit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
      const leads = await listLeads(Number.isFinite(limit) ? limit : 100);
      sendJson(response, 200, { ok: true, stats: buildLeadStats(leads), leads }, corsHeaders());
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message }, corsHeaders());
    }
    return true;
  }

  if (url.pathname.startsWith("/api/leads/") && request.method === "PATCH") {
    try {
      if (!isAdminAuthenticated(request, config)) {
        sendJson(response, 401, { ok: false, error: "Admin login required." }, corsHeaders());
        return true;
      }
      const id = decodeURIComponent(url.pathname.replace("/api/leads/", ""));
      const body = await readJsonBody(request);
      const allowedStatuses = new Set(["new", "needs_qualification", "contacted", "no_answer", "won", "lost", "nurture"]);
      if (body.pipelineStatus && !allowedStatuses.has(body.pipelineStatus)) {
        sendJson(response, 422, { ok: false, error: "Invalid lead status." }, corsHeaders());
        return true;
      }
      const lead = await updateLead(id, {
        pipelineStatus: body.pipelineStatus,
        owner: body.owner,
        managerNote: body.managerNote,
      });
      if (!lead) {
        sendJson(response, 404, { ok: false, error: "Lead not found." }, corsHeaders());
        return true;
      }
      const leads = await listLeads(200);
      sendJson(response, 200, { ok: true, lead, stats: buildLeadStats(leads) }, corsHeaders());
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message }, corsHeaders());
    }
    return true;
  }

  return false;
}
