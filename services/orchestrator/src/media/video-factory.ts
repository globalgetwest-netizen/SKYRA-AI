import {
  HttpVideoProvider,
  ReplicateVideoProvider,
  type VideoProvider,
} from "@skyra/ai";

/**
 * Resolve the configured video engine from the environment.
 *
 *   SKYRA_VIDEO_PROVIDER = none | http | replicate   (default: none)
 *
 * - `none`      → video generation is skipped (images only).
 * - `http`      → FREE: your own/Colab GPU running an open model (LTX-Video),
 *                 pointed to by SKYRA_VIDEO_ENDPOINT. See colab/README.md.
 * - `replicate` → paid hosted video (Kling/Wan/LTX) via REPLICATE_API_TOKEN.
 *
 * Returns null when no video engine is configured, so the pipeline runs
 * images-only without error.
 */
export function getVideoProvider(): VideoProvider | null {
  const name = (process.env.SKYRA_VIDEO_PROVIDER ?? "none").toLowerCase();

  switch (name) {
    case "none":
    case "":
      return null;

    case "http":
    case "colab":
    case "local": {
      const endpoint = process.env.SKYRA_VIDEO_ENDPOINT;
      if (!endpoint) {
        throw new Error("SKYRA_VIDEO_PROVIDER=http but SKYRA_VIDEO_ENDPOINT is not set.");
      }
      return new HttpVideoProvider(endpoint);
    }

    case "replicate": {
      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) throw new Error("SKYRA_VIDEO_PROVIDER=replicate but REPLICATE_API_TOKEN is not set.");
      return new ReplicateVideoProvider(
        token,
        process.env.SKYRA_VIDEO_MODEL ?? "kwaivgi/kling-v1.6-standard",
      );
    }

    default:
      throw new Error(`Unknown SKYRA_VIDEO_PROVIDER: "${name}" (expected none | http | replicate).`);
  }
}
