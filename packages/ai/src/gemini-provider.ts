import type {
  AIProvider,
  AIRequest,
  AIResponse,
} from "./provider.js";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Google Gemini planner (via the Generative Language REST API).
 *
 * Gemini has a genuinely free tier (Google AI Studio), which makes it the best
 * near-zero-cost engine for the AI Director. No SDK dependency — plain fetch.
 *
 * Get a key: https://aistudio.google.com/apikey
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = "gemini-2.0-flash") {
    if (!apiKey) {
      throw new Error("Gemini API key is required for GeminiProvider.");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // Gemini separates the system instruction from the conversation, and uses
    // the role "model" for assistant turns.
    const systemText = request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.options?.temperature ?? 0.2,
        ...(request.options?.maxTokens ? { maxOutputTokens: request.options.maxTokens } : {}),
        responseMimeType:
          request.options?.responseFormat === "json" ? "application/json" : "text/plain",
      },
    };
    if (systemText) {
      body.systemInstruction = { parts: [{ text: systemText }] };
    }

    const model = request.options?.model ?? this.model;

    const res = await fetch(
      `${API_BASE}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const data = (await res.json()) as GeminiResponse;
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    return { text, model, provider: this.name };
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}
