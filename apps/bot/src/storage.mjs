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

const csv = (value) => `"${String(value || "").replace(/"/g, '""')}"`;

export async function appendLead(lead, scoring) {
  await ensureStorage();
  const current = await readJson(crmJsonPath, []);
  const row = {
    ...lead,
    score: scoring.score,
    points: scoring.points,
    status: scoring.status,
    nextAction: scoring.nextAction,
    reasons: scoring.reasons,
  };
  current.unshift(row);
  await writeJson(crmJsonPath, current);

  const answers = lead.answers || {};
  const header =
    "createdAt,name,school,contact,need,goal,level,start,format,budget,contactTime,score,points,status,nextAction,source\n";
  const line = [
    lead.createdAt,
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
  ]
    .map(csv)
    .join(",");

  const existingCsv = await readFile(crmCsvPath, "utf8").catch(() => "");
  await appendFile(crmCsvPath, `${existingCsv ? "" : header}${line}\n`, "utf8");
  return row;
}
