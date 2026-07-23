import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";

/**
 * Hugging Face Inference image provider. Defaults to FLUX.1-schnell — a fast,
 * commercially-licensed (Apache-2.0) open model with a free inference tier, so
 * you can generate real photoreal-leaning stills at near-zero cost.
 *
 * Get a token (free): https://huggingface.co/settings/tokens
 * The API returns image bytes directly.
 */
export class HuggingFaceImageProvider implements ImageProvider {
  readonly name = "huggingface";
  private readonly token: string;
  private readonly model: string;

  constructor(token: string, model = "black-forest-labs/FLUX.1-schnell") {
    if (!token) {
      throw new Error("Hugging Face token is required for HuggingFaceImageProvider.");
    }
    this.token = token;
    this.model = model;
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const prompt = request.negativePrompt
      ? `${request.prompt}. Avoid: ${request.negativePrompt}`
      : request.prompt;

    const body = {
      inputs: prompt,
      parameters: {
        ...(request.seed !== undefined ? { seed: request.seed } : {}),
      },
    };

    // The model may be cold; retry a few times while it loads (HTTP 503).
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(`https://router.huggingface.co/hf-inference/models/${this.model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 503) {
        await sleep(4000);
        continue;
      }
      if (!res.ok) {
        throw new Error(`Hugging Face error ${res.status}: ${(await res.text()).slice(0, 300)}`);
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) {
        throw new Error(`Hugging Face returned non-image response: ${(await res.text()).slice(0, 300)}`);
      }

      const bytes = new Uint8Array(await res.arrayBuffer());
      const ext = contentType.includes("jpeg") ? "jpg" : "png";
      return { bytes, ext, seed: request.seed, provider: this.name };
    }

    throw new Error("Hugging Face model did not become ready after several attempts.");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
