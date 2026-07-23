import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";

const REPLICATE_API = "https://api.replicate.com/v1";

/**
 * Replicate-backed image generation. Defaults to FLUX 1.1 [pro] — top-tier
 * photorealistic humans. One token (REPLICATE_API_TOKEN), pay-per-image.
 * Upgrade the model id freely as better ones ship; that is the whole point of
 * the provider abstraction.
 */
export class ReplicateImageProvider implements ImageProvider {
  readonly name = "replicate";
  private readonly token: string;
  private readonly model: string;

  constructor(token: string, model = "black-forest-labs/flux-1.1-pro") {
    if (!token) {
      throw new Error("REPLICATE_API_TOKEN is required for ReplicateImageProvider.");
    }
    this.token = token;
    this.model = model;
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio ?? "1:1",
      output_format: "png",
      safety_tolerance: 2,
    };
    if (request.seed !== undefined) input.seed = request.seed;

    const created = await this.post(`${REPLICATE_API}/models/${this.model}/predictions`, {
      input,
    });

    const prediction = await this.waitFor(created);
    const url = firstUrl(prediction.output);
    if (!url) {
      throw new Error(`Replicate returned no image output: ${JSON.stringify(prediction.output)}`);
    }

    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    return { bytes, ext: "png", seed: request.seed, provider: this.name };
  }

  private async post(url: string, body: unknown): Promise<ReplicatePrediction> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Replicate error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    return (await res.json()) as ReplicatePrediction;
  }

  private async waitFor(prediction: ReplicatePrediction): Promise<ReplicatePrediction> {
    let current = prediction;
    const getUrl = current.urls?.get;
    for (let i = 0; i < 120; i++) {
      if (["succeeded", "failed", "canceled"].includes(current.status)) break;
      if (!getUrl) break;
      await sleep(2000);
      const res = await fetch(getUrl, { headers: { Authorization: `Bearer ${this.token}` } });
      current = (await res.json()) as ReplicatePrediction;
    }
    if (current.status !== "succeeded") {
      throw new Error(`Replicate prediction ${current.status}: ${current.error ?? "unknown error"}`);
    }
    return current;
  }
}

interface ReplicatePrediction {
  status: string;
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get?: string };
}

function firstUrl(output: ReplicatePrediction["output"]): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.find((u) => typeof u === "string") ?? null;
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
