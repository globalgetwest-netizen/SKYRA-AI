import { z } from "zod";

export const VideoProjectTypeSchema = z.enum([
  "advertisement",
  "cinematic",
  "avatar",
  "social",
  "story",
  "educational",
  "product-demo",
  "documentary",
]);

export type VideoProjectType =
  z.infer<typeof VideoProjectTypeSchema>;

export const AspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "1:1",
  "4:5",
  "4:3",
]);

export type AspectRatio =
  z.infer<typeof AspectRatioSchema>;

export const CameraMovementSchema = z.enum([
  "static",
  "slow-pan",
  "fast-pan",
  "dolly-in",
  "dolly-out",
  "tracking",
  "orbit",
  "crane",
  "handheld",
  "drone",
  "cinematic",
]);

export type CameraMovement =
  z.infer<typeof CameraMovementSchema>;

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ageRange: z.string().optional(),
  genderPresentation: z.string().optional(),
  appearance: z.string(),
  wardrobe: z.string().optional(),
  personality: z.string().optional(),
  voiceId: z.string().optional(),
  referenceImageUrl: z.string().url().optional(),
});

export type Character =
  z.infer<typeof CharacterSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),

  durationSeconds: z.number().positive(),

  location: z.string(),

  timeOfDay: z.string().optional(),

  description: z.string(),

  action: z.string(),

  visualPrompt: z.string(),

  negativePrompt: z.string().optional(),

  cameraMovement: CameraMovementSchema,

  cameraDirection: z.string(),

  lighting: z.string(),

  atmosphere: z.string(),

  characters: z.array(z.string()),

  dialogue: z.string().optional(),

  voiceover: z.string().optional(),

  soundEffects: z.array(z.string()),

  musicDirection: z.string().optional(),

  requiresAvatar: z.boolean(),

  requiresVideoGeneration: z.boolean(),

  requiresImageGeneration: z.boolean(),

  requiresLipSync: z.boolean(),
});

export type Scene =
  z.infer<typeof SceneSchema>;

export const AudioPlanSchema = z.object({
  voiceRequired: z.boolean(),

  voiceId: z.string().optional(),

  voiceStyle: z.string().optional(),

  language: z.string(),

  musicRequired: z.boolean(),

  musicStyle: z.string().optional(),

  soundEffectsRequired: z.boolean(),
});

export type AudioPlan =
  z.infer<typeof AudioPlanSchema>;

export const ProductionPlanSchema = z.object({
  projectId: z.string(),

  projectType: VideoProjectTypeSchema,

  title: z.string(),

  objective: z.string(),

  description: z.string(),

  targetAudience: z.string(),

  language: z.string(),

  durationSeconds: z.number().positive(),

  aspectRatios: z.array(AspectRatioSchema),

  visualStyle: z.string(),

  brandGuidelines: z.string().optional(),

  script: z.string(),

  characters: z.array(CharacterSchema),

  scenes: z.array(SceneSchema),

  audio: AudioPlanSchema,

  avatarRequired: z.boolean(),

  qualityLevel: z.enum([
    "standard",
    "high",
    "ultra",
    "cinematic",
  ]),

  status: z.enum([
    "draft",
    "planned",
    "generating",
    "processing",
    "rendering",
    "completed",
    "failed",
  ]),
});

export type ProductionPlan =
  z.infer<typeof ProductionPlanSchema>;