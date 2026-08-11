import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "../../..");
const storageDir = resolve(currentDir, "../storage");
const sessionsPath = resolve(storageDir, "sessions.json");
const crmJsonPath = resolve(rootDir, "crm/leads.local.json");
const crmCsvPath = resolve(rootDir, "crm/leads.local.csv");

async function ensureStorage() {
  await mkdir(storageDir, { recursive: true });
  await mkdir(resolve(rootDir, "crm"), { recursive: true });
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await ensureStorage();
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function getSession(chatId) {
  const sessions = await readJson(sessionsPath, {});
  return sessions[String(chatId)] || null;
}

export async function saveSession(chatId, session) {
  const sessions = await readJson(sessionsPath, {});
  sessions[String(chatId)] = session;
  await writeJson(sessionsPath, sessions);
}

export async function clearSession(chatId) {
  const sessions = await readJson(sessionsPath, {});
  delete sessions[String(chatId)];
  await writeJson(sessionsPath, sessions);
}

export async function listLeads(limit = 100) {
  const leads = await readJson(crmJsonPath, []);
  return leads.slice(0, limit);
}

export function buildLeadStats(leads = []) {
  const initialScores = { pending: 0, hot: 0, warm: 0, cold: 0 };
  const initialEvents = { "lead.created": 0, "lead.qualified": 0 };
  const initialFollowUps = {};

  const stats = leads.reduce(
    (acc, lead) => {
      const score = lead.score || "pending";
      const event = lead.event || "lead.qualified";
      const followUp = lead.followUp || lead.routing?.followUp || "unrouted";

      acc.total += 1;
      acc.scores[score] = (acc.scores[score] || 0) + 1;
      acc.events[event] = (acc.events[event] || 0) + 1;
      acc.followUps[followUp] = (acc.followUps[followUp] || 0) + 1;
      if (lead.status === "intake") acc.openIntake += 1;
      if (event === "lead.qualified") acc.qualified += 1;
      return acc;
    },
    {
      total: 0,
      qualified: 0,
      openIntake: 0,
      scores: { ...initialScores },
      events: { ...initialEvents },
      followUps: { ...initialFollowUps },
    },
  );

  return {
    ...stats,
    latest: leads.slice(0, 8),
  };
}

const csv = (value) => `"${String(value || "").replace(/"/g, '""')}"`;
const crmHeader =
  "event,eventId,emittedAt,createdAt,qualifiedAt,name,school,contact,need,goal,level,start,format,budget,contactTime,score,points,status,nextAction,source,managerAlert,followUp,ragSources\n";

export async function appendLead(lead, scoring, meta = {}) {
  await ensureStorage();
  const current = await readJson(crmJsonPath, []);
  const routing = meta.routing || {};
  const row = {
    ...lead,
    event: meta.event || "lead.qualified",
    eventId: meta.eventId || "",
    emittedAt: meta.emittedAt || "",
    score: scoring.score,
    points: scoring.points,
    status: scoring.status,
    nextAction: scoring.nextAction,
    reasons: scoring.reasons,
    routing,
    followUp: routing.followUp || "",
    managerAlert: routing.managerAlert || "",
    ragSources: meta.ragSources || [],
    qualifiedAt: meta.qualifiedAt || "",
  };
  current.unshift(row);
  await writeJson(crmJsonPath, current);

  const answers = lead.answers || {};
  const line = [
    row.event,
    row.eventId,
    row.emittedAt,
    lead.createdAt,
    row.qualifiedAt,
    lead.name,
    lead.school,
    lead.contact,
    lead.need,
    answers.goal,
    answers.level,
    answers.start,
    answers.format,
    answers.budget,
    answers.contactTime,
    scoring.score,
    scoring.points,
    scoring.status,
    scoring.nextAction,
    lead.source,
    row.managerAlert,
    row.followUp,
    row.ragSources.join("|"),
  ]
    .map(csv)
    .join(",");

  const existingCsv = await readFile(crmCsvPath, "utf8").catch(() => "");
  const hasCurrentHeader = existingCsv.includes(crmHeader.trim());
  await appendFile(crmCsvPath, `${hasCurrentHeader ? "" : crmHeader}${line}\n`, "utf8");
  return row;
}
