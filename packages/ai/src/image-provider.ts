/**
 * Image generation abstraction — the media counterpart to {@link AIProvider}.
 *
 * Any still-image engine (mock, OpenAI images, Replicate/Flux, fal, Stability,
 * or a self-hosted model) implements this one interface, so SKYRA can chase the
 * best photoreal quality by swapping engines, never by rewriting the pipeline.
 */
export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  /** "16:9" | "9:16" | "1:1" | "4:5" | "4:3" — engines map this to dimensions. */
  aspectRatio?: string;
  seed?: number;
}

export interface GeneratedImage {
  /** Raw image bytes, ready to write to disk. */
  bytes: Uint8Array;
  /** File extension without the dot, e.g. "png" | "webp" | "svg". */
  ext: string;
  seed?: number;
  provider: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(request: ImageGenerationRequest): Promise<GeneratedImage>;
}
