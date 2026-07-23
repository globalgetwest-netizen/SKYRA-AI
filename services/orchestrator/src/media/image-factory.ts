import {
  MockImageProvider,
  OpenAIImageProvider,
  ReplicateImageProvider,
  HuggingFaceImageProvider,
  GeminiImageProvider,
  PollinationsImageProvider,
  FallbackImageProvider,
  type ImageProvider,
} from "@skyra/ai";

/**
 * Resolve the configured image engine(s) from the environment.
 *
 *   SKYRA_IMAGE_PROVIDER = one name, or a comma-separated fallback chain.
 *   Names: mock | pollinations | huggingface | gemini | openai | replicate
 *   (default: mock)
 *
 * A chain like "gemini,huggingface,pollinations" tries each in order and falls
 * back to the next if one fails — best quality first, guaranteed to land on a
 * working engine. Engines whose keys are missing are skipped automatically, so
 * a chain still works with only the keys you have.
 *
 * `mock` writes placeholder images (no key). `pollinations` is a real engine
 * that needs NO key. `huggingface`/`gemini` are near-free with a free key;
 * `openai`/`replicate` are paid.
 */
export function getImageProvider(): ImageProvider {
  const raw = process.env.SKYRA_IMAGE_PROVIDER ?? "mock";
  const names = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const built: ImageProvider[] = [];
  const skipped: string[] = [];
  // A global SKYRA_IMAGE_MODEL only makes sense for a single engine; in a chain
  // each engine uses its own dedicated override (SKYRA_GEMINI_MODEL, etc.).
  const single = names.length === 1;

  for (const name of names) {
    try {
      built.push(buildProvider(name, single));
    } catch (error) {
      skipped.push(`${name} (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  if (skipped.length) {
    console.log(`[image] skipping unavailable engine(s): ${skipped.join("; ")}`);
  }
  if (built.length === 0) {
    throw new Error(`No usable image engine from SKYRA_IMAGE_PROVIDER="${raw}". ${skipped.join("; ")}`);
  }

  return built.length === 1 ? built[0] : new FallbackImageProvider(built);
}

function buildProvider(name: string, single: boolean): ImageProvider {
  // Global override applies only when a single engine is configured.
  const global = single ? process.env.SKYRA_IMAGE_MODEL : undefined;

  switch (name) {
    case "mock":
      return new MockImageProvider();

    case "pollinations":
      return new PollinationsImageProvider(
        process.env.SKYRA_POLLINATIONS_MODEL ?? global ?? "flux",
      );

    case "huggingface":
    case "hf": {
      const token = process.env.HUGGINGFACE_API_TOKEN ?? process.env.HF_TOKEN;
      if (!token) throw new Error("HUGGINGFACE_API_TOKEN not set");
      return new HuggingFaceImageProvider(
        token,
        process.env.SKYRA_HUGGINGFACE_MODEL ?? global ?? "black-forest-labs/FLUX.1-schnell",
      );
    }

    case "gemini": {
      const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY not set");
      return new GeminiImageProvider(
        key,
        process.env.SKYRA_GEMINI_MODEL ?? global ?? "gemini-2.5-flash-image",
      );
    }

    case "openai": {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("OPENAI_API_KEY not set");
      return new OpenAIImageProvider(
        key,
        process.env.SKYRA_OPENAI_MODEL ?? global ?? "gpt-image-1",
      );
    }

    case "replicate": {
      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) throw new Error("REPLICATE_API_TOKEN not set");
      return new ReplicateImageProvider(
        token,
        process.env.SKYRA_REPLICATE_MODEL ?? global ?? "black-forest-labs/flux-1.1-pro",
      );
    }

    default:
      throw new Error(
        `unknown engine "${name}" (expected mock | pollinations | huggingface | gemini | openai | replicate)`,
      );
  }
}
