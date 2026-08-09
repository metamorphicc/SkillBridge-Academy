import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const knowledgePath = resolve(currentDir, "../data/knowledge-base.json");

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}@+]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

let cachedDocuments = null;

export async function loadKnowledgeBase() {
  if (!cachedDocuments) {
    cachedDocuments = JSON.parse(await readFile(knowledgePath, "utf8"));
  }
  return cachedDocuments;
}

export async function retrieveContext(query, limit = 3) {
  const documents = await loadKnowledgeBase();
  const queryTokens = new Set(tokenize(query));

  return documents
    .map((document) => {
      const haystack = tokenize(`${document.title} ${document.tags.join(" ")} ${document.content}`);
      const score = haystack.reduce((sum, token) => sum + (queryTokens.has(token) ? 1 : 0), 0);
      return { ...document, score };
    })
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function answerWithRag(query) {
  const context = await retrieveContext(query);
  if (context.length === 0) {
    return {
      answer:
        "I do not have enough context for that yet. I can still qualify the lead: goal, level, start date, format, budget, and contact time.",
      sources: [],
    };
  }

  const bullets = context.map((item) => `- ${item.title}: ${item.content}`).join("\n");
  return {
    answer: `Based on the school knowledge base:\n${bullets}`,
    sources: context.map((item) => item.id),
  };
}
