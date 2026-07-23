import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";

const DIMENSIONS: Record<string, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [1024, 1024],
  "4:5": [864, 1080],
  "4:3": [1024, 768],
};

/**
 * Pollinations image provider — a genuinely free, no-API-key text-to-image
 * service (FLUX under the hood). The simplest possible path to a real
 * generated image: no account, no token, no cost. Great default for getting
 * started; swap to Hugging Face / Replicate for more control.
 */
export class PollinationsImageProvider implements ImageProvider {
  readonly name = "pollinations";
  private readonly model: string;

  constructor(model = "flux") {
    this.model = model;
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const [w, h] = DIMENSIONS[request.aspectRatio ?? "16:9"] ?? DIMENSIONS["16:9"];
    const seed = request.seed ?? Math.floor(Math.random() * 1_000_000);
    const prompt = request.negativePrompt
      ? `${request.prompt}. Avoid: ${request.negativePrompt}`
      : request.prompt;

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=${w}&height=${h}&seed=${seed}&model=${encodeURIComponent(this.model)}&nologo=true`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Pollinations error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Pollinations returned non-image response: ${(await res.text()).slice(0, 300)}`);
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    const ext = contentType.includes("png") ? "png" : "jpg";
    return { bytes, ext, seed, provider: this.name };
  }
}
