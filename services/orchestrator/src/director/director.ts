import type {
  ProductionPlan,
} from "../types/workflow.js";

export class Director {

  createPlan(
    userRequest: string
  ): ProductionPlan {

    return {
      projectId:
        `skyra-${Date.now()}`,

      projectType:
        "advertisement",

      title:
        "YUNEX Global Commerce",

      objective:
        "Create a premium photorealistic cinematic AI-generated video.",

      description:
        userRequest,

      targetAudience:
        "African entrepreneurs and global businesses",

      language:
        "English",

      durationSeconds:
        30,

      aspectRatios: [
        "16:9",
        "9:16",
      ],

      visualStyle:
        "Photorealistic premium cinematic futuristic",

      script:
        userRequest,

      characters: [],

      scenes: [],

      audio: {
        voiceRequired:
          true,

        voiceStyle:
          "Natural professional human voice",

        language:
          "English",

        musicRequired:
          true,

        musicStyle:
          "Premium cinematic",

        soundEffectsRequired:
          true,
      },

      avatarRequired:
        true,

      qualityLevel:
        "cinematic",

      status:
        "planned",
    };
  }
}