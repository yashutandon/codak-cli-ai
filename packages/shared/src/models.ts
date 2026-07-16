export type ModelPricing = {
    inputUsedMillionTokens: number;
    outputUsedMillionTokens: number;
};

export type SupportProvider = "anthropic" | "openai" | "google" | "groq" | "huggingface";

type SupportedChatModelDefinition = {
    id: string;
    displayName: string;
    provider: SupportProvider;
    contextWindow: number;  // tokens
    pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
    // Anthropic
    {
        id: "claude-sonnet-4.6",
        displayName: "Claude Sonnet 4.6",
        provider: "anthropic",
        contextWindow: 200_000,
        pricing: { inputUsedMillionTokens: 3, outputUsedMillionTokens: 15 },
    },
    {
        id: "claude-haiku-4.5",
        displayName: "Claude Haiku 4.5",
        provider: "anthropic",
        contextWindow: 200_000,
        pricing: { inputUsedMillionTokens: 1, outputUsedMillionTokens: 5 },
    },
    {
        id: "claude-opus-4.6",
        displayName: "Claude Opus 4.6",
        provider: "anthropic",
        contextWindow: 200_000,
        pricing: { inputUsedMillionTokens: 5, outputUsedMillionTokens: 25 },
    },

    // OpenAI
    {
        id: "gpt-4o",
        displayName: "GPT-4o",
        provider: "openai",
        contextWindow: 128_000,
        pricing: { inputUsedMillionTokens: 2.5, outputUsedMillionTokens: 10 },
    },
    {
        id: "gpt-4o-mini",
        displayName: "GPT-4o Mini",
        provider: "openai",
        contextWindow: 128_000,
        pricing: { inputUsedMillionTokens: 0.15, outputUsedMillionTokens: 0.6 },
    },
    {
        id: "gpt-5.4",
        displayName: "GPT-5.4",
        provider: "openai",
        contextWindow: 128_000,
        pricing: { inputUsedMillionTokens: 2.5, outputUsedMillionTokens: 15 },
    },
    {
        id: "gpt-5.4-mini",
        displayName: "GPT-5.4 Mini",
        provider: "openai",
        contextWindow: 128_000,
        pricing: { inputUsedMillionTokens: 0.75, outputUsedMillionTokens: 4.5 },
    },
    {
        id: "gpt-5.4-nano",
        displayName: "GPT-5.4 Nano",
        provider: "openai",
        contextWindow: 128_000,
        pricing: { inputUsedMillionTokens: 0.2, outputUsedMillionTokens: 1.25 },
    },

    // Google Gemini
    {
        id: "gemini-2.0-flash",
        displayName: "Gemini 2.0 Flash",
        provider: "google",
        contextWindow: 1_000_000,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "gemini-1.5-flash",
        displayName: "Gemini 1.5 Flash",
        provider: "google",
        contextWindow: 1_000_000,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "gemini-1.5-pro",
        displayName: "Gemini 1.5 Pro",
        provider: "google",
        contextWindow: 2_000_000,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        provider: "google",
        contextWindow: 1_000_000,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },

    // Groq (free tier)
    {
        id: "llama-3.3-70b-versatile",
        displayName: "Llama 3.3 70B",
        provider: "groq",
        contextWindow: 128_000,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "llama-3.1-8b-instant",
        displayName: "Llama 3.1 8B",
        provider: "groq",
        contextWindow: 128_000,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "qwen/qwen3-32b",
        displayName: "Qwen 3 32B",
        provider: "groq",
        contextWindow: 32_000,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },

    // HuggingFace (Serverless Inference)
    {
        id: "meta-llama/Meta-Llama-3-8B-Instruct",
        displayName: "HF Llama 3 8B",
        provider: "huggingface",
        contextWindow: 8_192,
        pricing: { inputUsedMillionTokens: 0, outputUsedMillionTokens: 0 },
    },
    {
        id: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        displayName: "HF Mixtral 8x7B",
        provider: "huggingface",
        contextWindow: 32_768,
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