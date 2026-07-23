import type {
  AIProvider,
  AIRequest,
  AIResponse,
} from "./provider.js";

export class AIProviderRouter {
  private providers: Map<string, AIProvider>;

  constructor() {
    this.providers = new Map();
  }

  register(
    name: string,
    provider: AIProvider
  ): void {
    this.providers.set(name, provider);
  }

  getProvider(
    name: string
  ): AIProvider {
    const provider =
      this.providers.get(name);

    if (!provider) {
      throw new Error(
        `AI provider "${name}" is not registered.`
      );
    }

    return provider;
  }

  async generate(
    request: AIRequest,
    providerName = "local"
  ): Promise<AIResponse> {
    const provider =
      this.getProvider(providerName);

    return provider.generate(request);
  }
}