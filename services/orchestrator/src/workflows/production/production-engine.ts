import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { ImageProvider, VideoProvider } from "@skyra/ai";

import type { ProductionPlan } from "../../types/workflow.js";
import { getImageProvider } from "../../media/image-factory.js";
import { getVideoProvider } from "../../media/video-factory.js";

export interface ProductionEngineResult {
  projectId: string;
  status: "completed" | "failed";
  message: string;
  generatedAssets: string[];
  errors: string[];
}

/**
 * Executes a {@link ProductionPlan}: for each scene it generates the still
 * image and/or the video clip that the scene requires, via the configured
 * engines, and writes the files to disk. Video is optional — with no video
 * engine configured the pipeline runs images-only. Voice, lip-sync and final
 * render are the next layers, each slotting in behind its own provider.
 */
export class ProductionEngine {
  private readonly imageProvider: ImageProvider;
  private readonly videoProvider: VideoProvider | null;
  private readonly outputRoot: string;

  constructor(
    imageProvider: ImageProvider = getImageProvider(),
    videoProvider: VideoProvider | null = getVideoProvider(),
    outputRoot = "storage/output",
  ) {
    this.imageProvider = imageProvider;
    this.videoProvider = videoProvider;
    this.outputRoot = outputRoot;
  }

  async execute(plan: ProductionPlan): Promise<ProductionEngineResult> {
    const generatedAssets: string[] = [];
    const errors: string[] = [];

    const projectDir = join(this.outputRoot, plan.projectId);
    await mkdir(projectDir, { recursive: true });

    console.log("\n================================");
    console.log("     SKYRA PRODUCTION ENGINE");
    console.log("================================\n");
    console.log(`[PROJECT]  ${plan.projectId}`);
    console.log(`[TITLE]    ${plan.title}`);
    console.log(`[QUALITY]  ${plan.qualityLevel}`);
    console.log(`[IMAGE ENGINE] ${this.imageProvider.name}`);
    console.log(`[VIDEO ENGINE] ${this.videoProvider ? this.videoProvider.name : "none (images only)"}`);
    console.log(`[SCENES]   ${plan.scenes.length}`);

    const aspectRatio = plan.aspectRatios[0] ?? "16:9";

    for (const scene of plan.scenes) {
      console.log(`\n[SCENE ${scene.order}] ${scene.location}`);

      // --- Still image ---
      if (scene.requiresImageGeneration) {
        try {
          console.log("  image: generating…");
          const image = await this.imageProvider.generate({
            prompt: scene.visualPrompt,
            negativePrompt: scene.negativePrompt,
            aspectRatio,
          });
          const filepath = join(projectDir, `scene-${scene.order}.${image.ext}`);
          await writeFile(filepath, image.bytes);
          generatedAssets.push(filepath);
          console.log(`  image: saved → ${filepath}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`scene ${scene.order} image: ${message}`);
          console.log(`  image: FAILED → ${message}`);
        }
      }

      // --- Video clip ---
      if (scene.requiresVideoGeneration) {
        if (!this.videoProvider) {
          console.log("  video: skipped (no video engine — set SKYRA_VIDEO_PROVIDER, see colab/README.md)");
        } else {
          try {
            console.log(`  video: generating (${scene.durationSeconds}s)…`);
            const video = await this.videoProvider.generate({
              prompt: scene.visualPrompt,
              negativePrompt: scene.negativePrompt,
              aspectRatio,
              seconds: scene.durationSeconds,
            });
            const filepath = join(projectDir, `scene-${scene.order}.${video.ext}`);
            await writeFile(filepath, video.bytes);
            generatedAssets.push(filepath);
            console.log(`  video: saved → ${filepath}`);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`scene ${scene.order} video: ${message}`);
            console.log(`  video: FAILED → ${message}`);
          }
        }
      }
    }

    // Layers still to come.
    for (const label of ["voice / TTS", "lip synchronization", "music & sound", "final render (16:9 + 9:16)"]) {
      console.log(`\n[PENDING] ${label} — not yet implemented`);
    }

    const images = generatedAssets.filter((a) => !a.endsWith(".mp4")).length;
    const videos = generatedAssets.filter((a) => a.endsWith(".mp4")).length;
    return {
      projectId: plan.projectId,
      status: errors.length && generatedAssets.length === 0 ? "failed" : "completed",
      message: `Generated ${images} image(s) and ${videos} video(s).`,
      generatedAssets,
      errors,
    };
  }
}
