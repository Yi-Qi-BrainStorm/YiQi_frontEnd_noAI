export enum modelType {
  //官网
  deepseek_chat = "deepseek_chat",
  deepseek_reasoner = "deepseek_reasoner",
  kimi2 = "kimi2",
  kimi2_turbo = "kimi2_turbo",
  kimi2_thinking_turbo = "kimi2_thinking_turbo",
  kimi_latest = "kimi_latest",
  //硅基流动
  Qwen_QwQ_32B = "Qwen_QwQ_32B",
  Qwen3_235B_A22B = "Qwen3_235B_A22B",
  //openrouter
  free_GLM4_5_Air = "free_GLM4_5_Air",
  free_deepseekR1 = "free_deepseekR1",
  free_deepseekV3 = "free_deepseekV3",
  free_Meta_Llama = "free_Meta_Llama",
}

export interface modelInfo {
  modelName: string;
  modelContext: number;
  modelInfo: string;
}
