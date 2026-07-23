import type {
  ProductionPlan,
} from "../types/workflow.js";

import {
  AIProviderRouter,
} from "@skyra/ai/router";

export class AIDirector {

  constructor(
    private readonly router:
      AIProviderRouter
  ) {}

  async createPlan(
    userRequest: string
  ): Promise<ProductionPlan> {

    const response =
      await this.router.generate({

        messages: [
          {
            role: "system",

            content: `
You are SKYRA AI Director.

Your responsibility is to transform
a user's creative request into a
professional video production plan.

The production must prioritize:

- Photorealistic human characters
- Realistic human anatomy
- Consistent character identity
- Cinematic camera movement
- Professional lighting
- Visual continuity
- Natural human expressions
- Realistic hands and faces
- Professional voice
- Accurate lip synchronization
- Cinematic music
- Sound effects
- High-quality video generation
- High-quality image generation
- Multiple aspect ratios
- Quality control

The final production should feel like
a premium commercial created by a
world-class film production studio.
            `.trim(),
          },

          {
            role: "user",

            content:
              userRequest,
          },
        ],

        options: {
          model:
            "development",

          temperature:
            0.2,

          responseFormat:
            "text",
        },

      });

    console.log(
      "\n[SKYRA AI DIRECTOR RESPONSE]\n"
    );

    console.log(
      response.text
    );

    return this.createDevelopmentPlan(
      userRequest
    );
  }

  private createDevelopmentPlan(
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