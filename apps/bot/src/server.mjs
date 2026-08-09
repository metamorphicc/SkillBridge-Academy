import { createServer } from "node:http";
import { getConfig } from "./config.mjs";
import { handleApiRequest, sendJson } from "./http.mjs";

const config = getConfig();

const server = createServer(async (request, response) => {
  const handled = await handleApiRequest(request, response, config);
  if (!handled) {
    sendJson(response, 404, {
      ok: false,
      error: "Not found",
      endpoints: ["GET /health", "POST /api/lead", "POST /api/telegram", "POST /api/rag"],
    });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`SkillBridge bot API: http://${config.host}:${config.port}`);
  console.log(`Telegram webhook endpoint: http://${config.host}:${config.port}/api/telegram`);
});
