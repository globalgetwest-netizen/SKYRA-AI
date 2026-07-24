import type {
  GeneratedVideo,
  VideoGenerationRequest,
  VideoProvider,
} from "./video-provider.js";

/**
 * Calls a self-hosted video endpoint — the FREE path. You run an open video
 * model (e.g. LTX-Video) on a free Google Colab GPU (or your own GPU) that
 * exposes this simple contract, and point SKYRA at its URL via
 * SKYRA_VIDEO_ENDPOINT. SKYRA is decoupled from the model: any server that
 * honors the contract works.
 *
 * Contract — POST <endpoint> with JSON:
 *   { "prompt", "seconds", "aspect_ratio", "negative_prompt", "image_url" }
 * Response, any of:
 *   - binary body with Content-Type: video/mp4
 *   - JSON { "video_base64": "..." }
 *   - JSON { "video_url": "https://..." }
 */
export class HttpVideoProvider implements VideoProvider {
  readonly name = "http";
  private readonly endpoint: string;

  constructor(endpoint: string) {
    if (!endpoint) {
      throw new Error("SKYRA_VIDEO_ENDPOINT is required for the http video provider.");
    }
    this.endpoint = endpoint;
  }

  async generate(request: VideoGenerationRequest): Promise<GeneratedVideo> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt,
        aspect_ratio: request.aspectRatio ?? "16:9",
        seconds: request.seconds ?? 5,
        image_url: request.imageUrl,
        seed: request.seed,
      }),
      // Video generation is slow; allow a long time (10 min).
      signal: AbortSignal.timeout(600_000),
    });

    if (!res.ok) {
      throw new Error(`Video endpoint error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.startsWith("video/")) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      return { bytes, ext: "mp4", provider: this.name };
    }

    const data = (await res.json()) as { video_base64?: string; video_url?: string };
    if (data.video_base64) {
      return { bytes: Uint8Array.from(Buffer.from(data.video_base64, "base64")), ext: "mp4", provider: this.name };
    }
    if (data.video_url) {
      const bytes = new Uint8Array(await (await fetch(data.video_url)).arrayBuffer());
      return { bytes, ext: "mp4", provider: this.name };
    }

    throw new Error("Video endpoint returned neither video bytes, video_base64, nor video_url.");
  }
}
