// types/agent/agent.ts
export interface AgentConfig {
  id: string; // 唯一标识
  name: string; // Agent名称
  description: string; // 描述（可选）
  systemPrompt: string; // 系统提示词（核心）
  model: string; // 模型选择
  temperature: number; // 温度参数（最常用的调参）
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}
export const DEFAULT_AGENT_CONFIG: Partial<AgentConfig> = {
  name: "",
  description: "",
  systemPrompt: "你是一个有用的AI助手。",
  model: "gpt-3.5-turbo",
  temperature: 0.7,
};
