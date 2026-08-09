import { spawnSync } from "node:child_process";

const files = [
  "scripts/dev-server.mjs",
  "apps/bot/src/bot.mjs",
  "apps/bot/src/config.mjs",
  "apps/bot/src/formatters.mjs",
  "apps/bot/src/http.mjs",
  "apps/bot/src/n8n.mjs",
  "apps/bot/src/questions.mjs",
  "apps/bot/src/rag.mjs",
  "apps/bot/src/scoring.mjs",
  "apps/bot/src/server.mjs",
  "apps/bot/src/simulate.mjs",
  "apps/bot/src/storage.mjs",
  "apps/bot/src/telegram.mjs",
  "apps/landing/script.js",
];

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Checked ${files.length} files.`);
}
