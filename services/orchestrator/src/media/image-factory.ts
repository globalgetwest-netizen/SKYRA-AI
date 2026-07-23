import {
  MockImageProvider,
  OpenAIImageProvider,
  ReplicateImageProvider,
  type ImageProvider,
} from "@skyra/ai";

/**
 * Resolve the configured image engine from the environment.
 *
 *   SKYRA_IMAGE_PROVIDER = mock | openai | replicate   (default: mock)
 *
 * `mock` needs no key and produces viewable placeholder images, so the full
 * pipeline runs today at zero cost. `openai` and `replicate` produce real
 * photorealistic images when their keys are set.
 */
export function getImageProvider(): ImageProvider {
  const name = (process.env.SKYRA_IMAGE_PROVIDER ?? "mock").toLowerCase();

  switch (name) {
    case "mock":
      return new MockImageProvider();

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
      throw new Error(`Unknown SKYRA_IMAGE_PROVIDER: "${name}" (expected mock | openai | replicate).`);
  }
}
