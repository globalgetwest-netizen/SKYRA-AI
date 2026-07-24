import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";
import { fetchWithRetry } from "./http-retry.js";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Imagen supports a fixed set of aspect ratios; map ours to the closest.
const IMAGEN_ASPECT: Record<string, string> = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
  "4:3": "4:3",
  "4:5": "3:4",
};

/**
 * Google Gemini / Imagen image generation (Generative Language REST API).
 *
 * Supports both model families your key exposes:
 *   - "imagen-*"  → Imagen 4 (Google's flagship photoreal engine) via :predict
 *   - "gemini-*-image" → Gemini native image via :generateContent
 *
 * Pick the model with SKYRA_GEMINI_MODEL, e.g.
 *   gemini-2.5-flash-image          (fast, free-tier friendly)
 *   imagen-4.0-generate-001         (high quality)
 *   imagen-4.0-ultra-generate-001   (maximum quality)
 *
 * Get a key: https://aistudio.google.com/apikey
 */
export class GeminiImageProvider implements ImageProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = "gemini-2.5-flash-image") {
    if (!apiKey) {
      throw new Error("Gemini API key is required for GeminiImageProvider.");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    return this.model.startsWith("imagen")
      ? this.generateImagen(request)
      : this.generateGemini(request);
  }

  /** Imagen 4 family — the :predict endpoint. Highest photoreal quality. */
  private async generateImagen(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const prompt = request.negativePrompt
      ? `${request.prompt}. Avoid: ${request.negativePrompt}`
      : request.prompt;

    const body = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: IMAGEN_ASPECT[request.aspectRatio ?? "1:1"] ?? "1:1",
      },
    };

    const res = await fetchWithRetry(`${API_BASE}/models/${this.model}:predict?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Imagen error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as ImagenResponse;
    const pred = data.predictions?.[0];
    if (!pred?.bytesBase64Encoded) {
      throw new Error("Imagen returned no image data.");
    }

    const ext = pred.mimeType?.includes("jpeg") ? "jpg" : "png";
    return {
      bytes: Uint8Array.from(Buffer.from(pred.bytesBase64Encoded, "base64")),
      ext,
      seed: request.seed,
      provider: this.name,
    };
  }

  /** Gemini native image models — the :generateContent endpoint. */
  private async generateGemini(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const prompt = request.negativePrompt
      ? `${request.prompt}. Avoid: ${request.negativePrompt}`
      : request.prompt;

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    };

    const res = await fetchWithRetry(`${API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Gemini image error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as GeminiResponse;
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

interface ImagenResponse {
  predictions?: Array<{ mimeType?: string; bytesBase64Encoded?: string }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
  }>;
}
