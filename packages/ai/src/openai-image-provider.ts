import OpenAI from "openai";

import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";

const SIZE: Record<string, "1024x1024" | "1536x1024" | "1024x1536"> = {
  "16:9": "1536x1024",
  "4:3": "1536x1024",
  "9:16": "1024x1536",
  "4:5": "1024x1536",
  "1:1": "1024x1024",
};

/**
 * OpenAI image generation (default model: gpt-image-1). Good, fast, and likely
 * the quickest path if you already hold an OpenAI key. For maximum photoreal
 * human quality, prefer the Replicate/Flux provider.
 */
export class OpenAIImageProvider implements ImageProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = "gpt-image-1") {
    if (!apiKey) {
      throw new Error("OpenAI API key is required for OpenAIImageProvider.");
    }
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const size = SIZE[request.aspectRatio ?? "1:1"] ?? "1024x1024";

    const response = await this.client.images.generate({
      model: this.model,
      prompt: request.prompt,
      size,
      n: 1,
    });

    const first = response.data?.[0];
    if (!first) {
      throw new Error("OpenAI returned no image data.");
    }

    if (first.b64_json) {
      return {
        bytes: base64ToBytes(first.b64_json),
        ext: "png",
        seed: request.seed,
        provider: this.name,
      };
    }

    if (first.url) {
      const bytes = new Uint8Array(await (await fetch(first.url)).arrayBuffer());
      return { bytes, ext: "png", seed: request.seed, provider: this.name };
    }

    throw new Error("OpenAI image response contained neither b64_json nor url.");
  }
}

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(b64, "base64"));
}
