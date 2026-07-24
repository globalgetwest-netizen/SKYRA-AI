import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import dotenv from "dotenv";

// Load .env from the repo root first (this service runs from its own workspace
// directory, so a plain dotenv/config would miss the root file), then fall back
// to any .env in the current working directory. dotenv never overrides a value
// that is already set, so the root file wins.
const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, "../../../.env") });
dotenv.config();

import { AIProviderRouter } from "@skyra/ai/router";
import { OpenAIProvider } from "@skyra/ai/openai-provider";
import { GeminiProvider } from "@skyra/ai/gemini-provider";

import { AIDirector } from "./director/ai-director.js";
import { ProductionEngine } from "./workflows/production/production-engine.js";

// --- Wire up the REAL AI planners (no mock/development provider) ---------
const router = new AIProviderRouter();

const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
if (geminiKey) {
  router.register("gemini", new GeminiProvider(geminiKey, process.env.SKYRA_AI_MODEL ?? "gemini-2.0-flash"));
}
if (process.env.OPENAI_API_KEY) {
  router.register("openai", new OpenAIProvider(process.env.OPENAI_API_KEY));
}

// Choose the planner: explicit env, else whichever real key is present.
const aiProvider =
  process.env.SKYRA_AI_PROVIDER ??
  (geminiKey ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : undefined);

if (!aiProvider) {
  console.error(
    "\nNo AI planner configured. Set a real key:\n" +
      "  GEMINI_API_KEY=...   (free — https://aistudio.google.com/apikey)\n" +
      "  or OPENAI_API_KEY=...\n",
  );
  process.exit(1);
}

const director = new AIDirector(router, aiProvider);
const productionEngine = new ProductionEngine();

// --- Demo brief ----------------------------------------------------------
const userRequest = `
Create a 30-second premium cinematic advertisement for YUNEX.

YUNEX is a global economic and commerce ecosystem connecting African
businesses with international markets.

Show:
1. An African entrepreneur starting a business.
2. International trade.
3. Global commerce connecting Africa with the world.
4. A professional human presenter.
5. A powerful final call to action.

The video should be realistic, premium, cinematic and futuristic.
Target audience: African entrepreneurs and global businesses.
Language: English.
Create both 16:9 and 9:16 versions.
`.trim();

console.log("\n================================");
console.log("       SKYRA AI DIRECTOR");
console.log("================================\n");

try {
  const plan = await director.createPlan(userRequest);
  const productionResult = await productionEngine.execute(plan);

  console.log("\nSKYRA PRODUCTION PLAN\n");
  console.log(JSON.stringify(plan, null, 2));

  console.log("\nSKYRA PRODUCTION RESULT\n");
  console.log(JSON.stringify(productionResult, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nSKYRA AI ERROR: ${message}\n`);
  process.exitCode = 1;
}
