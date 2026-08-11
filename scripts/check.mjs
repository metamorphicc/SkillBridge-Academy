import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = [
  "scripts/dev-server.mjs",
  "apps/bot/src/admin-auth.mjs",
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
  "apps/admin/login.js",
  "apps/admin/script.js",
];

const jsonFiles = [
  "automations/n8n/lead-created.contract.json",
  "automations/n8n/lead-qualified.contract.json",
  "automations/n8n/workflow.production.json",
  "automations/n8n/workflow.stub.json",
];

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

for (const file of jsonFiles) {
  try {
    const json = JSON.parse(readFileSync(file, "utf8"));
    if (file.endsWith("workflow.production.json")) {
      for (const node of json.nodes || []) {
        const jsCode = node.parameters?.jsCode;
        if (jsCode) {
          new Function("$json", "$headers", "$env", "$getWorkflowStaticData", jsCode);
        }
      }
    }
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Checked ${files.length} JS files and ${jsonFiles.length} JSON files.`);
}
