import { randomUUID } from "node:crypto";

const lower = (value) => String(value || "").toLowerCase();

export function scoreLead(lead) {
  const answers = lead.answers || {};
  let points = 0;
  const reasons = [];

  if (/within 7 days|this month/i.test(answers.start || "")) {
    points += 35;
    reasons.push("near start date");
  }

  if (/ready/i.test(answers.budget || "")) {
    points += 25;
    reasons.push("budget readiness");
  }

  if (/change career|improve current role/i.test(answers.goal || "")) {
    points += 15;
    reasons.push("clear learning goal");
  }

  if (/group|individual/i.test(answers.format || "")) {
    points += 10;
    reasons.push("format preference");
  }

  if (lead.contact && /@|[0-9]{7,}|.+@.+\..+/.test(lead.contact)) {
    points += 15;
    reasons.push("usable contact");
  }

  if (/just browsing|not sure yet|explore options/i.test(`${answers.budget || ""} ${answers.start || ""} ${answers.goal || ""}`)) {
    points -= 25;
    reasons.push("early-stage intent");
  }

  const score = points >= 70 ? "hot" : points >= 40 ? "warm" : "cold";
  const nextAction = {
    hot: "Contact urgently and offer available call slots.",
    warm: "Send fit questions today and clarify timing.",
    cold: "Add to nurture and send helpful intro material.",
  }[score];

  return {
    score,
    points: Math.max(0, Math.min(100, points)),
    reasons,
    nextAction,
    status: "new",
  };
}

export function normalizeLeadFromLanding(input = {}) {
  return {
    id: input.id || randomUUID(),
    createdAt: input.createdAt || new Date().toISOString(),
    name: String(input.name || "").trim(),
    school: String(input.school || "").trim(),
    contact: String(input.contact || "").trim(),
    source: input.source || "landing_form",
    need: String(input.need || "Lead qualification").trim(),
    telegramChatId: input.telegramChatId || null,
    answers: {
      goal: input.goal || "",
      level: input.level || "",
      start: input.start || "",
      format: input.format || "",
      budget: input.budget || "",
      contactTime: input.contactTime || "",
    },
  };
}

export function validateLandingLead(input = {}) {
  const errors = [];
  const name = String(input.name || "").trim();
  const school = String(input.school || "").trim();
  const contact = String(input.contact || "").trim();
  const normalizedContact = contact.replace(/\s/g, "");

  if (name.length < 2) errors.push("Name must be at least 2 characters.");
  if (/^(.)\1{2,}$/i.test(name.replace(/\s/g, ""))) errors.push("Name cannot be repeated characters.");
  if (school.length < 3) errors.push("School or project name must be at least 3 characters.");
  if (/test|asdf|qwerty|12345/i.test(school)) errors.push("School or project name looks like placeholder text.");

  const telegram = /^@[a-z0-9_]{5,32}$/i.test(normalizedContact);
  const phone = /^\+?[0-9()\-]{7,18}$/.test(normalizedContact);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  if (!telegram && !phone && !email) errors.push("Contact must be a Telegram username, phone, or email.");

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function inferNeedQuestion(need) {
  const value = lower(need);
  if (value.includes("crm")) return "How should CRM and follow-up be organized?";
  if (value.includes("alert")) return "Which leads should trigger manager alerts?";
  return "What questions should the qualification bot ask first?";
}
