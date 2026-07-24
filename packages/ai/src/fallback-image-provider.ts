import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";

/**
 * Runs several image engines as a priority chain: it tries the first engine,
 * and only falls back to the next if that one errors (after a short retry).
 * This gives best-available quality with never-fails reliability — a transient
 * network blip or a hit rate-limit on one engine simply rolls to the next.
 */
export class FallbackImageProvider implements ImageProvider {
  readonly name: string;
  private readonly providers: ImageProvider[];
  private readonly attemptsPerProvider: number;

  constructor(providers: ImageProvider[], attemptsPerProvider = 2) {
    if (providers.length === 0) {
      throw new Error("FallbackImageProvider needs at least one provider.");
    }
    this.providers = providers;
    this.attemptsPerProvider = attemptsPerProvider;
    this.name = providers.map((p) => p.name).join("→");
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const failures: string[] = [];

    for (const provider of this.providers) {
      for (let attempt = 1; attempt <= this.attemptsPerProvider; attempt++) {
        try {
          const image = await provider.generate(request);
          if (failures.length) {
            console.log(`  image: recovered via "${provider.name}" after ${failures.length} failed attempt(s)`);
          }
          return image;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${provider.name} (try ${attempt}): ${message}`);
          // Surface why an engine fell back, instead of hiding it.
          console.log(`  image: "${provider.name}" failed (try ${attempt}) → ${message}`);
          if (attempt < this.attemptsPerProvider) {
            await sleep(1500);
          }
        }
      }
    }

    throw new Error(`all image engines failed → ${failures.join(" | ")}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
