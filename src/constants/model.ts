import { modelType, type modelInfo } from "@/types/agent/model";

export const modelMapInfo = new Map<modelType, modelInfo>([
  // DeepSeek 模型
  //url:'https://api.deepseek.com'
  [
    modelType.deepseek_chat,
    {
      modelName: "deepseek-chat",
      modelContext: 128000,
      modelInfo:
        "DeepSeek-V3.2-Exp（非思考模式）, DeepSeek-V3.2-Exp 模型，这是一个实验性（Experimental）的版本。作为迈向新一代架构的中间步骤，V3.2-Exp 在 V3.1-Terminus 的基础上引入了 DeepSeek Sparse Attention（一种稀疏注意力机制），针对长文本的训练和推理效率进行了探索性的优化和验证。",
    },
  ],
  [
    modelType.deepseek_reasoner,
    {
      modelName: "deepseek-reasoner",
      modelContext: 128000,
      modelInfo:
        "DeepSeek-V3.2-Exp（思考模式）, DeepSeek-V3.2-Exp 模型，这是一个实验性（Experimental）的版本。作为迈向新一代架构的中间步骤，V3.2-Exp 在 V3.1-Terminus 的基础上引入了 DeepSeek Sparse Attention（一种稀疏注意力机制），针对长文本的训练和推理效率进行了探索性的优化和验证。",
    },
  ],

  // Kimi 模型
  //url:"https://api.moonshot.cn/v1"
  [
    modelType.kimi2,
    {
      modelName: "kimi-k2-0905-preview",
      modelContext: 256000,
      modelInfo:
        "kimi-k2-0905-preview 模型上下文长度 256k，在 kimi-k2-0711-preview 能力的基础上，具备更强的 Agentic Coding 能力、更突出的前端代码的美观度和实用性、以及更好的上下文理解能力",
    },
  ],
  [
    modelType.kimi2_turbo,
    {
      modelName: "kimi-k2-turbo-preview",
      modelContext: 256000,
      modelInfo:
        "kimi-k2-turbo-preview 模型上下文长度 256k，是 kimi k2 的高速版本模型，始终对标最新版本的 kimi-k2 模型（kimi-k2-0905-preview）。模型参数与 kimi-k2 一致，但输出速度已提至每秒 60 tokens，最高可达每秒 100 tokens",
    },
  ],
  [
    modelType.kimi2_thinking_turbo,
    {
      modelName: "kimi-k2-thinking-turbo",
      modelContext: 256000,
      modelInfo:
        "kimi-k2-thinking-turbo 模型上下文长度 256k，是 kimi-k2-thinking 模型的高速版，适用于需要深度推理和追求极致高速的场景",
    },
  ],
  [
    modelType.kimi_latest,
    {
      modelName: "kimi-latest",
      modelContext: 128000,
      modelInfo:
        "kimi-latest 模型总是使用 Kimi 智能助手产品使用最新的 Kimi 大模型版本，可能包含尚未稳定的特性,模型上下文长度为 128k，会自动根据请求的上下文长度选择 8k/32k/128k 模型作为计费模型,是视觉模型，支持图片理解",
    },
  ],

  // Qwen 模型
  //url:https://api.siliconflow.cn/v1/chat/completions
  [
    modelType.Qwen_QwQ_32B,
    {
      modelName: "Qwen/QwQ-32B",
      modelContext: 128000,
      modelInfo:
        "QwQ 是 Qwen 系列的推理模型。与传统的指令调优模型相比，QwQ 具备思考和推理能力，能够在下游任务中实现显著增强的性能，尤其是在解决困难问题方面。QwQ-32B 是中型推理模型，能够在与最先进的推理模型（如 DeepSeek-R1、o1-mini）的对比中取得有竞争力的性能。该模型采用 RoPE、SwiGLU、RMSNorm 和 Attention QKV bias 等技术，具有 64 层网络结构和 40 个 Q 注意力头（GQA 架构中 KV 为 8 个）",
    },
  ],
  [
    modelType.Qwen3_235B_A22B,
    {
      modelName: "Qwen/Qwen3-235B-A22B-Instruct-2507",
      modelContext: 256000,
      modelInfo:
        "Qwen3-235B-A22B-Instruct-2507 是由阿里云通义千问团队开发的 Qwen3 系列中的一款旗舰级混合专家（MoE）大语言模型。该模型拥有 2350 亿总参数，每次推理激活 220 亿参数。它是作为 Qwen3-235B-A22B 非思考模式的更新版本发布的，专注于在指令遵循、逻辑推理、文本理解、数学、科学、编程及工具使用等通用能力上实现显著提升。此外，模型增强了对多语言长尾知识的覆盖，并能更好地对齐用户在主观和开放性任务上的偏好，以生成更有帮助和更高质量的文本。值得注意的是，该模型原生支持 256K（即 262,144 tokens）的超长上下文窗口，强化了其处理复杂长文本的能力。此版本仅支持非思考模式，不再生成 <think> 模块，旨在为直接问答、知识检索等任务提供更高效和精准的响应",
    },
  ],

  // 免费模型
  //url:https://openrouter.ai/api/v1
  [
    modelType.free_GLM4_5_Air,
    {
      modelName: "z-ai/glm-4.5-air:free",
      modelContext: 131072,
      modelInfo:
        "GLM-4.5-Air 是我们最新旗舰模型系列的轻量级版本，同样专为以智能体为中心的应用而设计。与 GLM-4.5 一样，它采用了混合专家 (MoE) 架构，但参数规模更小。GLM-4.5-Air 还支持混合推理模式，提供用于高级推理和工具使用的“思考模式”以及用于实时交互的“非思考模式”。用户可以通过 enabled reasoning 布尔值来控制推理行为。",
    },
  ],
  [
    modelType.free_deepseekR1,
    {
      modelName: "tngtech/deepseek-r1t2-chimera:free",
      modelContext: 163840,
      modelInfo:
        "DeepSeek R1 的性能与 OpenAI o1 相当，但它是开源的，并且推理令牌完全开放。它的参数量为 6710 亿，其中推理过程中有 370 亿个活跃参数。",
    },
  ],
  [
    modelType.free_deepseekV3,
    {
      modelName: "deepseek/deepseek-chat-v3-0324:free",
      modelContext: 163840,
      modelInfo:
        "DeepSeek V3 是一个拥有 6850 亿个参数的混合专家模型，是 DeepSeek 团队旗舰聊天模型系列的最新迭代版本。",
    },
  ],
  [
    modelType.free_Meta_Llama,
    {
      modelName: "meta-llama/llama-3.3-70b-instruct:free",
      modelContext: 131072,
      modelInfo:
        "Meta Llama 3.3 多语言大型语言模型 (LLM) 是一个预训练并经过指令调优的生成模型，处理 700 亿字节的文本（输入/输出）。Llama 3.3 的纯文本模型经过指令调优，针对多语言对话应用场景进行了优化，并在常见的行业基准测试中优于许多现有的开源和封闭式聊天模型。",
    },
  ],
]);

export const getModelInfo = (model: modelType): modelInfo => {
  const info = modelMapInfo.get(model);
  if (!info) {
    throw new Error(`Unknown model: ${model}`);
  }
  return info;
};

// 生成表单选项
export const getModelOptions = () => {
  return Array.from(modelMapInfo.entries()).map(([key, info]) => ({
    value: key,
    label: info.modelName,
    description: info.modelInfo,
    context: info.modelContext,
  }));
};

export const DEFAULT_MODEL = modelType.free_deepseekV3;
