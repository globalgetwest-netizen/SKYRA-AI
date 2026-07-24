/**
 * Video generation abstraction — the moving-image counterpart to
 * {@link ImageProvider}. Any video engine implements this one interface:
 *   - HttpVideoProvider   → a self-hosted / free Colab GPU endpoint (LTX-Video)
 *   - ReplicateVideoProvider → paid hosted models (Kling, Wan, LTX)
 * so SKYRA can swap engines without touching the pipeline.
 */
export interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  /** "16:9" | "9:16" | "1:1" | ... — engines map to dimensions. */
  aspectRatio?: string;
  /** Desired clip length in seconds. */
  seconds?: number;
  /** Optional start frame for image-to-video (a URL or data URI). */
  imageUrl?: string;
  seed?: number;
}

export interface GeneratedVideo {
  /** Raw video bytes, ready to write to disk. */
  bytes: Uint8Array;
  /** File extension without the dot, e.g. "mp4". */
  ext: string;
  provider: string;
}

export interface VideoProvider {
  readonly name: string;
  generate(request: VideoGenerationRequest): Promise<GeneratedVideo>;
}
