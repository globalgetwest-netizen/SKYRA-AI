import type {
  AIProvider,
  AIRequest,
  AIResponse,
} from "./provider.js";

export class DevelopmentAIProvider
  implements AIProvider
{
  async generate(
    request: AIRequest
  ): Promise<AIResponse> {

    console.log(
      "\n[SKYRA DEVELOPMENT AI]"
    );

    console.log(
      "Processing request..."
    );

    const userMessage =
      request.messages.find(
        (message) =>
          message.role === "user"
      );

    console.log(
      userMessage?.content ?? ""
    );

    return {
      text: `
SKYRA Development AI has
successfully processed the request.

The production should be created
as a premium photorealistic cinematic
advertisement with coherent storytelling,
realistic human visuals,
professional audio,
and a consistent human presenter.

This is currently the development
planning layer.

The next production layer will
connect this plan to real AI models.
      `.trim(),

      provider:
        "development",

      model:
        "development",

    };
  }
}