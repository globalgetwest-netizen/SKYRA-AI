import OpenAI from "openai";

import type {
  AIProvider,
  AIRequest,
  AIResponse,
} from "./provider";

export class OpenAIProvider
  implements AIProvider
{
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "OpenAI API key is required."
      );
    }

    this.client = new OpenAI({
      apiKey,
    });
  }

  async generate(
    request: AIRequest
  ): Promise<AIResponse> {

    const model =
      request.options?.model ??
      "gpt-4o-mini";

    const response =
      await this.client.chat.completions.create({
        model,

        messages:
          request.messages,

        temperature:
          request.options?.temperature ??
          0.2,

        max_tokens:
          request.options?.maxTokens,

        response_format:
          request.options?.responseFormat ===
          "json"
            ? {
                type: "json_object",
              }
            : undefined,
      });

    return {
      text:
        response.choices[0]
          ?.message
          ?.content ?? "",

      model,

      provider:
        "openai",
    };
  }
}