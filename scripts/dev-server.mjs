import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { isAdminAuthenticated } from "../apps/bot/src/admin-auth.mjs";
import { getConfig } from "../apps/bot/src/config.mjs";
import { handleApiRequest } from "../apps/bot/src/http.mjs";

const root = resolve(import.meta.dirname, "..");
const port = Number.parseInt(process.env.PORT ?? "5173", 10);
const host = process.env.HOST ?? "127.0.0.1";
const apiConfig = getConfig();

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

const send = (response, status, body, headers = {}) => {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(body);
};

const server = createServer(async (request, response) => {
  if (request.url?.startsWith("/api/") || request.url === "/health") {
    const handled = await handleApiRequest(request, response, apiConfig);
    if (handled) return;
  }

  const url = new URL(request.url ?? "/", `http://${host}:${port}`);

  if (url.pathname === "/") {
    response.writeHead(302, { Location: "/apps/landing/" });
    response.end();
    return;
  }

  const publicAdminPaths = new Set([
    "/apps/admin/login.html",
    "/apps/admin/login.css",
    "/apps/admin/login.js",
    "/apps/admin/styles.css",
  ]);
  if (
    url.pathname.startsWith("/apps/admin") &&
    !publicAdminPaths.has(url.pathname) &&
    !isAdminAuthenticated(request, apiConfig)
  ) {
    response.writeHead(302, { Location: "/apps/admin/login.html" });
    response.end();
    return;
  }

  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = normalize(join(root, pathname));

  if (!requestedPath.startsWith(root)) {
    send(response, 403, "Forbidden");
    return;
  }

  let filePath = requestedPath;
  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        response.writeHead(302, { Location: `${url.pathname}/${url.search}` });
        response.end();
        return;
      }
      filePath = join(filePath, "index.html");
    }
  } catch {
    send(response, 404, "Not found");
    return;
  }

  try {
    const contentType = types.get(extname(filePath)) ?? "application/octet-stream";
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
    });
    createReadStream(filePath).pipe(response);
  } catch {
    send(response, 500, "Server error");
  }
});

server.listen(port, host, () => {
  console.log(`SkillBridge landing: http://${host}:${port}/apps/landing/`);
  console.log(`SkillBridge API: http://${host}:${port}/api/lead`);
});
