import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { ImageProvider } from "@skyra/ai";

import type { ProductionPlan } from "../../types/workflow.js";
import { getImageProvider } from "../../media/image-factory.js";

export interface ProductionEngineResult {
  projectId: string;
  status: "completed" | "failed";
  message: string;
  generatedAssets: string[];
  errors: string[];
}

/**
 * Executes a {@link ProductionPlan}. Today it generates the still image for
 * each scene that requires one (via the configured image engine) and writes
 * the files to disk. Video, voice, lip-sync and final render are the next
 * layers — each will slot in behind its own provider, exactly like images do.
 */
export class ProductionEngine {
  private readonly imageProvider: ImageProvider;
  private readonly outputRoot: string;

  constructor(imageProvider: ImageProvider = getImageProvider(), outputRoot = "storage/output") {
    this.imageProvider = imageProvider;
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
    console.log(`[SCENES]   ${plan.scenes.length}`);

    const aspectRatio = plan.aspectRatios[0] ?? "16:9";

    for (const scene of plan.scenes) {
      console.log(`\n[SCENE ${scene.order}] ${scene.location}`);

      if (!scene.requiresImageGeneration) {
        console.log("  image: skipped (no still required)");
        continue;
      }

      try {
        console.log("  image: generating…");
        const image = await this.imageProvider.generate({
          prompt: scene.visualPrompt,
          negativePrompt: scene.negativePrompt,
          aspectRatio,
        });

        const filename = `scene-${scene.order}.${image.ext}`;
        const filepath = join(projectDir, filename);
        await writeFile(filepath, image.bytes);

        generatedAssets.push(filepath);
        console.log(`  image: saved → ${filepath}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`scene ${scene.order}: ${message}`);
        console.log(`  image: FAILED → ${message}`);
      }
    }

    // Layers still to come — declared so the plan/pipeline stay honest.
    for (const label of [
      "video generation",
      "voice / TTS",
      "lip synchronization",
      "music & sound",
      "final render (16:9 + 9:16)",
    ]) {
      console.log(`\n[PENDING] ${label} — not yet implemented`);
    }

    return {
      projectId: plan.projectId,
      status: errors.length && !generatedAssets.length ? "failed" : "completed",
      message: `Generated ${generatedAssets.length} image asset(s) with the "${this.imageProvider.name}" engine.`,
      generatedAssets,
      errors,
    };
  }
}
