import { ApiService } from "@/services";
import type {
  SendMessageRequest,
  SendMessageResponse,
  StreamChunk,
} from "@/types/chat";

/**
 * Chat API 服务
 * 负责与后端 AI 对话接口通信
 */
export class ChatService {
  /**
   * 发送消息（非流式）
   * @param request 发送消息请求
   * @returns AI 回复
   */
  static async sendMessage(
    request: SendMessageRequest,
  ): Promise<SendMessageResponse> {
    return await ApiService.post<SendMessageResponse>("chat/send", {
      agentId: request.agentId,
      sessionId: request.sessionId,
      message: request.message,
      agentConfig: request.agentConfig,
      stream: false,
    });
  }

  /**
   * 流式发送消息（SSE）
   * @param request 发送消息请求
   * @param onChunk 接收数据块的回调
   * @param onError 错误回调
   * @param onComplete 完成回调
   * @returns EventSource 实例（用于中断）
   */
  static streamChat(
    request: SendMessageRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
  ): EventSource {
    // 获取 token
    const token = localStorage.getItem("auth_token");

    // 构建 URL 参数
    const params = new URLSearchParams({
      agentId: request.agentId,
      sessionId: request.sessionId,
      message: request.message,
      // 将 agentConfig 序列化为 JSON 字符串
      agentConfig: JSON.stringify(request.agentConfig),
    });

    // 如果有 token，添加到 URL 参数中
    if (token) {
      params.append("token", token);
    }

    // 创建 EventSource 连接
    const eventSource = new EventSource(
      `/api/chat/stream?${params.toString()}`,
    );

    // 监听消息事件
    eventSource.onmessage = (event) => {
      try {
        const chunk: StreamChunk = JSON.parse(event.data);
        onChunk(chunk);

        // 如果完成，关闭连接
        if (chunk.done) {
          eventSource.close();
          onComplete?.();
        }
      } catch (error) {
        console.error("解析 SSE 数据失败:", error);
        onError?.(error as Error);
        eventSource.close();
      }
    };

    // 监听错误事件
    eventSource.onerror = (error) => {
      console.error("SSE 连接错误:", error);
      onError?.(new Error("连接中断"));
      eventSource.close();
    };

    return eventSource;
  }

  /**
   * 停止流式响应
   * @param eventSource EventSource 实例
   */
  static stopStream(eventSource: EventSource): void {
    eventSource.close();
  }

  /**
   * 获取会话历史
   * @param sessionId 会话 ID
   * @returns 消息列表
   */
  static async getSessionHistory(sessionId: string): Promise<any> {
    return await ApiService.get(`chat/session/${sessionId}`);
  }

  /**
   * 清空会话历史
   * @param sessionId 会话 ID
   */
  static async clearSession(sessionId: string): Promise<void> {
    return await ApiService.post(`chat/session/${sessionId}/clear`);
  }
}
