export type ModelPricing = {
    inputUsedMillionTokens: number;
    outputUsedMillionTokens: number;
};

export type SupportProvider = "anthropic" | "openai" | "google" | "groq";

type SupportedChatModelDefinition = {
    id: string;
    provider: SupportProvider;
    pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
    // Anthropic
    {
        id: "claude-sonnet-4.6",
        provider: "anthropic",
        pricing: { inputUsedMillionTokens: 3, outputUsedMillionTokens: 15 },
    },
    {
        id: "claude-haiku-4.5",
        provider: "anthropic",
        pricing: { inputUsedMillionTokens: 1, outputUsedMillionTokens: 5 },
    },
    {
        id: "claude-opus-4.6",
        provider: "anthropic",
        pricing: { inputUsedMillionTokens: 5, outputUsedMillionTokens: 25 },
    },

    // OpenAI
    {
        id: "gpt-4o",
        provider: "openai",
        pricing: { inputUsedMillionTokens: 2.5, outputUsedMillionTokens: 10 },
    },
    {
        id: "gpt-4o-mini",
        provider: "openai",
        pricing: { inputUsedMillionTokens: 0.15, outputUsedMillionTokens: 0.6 },
    },
    {
        id: "gpt-5.4",
        provider: "openai",
        pricing: { inputUsedMillionTokens: 2.5, outputUsedMillionTokens: 15 },
    },
    {
        id: "gpt-5.4-mini",
        provider: "openai",
        pricing: { inputUsedMillionTokens: 0.75, outputUsedMillionTokens: 4.5 },
    },
    {
        id: "gpt-5.4-nano",
        provider: "openai",
        pricing: { inputUsedMillionTokens: 0.2, outputUsedMillionTokens: 1.25 },
    },

    // Google Gemini (free tier)
    {
        id: "gemini-2.0-flash",
        provider: "google",
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "gemini-1.5-flash",
        provider: "google",
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "gemini-1.5-pro",
        provider: "google",
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "gemini-2.5-flash",
        provider: "google",
        pricing:
        {
            inputUsedMillionTokens: 0,
            outputUsedMillionTokens: 0
        }
    },

    // Groq (free tier)
    {
        id: "llama-3.3-70b-versatile",
        provider: "groq",
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "llama-3.1-8b-instant",
        provider: "groq",
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "qwen/qwen3-32b",
        provider: "groq",
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },

] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

// export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "llama-3.3-70b-versatile";
// export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId ="gemini-2.0-flash"
export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gpt-5.4-mini";