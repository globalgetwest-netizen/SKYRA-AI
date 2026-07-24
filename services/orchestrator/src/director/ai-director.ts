import {
  ProductionPlanSchema,
  type ProductionPlan,
} from "../types/workflow.js";
import { AIProviderRouter } from "@skyra/ai/router";

/**
 * The SKYRA AI Director turns a plain-language creative brief into a complete,
 * schema-valid {@link ProductionPlan}: populated scenes, characters, camera
 * direction, lighting, and an audio plan.
 *
 * It uses a REAL AI model (Gemini or OpenAI): it asks the model for the plan as
 * JSON and validates the result against ProductionPlanSchema. There is no mock
 * fallback — if the model does not return a valid plan, it raises a clear
 * error so problems are visible, not hidden behind canned output.
 */
export class AIDirector {
  private readonly providerName: string;

  constructor(
    private readonly router: AIProviderRouter,
    providerName: string = process.env.SKYRA_AI_PROVIDER ?? "gemini",
  ) {
    this.providerName = providerName;
  }

  async createPlan(userRequest: string): Promise<ProductionPlan> {
    const response = await this.router.generate(
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userRequest },
        ],
        options: {
          model: process.env.SKYRA_AI_MODEL,
          temperature: 0.2,
          responseFormat: "json",
        },
      },
      this.providerName,
    );

    const plan = this.parsePlan(response.text);
    if (!plan) {
      throw new Error(
        `The "${this.providerName}" planner did not return a valid production plan. ` +
          `Raw response: ${response.text.slice(0, 400)}`,
      );
    }
    return plan;
  }

  /** Extract JSON from a model reply and validate it against the schema. */
  private parsePlan(text: string): ProductionPlan | null {
    const json = extractJsonObject(text);
    if (!json) return null;

    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      return null;
    }

    const result = ProductionPlanSchema.safeParse(data);
    return result.success ? result.data : null;
  }
}

/**
 * Pull a JSON object out of a model reply. Handles bare JSON, ```json fenced
 * blocks, and prose with an embedded object.
 */
function extractJsonObject(text: string): string | null {
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  return candidate.slice(start, end + 1);
}

const SYSTEM_PROMPT = `
You are SKYRA AI Director, the central intelligence that plans professional,
photorealistic AI video productions.

Transform the user's creative brief into a COMPLETE production plan and return
VALID JSON ONLY — no prose, no markdown, no code fences.

The JSON must match this shape exactly:
{
  "projectId": string,
  "projectType": one of ["advertisement","cinematic","avatar","social","story","educational","product-demo","documentary"],
  "title": string,
  "objective": string,
  "description": string,
  "targetAudience": string,
  "language": string,
  "durationSeconds": number > 0,
  "aspectRatios": array of ["16:9","9:16","1:1","4:5","4:3"],
  "visualStyle": string,
  "script": string,
  "characters": array of {
    "id": string, "name": string, "description": string, "appearance": string
  },
  "scenes": array of {
    "id": string, "order": positive integer, "durationSeconds": number > 0,
    "location": string, "description": string, "action": string,
    "visualPrompt": string,
    "cameraMovement": one of ["static","slow-pan","fast-pan","dolly-in","dolly-out","tracking","orbit","crane","handheld","drone","cinematic"],
    "cameraDirection": string, "lighting": string, "atmosphere": string,
    "characters": array of character ids, "soundEffects": array of strings,
    "requiresAvatar": boolean, "requiresVideoGeneration": boolean,
    "requiresImageGeneration": boolean, "requiresLipSync": boolean
  },
  "audio": {
    "voiceRequired": boolean, "language": string,
    "musicRequired": boolean, "soundEffectsRequired": boolean
  },
  "avatarRequired": boolean,
  "qualityLevel": one of ["standard","high","ultra","cinematic"],
  "status": "planned"
}

Prioritize photorealistic humans, realistic anatomy, consistent character
identity, cinematic camera work, professional lighting, and visual continuity.
Write rich, specific visualPrompt text for each scene. The scenes' durations
should sum to roughly durationSeconds.
`.trim();
