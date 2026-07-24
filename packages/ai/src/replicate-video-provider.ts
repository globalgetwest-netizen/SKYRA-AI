import type {
  GeneratedVideo,
  VideoGenerationRequest,
  VideoProvider,
} from "./video-provider.js";
import { fetchWithRetry } from "./http-retry.js";

const REPLICATE_API = "https://api.replicate.com/v1";

/**
 * Replicate-backed video generation (paid, high quality). Defaults to a Kling
 * model; swap via SKYRA_VIDEO_MODEL for Wan, LTX, etc. One token
 * (REPLICATE_API_TOKEN), pay-per-clip. This is the paid alternative to the free
 * self-hosted HttpVideoProvider.
 */
export class ReplicateVideoProvider implements VideoProvider {
  readonly name = "replicate";
  private readonly token: string;
  private readonly model: string;

  constructor(token: string, model = "kwaivgi/kling-v1.6-standard") {
    if (!token) {
      throw new Error("REPLICATE_API_TOKEN is required for ReplicateVideoProvider.");
    }
    this.token = token;
    this.model = model;
  }

  async generate(request: VideoGenerationRequest): Promise<GeneratedVideo> {
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio ?? "16:9",
      duration: Math.round(request.seconds ?? 5),
    };
    if (request.negativePrompt) input.negative_prompt = request.negativePrompt;
    if (request.imageUrl) input.start_image = request.imageUrl;

    const created = await this.post(`${REPLICATE_API}/models/${this.model}/predictions`, { input });
    const prediction = await this.waitFor(created);

    const url = firstUrl(prediction.output);
    if (!url) {
      throw new Error(`Replicate returned no video output: ${JSON.stringify(prediction.output)}`);
    }
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    return { bytes, ext: "mp4", provider: this.name };
  }

  private async post(url: string, body: unknown): Promise<ReplicatePrediction> {
    const res = await fetchWithRetry(url, {
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
    for (let i = 0; i < 180; i++) {
      if (["succeeded", "failed", "canceled"].includes(current.status)) break;
      if (!getUrl) break;
      await sleep(3000);
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
