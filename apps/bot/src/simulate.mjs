import { getConfig } from "./config.mjs";
import { handleTelegramUpdate } from "./bot.mjs";

const config = {
  ...getConfig(),
  botToken: "",
  adminChatId: "",
  n8nLeadWebhookUrl: "",
};
const chat = {
  id: 10001,
  first_name: "Anna",
  username: "anna_demo",
};

const updates = [
  "/reset",
  "/start",
  "random text",
  "Change career",
  "Beginner",
  "Within 7 days",
  "Group",
  "Ready to discuss",
  "Today",
  "/ask what should warm leads receive?",
];

for (const text of updates) {
  const result = await handleTelegramUpdate(config, {
    message: {
      text,
      chat: { id: chat.id },
      from: chat,
    },
  });
  console.log(text, JSON.stringify(result, null, 2));
}
