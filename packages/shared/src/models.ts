export type ModelPricing={
    inputUsedMillionTokens:number;
    outputUsedMillionTokens:number;
}

export type SupportProvider="anthropic" | "openai" | "gemini";
 
type SupportedChatModelDefinition={
    id:string,
    provider:SupportProvider;
    pricing:ModelPricing
}

export const SUPPORTED_CHAT_MODELS=[
    {
        id:"claude-sonnet-4.6",
        provider:"anthropic",
        pricing:{
            inputUsedMillionTokens:3,
            outputUsedMillionTokens:15
        }
    },
     {
        id:"claude-haiku-4.5",
        provider:"anthropic",
        pricing:{
            inputUsedMillionTokens:1,
            outputUsedMillionTokens:5
        }
    },
     {
        id:"claude-opus-4.6",
        provider:"anthropic",
        pricing:{
            inputUsedMillionTokens:5,
            outputUsedMillionTokens:25
        }
    },
     {
        id:"gpt-5.4",
        provider:"openai",
        pricing:{
            inputUsedMillionTokens:2.5,
            outputUsedMillionTokens:15
        }
    },
    {
        id:"gpt-5.4-mini",
        provider:"openai",
        pricing:{
            inputUsedMillionTokens:0.75,
            outputUsedMillionTokens:4.5
        }
    },
    {
        id:"gpt-5.4-nano",
        provider:"openai",
        pricing:{
            inputUsedMillionTokens:0.2,
            outputUsedMillionTokens:1.25
        }
    }
] as const satisfies readonly SupportedChatModelDefinition[]

export type SupportedChatModel=(typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId=SupportedChatModel["id"];

export function findSupportedChatModel(modelId:string){
    return SUPPORTED_CHAT_MODELS.find((model)=>model.id === modelId)
}

export const DEFAULT_CHAT_MODEL_ID:SupportedChatModelId="claude-opus-4.6";

