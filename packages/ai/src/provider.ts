export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface AIRequest {
  messages: AIMessage[];
  options?: AICompletionOptions;
}

export interface AIResponse {
  text: string;
  model?: string;
  provider?: string;
}

export interface AIProvider {
  generate(request: AIRequest): Promise<AIResponse>;
}
