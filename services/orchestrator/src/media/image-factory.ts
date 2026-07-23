import {
  MockImageProvider,
  OpenAIImageProvider,
  ReplicateImageProvider,
  HuggingFaceImageProvider,
  GeminiImageProvider,
  type ImageProvider,
} from "@skyra/ai";

/**
 * Resolve the configured image engine from the environment.
 *
 *   SKYRA_IMAGE_PROVIDER = mock | huggingface | gemini | openai | replicate
 *                          (default: mock)
 *
 * `mock` needs no key and produces viewable placeholder images, so the full
 * pipeline runs at zero cost. `huggingface` (FLUX.1-schnell) and `gemini` are
 * the near-free real engines; `openai` and `replicate` are paid.
 */
export function getImageProvider(): ImageProvider {
  const name = (process.env.SKYRA_IMAGE_PROVIDER ?? "mock").toLowerCase();

  switch (name) {
    case "mock":
      return new MockImageProvider();

    case "huggingface":
    case "hf": {
      const token = process.env.HUGGINGFACE_API_TOKEN ?? process.env.HF_TOKEN;
      if (!token) throw new Error("SKYRA_IMAGE_PROVIDER=huggingface but HUGGINGFACE_API_TOKEN is not set.");
      return new HuggingFaceImageProvider(
        token,
        process.env.SKYRA_IMAGE_MODEL ?? "black-forest-labs/FLUX.1-schnell",
      );
    }

    case "gemini": {
      const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
      if (!key) throw new Error("SKYRA_IMAGE_PROVIDER=gemini but GEMINI_API_KEY is not set.");
      return new GeminiImageProvider(
        key,
        process.env.SKYRA_IMAGE_MODEL ?? "gemini-2.0-flash-preview-image-generation",
      );
    }

    case "openai": {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("SKYRA_IMAGE_PROVIDER=openai but OPENAI_API_KEY is not set.");
      return new OpenAIImageProvider(key, process.env.SKYRA_IMAGE_MODEL ?? "gpt-image-1");
    }

    case "replicate": {
      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) throw new Error("SKYRA_IMAGE_PROVIDER=replicate but REPLICATE_API_TOKEN is not set.");
      return new ReplicateImageProvider(
        token,
        process.env.SKYRA_IMAGE_MODEL ?? "black-forest-labs/flux-1.1-pro",
      );
    }

    default:
      throw new Error(
        `Unknown SKYRA_IMAGE_PROVIDER: "${name}" (expected mock | huggingface | gemini | openai | replicate).`,
      );
  }
}
