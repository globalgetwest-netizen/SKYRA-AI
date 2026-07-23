import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Google Gemini image generation (via the Generative Language REST API).
 * Included in Gemini's free tier. The image model id changes as Google ships
 * newer versions — override with SKYRA_IMAGE_MODEL if the default is retired.
 *
 * Get a key: https://aistudio.google.com/apikey
 */
export class GeminiImageProvider implements ImageProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = "gemini-2.0-flash-preview-image-generation") {
    if (!apiKey) {
      throw new Error("Gemini API key is required for GeminiImageProvider.");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const prompt = request.negativePrompt
      ? `${request.prompt}. Avoid: ${request.negativePrompt}`
      : request.prompt;

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    };

    const res = await fetch(
      `${API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini image error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as GeminiImageResponse;
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((p) => p.inlineData?.data)?.inlineData;

    if (!inline?.data) {
      throw new Error("Gemini returned no image data.");
    }

    const ext = inline.mimeType?.includes("jpeg") ? "jpg" : "png";
    return {
      bytes: Uint8Array.from(Buffer.from(inline.data, "base64")),
      ext,
      seed: request.seed,
      provider: this.name,
    };
  }
}

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
    };
  }>;
}
