import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "sb_admin_session";
const maxAgeSeconds = 60 * 60 * 8;

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    String(header)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function sessionSecret(config) {
  return String(config.adminSessionSecret || "");
}

export function isAdminPasswordValid(config, password) {
  const expected = String(config.adminDashboardPassword || "");
  const actual = String(password || "");
  if (!sessionSecret(config) || !expected || !actual || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export function createAdminCookie(config) {
  const payload = base64Url(
    JSON.stringify({
      role: "admin",
      exp: Date.now() + maxAgeSeconds * 1000,
    }),
  );
  const token = `${payload}.${sign(payload, sessionSecret(config))}`;
  return `${cookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearAdminCookie() {
  return `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export function isAdminAuthenticated(request, config) {
  const token = parseCookies(request.headers.cookie || "")[cookieName];
  if (!token || !token.includes(".")) return false;

  const [payload, signature] = token.split(".");
  const expected = sign(payload, sessionSecret(config));
  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.role === "admin" && Number(session.exp) > Date.now();
  } catch {
    return false;
  }
}
