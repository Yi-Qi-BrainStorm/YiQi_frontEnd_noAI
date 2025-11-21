import { ref, computed } from "vue";
import { ChatService } from "@/services/chatService";
import type { ChatMessage, StreamChunk } from "@/types/chat";
import type { AgentConfig } from "@/types/agent/agent";

/**
 * Chat 对话逻辑封装
 * 支持流式和非流式对话
 */
export function useChat(agent: AgentConfig) {
  // 生成唯一会话 ID
  const sessionId = ref<string>(generateSessionId(agent.id));

  // 消息列表
  const messages = ref<ChatMessage[]>([]);

  // 当前流式响应的 EventSource
  let currentEventSource: EventSource | null = null;

  // 状态
  const isStreaming = ref(false);
  const isSending = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const hasMessages = computed(() => messages.value.length > 0);
  const lastMessage = computed(() => messages.value[messages.value.length - 1]);

  /**
   * 生成会话 ID
   * 格式: session_{agentId}_{timestamp}
   */
  function generateSessionId(agentId: string): string {
    return `session_${agentId}_${Date.now()}`;
  }

  /**
   * 生成消息 ID
   */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加用户消息
   */
  function addUserMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content,
      timestamp: Date.now(),
      status: "success",
    };
    messages.value.push(message);
    return message;
  }

  /**
   * 添加 AI 消息占位符
   */
  function addAssistantPlaceholder(): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      status: "streaming",
    };
    messages.value.push(message);
    return message;
  }

  /**
   * 更新最后一条消息
   */
  function updateLastMessage(
    content: string,
    status: ChatMessage["status"] = "success",
  ) {
    if (messages.value.length > 0) {
      const lastMsg = messages.value[messages.value.length - 1];
      lastMsg!.content = content;
      lastMsg!.status = status;
    }
  }

  /**
   * 发送消息（流式）
   */
  async function sendMessage(content: string): Promise<void> {
    if (!content.trim() || isSending.value || isStreaming.value) {
      return;
    }

    try {
      error.value = null;
      isSending.value = true;
      isStreaming.value = true;

      // 添加用户消息
      addUserMessage(content);

      // 添加 AI 消息占位符
      addAssistantPlaceholder();

      let accumulatedContent = "";

      // 开始流式接收
      currentEventSource = ChatService.streamChat(
        {
          agentId: agent.id,
          sessionId: sessionId.value,
          message: content,
          stream: true,
        },
        // onChunk
        (chunk: StreamChunk) => {
          if (chunk.error) {
            error.value = chunk.error;
            updateLastMessage(chunk.error, "error");
            return;
          }

          // 累积内容
          accumulatedContent += chunk.delta;
          updateLastMessage(accumulatedContent, "streaming");

          // 如果完成
          if (chunk.done) {
            updateLastMessage(accumulatedContent, "success");
            isStreaming.value = false;
            isSending.value = false;
          }
        },
        // onError
        (err: Error) => {
          error.value = err.message;
          updateLastMessage(`错误: ${err.message}`, "error");
          isStreaming.value = false;
          isSending.value = false;
        },
        // onComplete
        () => {
          isStreaming.value = false;
          isSending.value = false;
        },
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : "发送失败";
      updateLastMessage(`错误: ${error.value}`, "error");
      isStreaming.value = false;
      isSending.value = false;
    }
  }

  /**
   * 停止流式响应
   */
  function stopStreaming(): void {
    if (currentEventSource) {
      ChatService.stopStream(currentEventSource);
      currentEventSource = null;
      isStreaming.value = false;
      isSending.value = false;

      // 更新最后一条消息状态
      if (messages.value.length > 0) {
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg!.status === "streaming") {
          lastMsg!.status = "success";
          lastMsg!.content += "\n\n[已中断]";
        }
      }
    }
  }

  /**
   * 清空对话
   */
  function clearMessages(): void {
    messages.value = [];
    error.value = null;
    // 生成新的会话 ID
    sessionId.value = generateSessionId(agent.id);
  }

  /**
   * 重新生成会话 ID（用于切换 Agent）
   */
  function resetSession(): void {
    stopStreaming();
    clearMessages();
  }

  return {
    // 状态
    sessionId,
    messages,
    isStreaming,
    isSending,
    error,

    // 计算属性
    hasMessages,
    lastMessage,

    // 方法
    sendMessage,
    stopStreaming,
    clearMessages,
    resetSession,
  };
}
