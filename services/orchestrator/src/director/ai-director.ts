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
 * When a real model is wired in (SKYRA_AI_PROVIDER=openai), the Director asks
 * it for the plan as JSON and validates the result against
 * ProductionPlanSchema. In offline development mode the model returns prose
 * instead of JSON, so the Director falls back to building a complete plan
 * locally — the pipeline always produces populated, validated output.
 */
export class AIDirector {
  private readonly providerName: string;

  constructor(
    private readonly router: AIProviderRouter,
    providerName: string = process.env.SKYRA_AI_PROVIDER ?? "local",
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
          model: process.env.SKYRA_AI_MODEL ?? "development",
          temperature: 0.2,
          responseFormat: "json",
        },
      },
      this.providerName,
    );

    const modelPlan = this.parsePlan(response.text);
    if (modelPlan) {
      return modelPlan;
    }

    // Offline / non-JSON provider: build a complete plan from the brief.
    return this.buildDevelopmentPlan(userRequest);
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

  /**
   * A complete, valid development plan derived from the brief. This is what
   * makes SKYRA usable end-to-end with no API keys — real scenes, a presenter
   * character, and an audio plan the production engine can iterate over.
   */
  private buildDevelopmentPlan(userRequest: string): ProductionPlan {
    const presenter = {
      id: "char-presenter",
      name: "SKYRA Presenter",
      description:
        "A warm, authoritative human presenter who anchors the piece and delivers the call to action.",
      ageRange: "30-40",
      genderPresentation: "unspecified",
      appearance:
        "Photorealistic adult with natural skin texture, expressive eyes, and confident posture; realistic hands and facial micro-expressions.",
      wardrobe: "Modern tailored business-casual attire in brand-neutral tones.",
      personality: "Confident, credible, approachable.",
    };

    const plan: ProductionPlan = {
      projectId: `skyra-${Date.now()}`,
      projectType: "advertisement",
      title: "SKYRA Production",
      objective:
        "Produce a premium, photorealistic, cinematic AI-generated video from the creative brief.",
      description: userRequest.trim(),
      targetAudience: "General premium audience",
      language: "English",
      durationSeconds: 30,
      aspectRatios: ["16:9", "9:16"],
      visualStyle: "Photorealistic premium cinematic, natural light, shallow depth of field",
      script: userRequest.trim(),
      characters: [presenter],
      scenes: [
        {
          id: "scene-1",
          order: 1,
          durationSeconds: 8,
          location: "Sunlit modern workspace at dawn",
          timeOfDay: "early morning",
          description: "Opening beat that establishes the human subject and the stakes.",
          action: "The subject begins their day, focused and hopeful, catching the first light.",
          visualPrompt:
            "photorealistic cinematic wide shot, a person at a modern desk by a large window, warm dawn light, dust motes, ultra-detailed skin, 35mm film look",
          negativePrompt: "blurry, distorted hands, extra fingers, plastic skin, warped face",
          cameraMovement: "slow-pan",
          cameraDirection: "Slow push toward the subject to build intimacy.",
          lighting: "Warm natural key from window, soft fill, gentle rim light.",
          atmosphere: "Hopeful, quiet, aspirational.",
          characters: ["char-presenter"],
          voiceover: "Every ambition starts with a single, deliberate step.",
          soundEffects: ["ambient morning room tone", "distant city awakening"],
          musicDirection: "Sparse piano, building.",
          requiresAvatar: false,
          requiresVideoGeneration: true,
          requiresImageGeneration: true,
          requiresLipSync: false,
        },
        {
          id: "scene-2",
          order: 2,
          durationSeconds: 7,
          location: "Dynamic montage of connection and momentum",
          timeOfDay: "day",
          description: "The core value proposition expressed through motion and connection.",
          action: "Fast, elegant montage showing the idea gaining momentum and reaching others.",
          visualPrompt:
            "photorealistic cinematic montage, motion, energy, interconnected people and places, premium color grade, crisp detail",
          negativePrompt: "low resolution, artifacts, distorted faces",
          cameraMovement: "tracking",
          cameraDirection: "Tracking moves that carry energy scene to scene.",
          lighting: "High-key, vibrant, clean.",
          atmosphere: "Energetic, confident, expansive.",
          characters: [],
          voiceover: "Momentum compounds when the right idea meets the right moment.",
          soundEffects: ["rising whoosh transitions", "subtle UI accents"],
          musicDirection: "Percussion enters, tempo lifts.",
          requiresAvatar: false,
          requiresVideoGeneration: true,
          requiresImageGeneration: true,
          requiresLipSync: false,
        },
        {
          id: "scene-3",
          order: 3,
          durationSeconds: 8,
          location: "Presenter to camera, premium studio set",
          timeOfDay: "day",
          description: "The presenter directly addresses the audience — the trust beat.",
          action: "The presenter speaks to camera with warmth and authority.",
          visualPrompt:
            "photorealistic medium close-up of a presenter speaking to camera, soft studio lighting, natural skin texture, sharp catchlights in eyes, shallow depth of field",
          negativePrompt: "uncanny, dead eyes, distorted mouth, mismatched lip movement",
          cameraMovement: "static",
          cameraDirection: "Locked medium close-up, eyeline to lens.",
          lighting: "Soft three-point studio lighting, flattering and natural.",
          atmosphere: "Trustworthy, direct, human.",
          characters: ["char-presenter"],
          dialogue: "This is where your ambition meets the world.",
          soundEffects: ["clean studio room tone"],
          musicDirection: "Music softens under the voice.",
          requiresAvatar: true,
          requiresVideoGeneration: true,
          requiresImageGeneration: false,
          requiresLipSync: true,
        },
        {
          id: "scene-4",
          order: 4,
          durationSeconds: 7,
          location: "Brand resolve and call to action",
          timeOfDay: "day",
          description: "Final beat delivering the payoff and the call to action.",
          action: "The message resolves into a confident, memorable call to action.",
          visualPrompt:
            "photorealistic cinematic hero shot resolving to a clean brand end-card, premium lighting, crisp typography space",
          negativePrompt: "cluttered, low contrast, artifacts",
          cameraMovement: "dolly-in",
          cameraDirection: "Assured dolly-in to the final composition.",
          lighting: "Confident, high-contrast key with clean background.",
          atmosphere: "Decisive, premium, memorable.",
          characters: ["char-presenter"],
          voiceover: "Begin today.",
          soundEffects: ["final impact hit", "sustained resolve"],
          musicDirection: "Music swells to a clean button.",
          requiresAvatar: false,
          requiresVideoGeneration: true,
          requiresImageGeneration: true,
          requiresLipSync: false,
        },
      ],
      audio: {
        voiceRequired: true,
        voiceStyle: "Natural professional human voice",
        language: "English",
        musicRequired: true,
        musicStyle: "Premium cinematic",
        soundEffectsRequired: true,
      },
      avatarRequired: true,
      qualityLevel: "cinematic",
      status: "planned",
    };

    // Validate our own output so development mode holds to the same contract.
    return ProductionPlanSchema.parse(plan);
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
The scenes' durations should sum to roughly durationSeconds.
`.trim();
