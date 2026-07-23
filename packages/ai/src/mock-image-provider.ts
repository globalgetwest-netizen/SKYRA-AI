import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageProvider,
} from "./image-provider.js";

const DIMENSIONS: Record<string, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [1024, 1024],
  "4:5": [864, 1080],
  "4:3": [1024, 768],
};

/**
 * Zero-cost, zero-key image provider. It renders a real, viewable SVG that
 * embeds the prompt, so the whole production pipeline — plan → per-scene
 * generation → files on disk — is exercisable today with no account. Swap for
 * a real engine by setting SKYRA_IMAGE_PROVIDER.
 */
export class MockImageProvider implements ImageProvider {
  readonly name = "mock";

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const [w, h] = DIMENSIONS[request.aspectRatio ?? "16:9"] ?? DIMENSIONS["16:9"];
    const seed = request.seed ?? Math.floor(Math.random() * 1_000_000);
    const hue = seed % 360;
    const prompt = escapeXml(request.prompt).slice(0, 240);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 60% 30%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 60) % 360} 55% 12%)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="6%" y="14%" fill="#fff" font-family="sans-serif" font-size="${Math.round(w * 0.03)}" opacity="0.9">SKYRA · mock image</text>
  <foreignObject x="6%" y="20%" width="88%" height="70%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff;font-family:sans-serif;font-size:${Math.round(w * 0.022)}px;line-height:1.4;opacity:0.85">${prompt}</div>
  </foreignObject>
</svg>`;

    return {
      bytes: new TextEncoder().encode(svg),
      ext: "svg",
      seed,
      provider: this.name,
    };
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
