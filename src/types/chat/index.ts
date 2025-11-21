// 消息角色
export type MessageRole = "user" | "assistant" | "system";

// 消息状态
export type MessageStatus = "sending" | "success" | "error" | "streaming";

// 单条消息
export interface ChatMessage {
  id: string; // 消息唯一 ID
  role: MessageRole; // 角色
  content: string; // 内容
  timestamp: number; // 时间戳
  status?: MessageStatus; // 状态
  error?: string; // 错误信息
}

// 会话配置
export interface ChatSession {
  sessionId: string; // 会话唯一 ID
  agentId: string; // Agent ID
  agentName: string; // Agent 名称
  messages: ChatMessage[]; // 消息列表
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

// 发送消息请求
export interface SendMessageRequest {
  agentId: string; // Agent ID（用于标识会话）
  sessionId: string; // 会话 ID
  message: string; // 用户消息
  agentConfig: {
    // Agent 配置（完整传递给后端）
    name: string;
    model: string;
    temperature: number;
    systemPrompt: string;
  };
  stream?: boolean; // 是否流式响应
}

// 发送消息响应
export interface SendMessageResponse {
  messageId: string; // 消息 ID
  content: string; // AI 回复内容
  timestamp: number; // 时间戳
  model: string; // 使用的模型
  usage?: {
    // 使用情况（可选）
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 流式响应数据块
export interface StreamChunk {
  delta: string; // 增量内容
  done: boolean; // 是否完成
  messageId?: string; // 消息 ID
  error?: string; // 错误信息
}
