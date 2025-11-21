<template>
  <div class="chat-panel">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="header-info">
        <h3 class="agent-name">{{ agent.name }}</h3>
        <span class="session-id">会话 ID: {{ sessionId }}</span>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="handleClear" :disabled="!hasMessages">
          <el-icon><Delete /></el-icon>
          清空对话
        </el-button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messageContainer" class="message-list">
      <!-- 空状态 -->
      <div v-if="!hasMessages" class="empty-state">
        <el-icon class="empty-icon" :size="64" color="#C0C4CC">
          <ChatDotRound />
        </el-icon>
        <p class="empty-text">开始与 {{ agent.name }} 对话吧</p>
        <p class="empty-hint">测试你的 Agent 配置是否符合预期</p>
      </div>

      <!-- 消息列表 -->
      <div v-else class="messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="[`message-${message.role}`, `status-${message.status}`]"
        >
          <!-- 用户消息 -->
          <div
            v-if="message.role === 'user'"
            class="message-content user-message"
          >
            <div class="message-avatar">
              <el-icon :size="20"><User /></el-icon>
            </div>
            <div class="message-bubble">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>

          <!-- AI 消息 -->
          <div v-else class="message-content assistant-message">
            <div class="message-avatar">
              <el-icon :size="20"><Cpu /></el-icon>
            </div>
            <div class="message-bubble">
              <div
                class="message-text"
                v-html="formatMarkdown(message.content)"
              ></div>
              <div class="message-footer">
                <span class="message-time">{{
                  formatTime(message.timestamp)
                }}</span>
                <el-tag
                  v-if="message.status === 'streaming'"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  生成中...
                </el-tag>
                <el-tag
                  v-else-if="message.status === 'error'"
                  size="small"
                  type="danger"
                  effect="plain"
                >
                  错误
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载指示器 -->
        <div v-if="isStreaming" class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        placeholder="输入消息..."
        :disabled="isSending"
        @keydown.enter.ctrl="handleSend"
        @keydown.enter.meta="handleSend"
      />
      <div class="input-actions">
        <span class="input-hint">Ctrl/Cmd + Enter 发送</span>
        <div class="action-buttons">
          <el-button
            v-if="isStreaming"
            type="warning"
            @click="handleStop"
            :icon="VideoPause"
          >
            停止生成
          </el-button>
          <el-button
            v-else
            type="primary"
            @click="handleSend"
            :disabled="!inputMessage.trim() || isSending"
            :loading="isSending"
            :icon="Promotion"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import {
  Delete,
  ChatDotRound,
  User,
  Cpu,
  Promotion,
  VideoPause,
} from "@element-plus/icons-vue";
import { useChat } from "@/composables/useChat";
import type { AgentConfig } from "@/types/agent/agent";

// Props
interface Props {
  agent: AgentConfig;
}

const props = defineProps<Props>();

// 使用 useChat
const {
  sessionId,
  messages,
  isStreaming,
  isSending,
  hasMessages,
  sendMessage,
  stopStreaming,
  clearMessages,
  resetSession,
} = useChat(props.agent);

// 本地状态
const inputMessage = ref("");
const messageContainer = ref<HTMLElement | null>(null);

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim() || isSending.value) return;

  const message = inputMessage.value;
  inputMessage.value = "";

  await sendMessage(message);
  scrollToBottom();
};

// 停止生成
const handleStop = () => {
  stopStreaming();
};

// 清空对话
const handleClear = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有对话记录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    clearMessages();
    ElMessage.success("已清空对话");
  } catch {
    // 用户取消
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 简单的 Markdown 格式化（可以后续使用 marked.js 等库）
const formatMarkdown = (text: string): string => {
  if (!text) return "";

  return text
    .replace(/\n/g, "<br>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
};

// 监听消息变化，自动滚动
watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  },
);

// 监听 Agent 变化，重置会话
watch(
  () => props.agent.id,
  () => {
    resetSession();
  },
);
</script>

<style lang="scss" scoped>
.chat-panel {
  @apply flex flex-col h-full bg-white rounded-lg shadow-sm;
  border: 1px solid #e4e7ed;
}

.chat-header {
  @apply flex justify-between items-center px-6 py-4 border-b border-gray-200;
  flex-shrink: 0;

  .header-info {
    @apply flex flex-col;

    .agent-name {
      @apply text-lg font-semibold text-gray-800 m-0;
    }

    .session-id {
      @apply text-xs text-gray-500 mt-1;
    }
  }
}

.message-list {
  @apply flex-1 overflow-y-auto px-6 py-4;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
  }
}

.empty-state {
  @apply flex flex-col items-center justify-center h-full;
  padding: 60px 20px;

  .empty-icon {
    margin-bottom: 16px;
  }

  .empty-text {
    @apply text-base text-gray-700 mb-2;
    margin: 0;
  }

  .empty-hint {
    @apply text-sm text-gray-500;
    margin: 0;
  }
}

.messages {
  @apply flex flex-col gap-4;
}

.message-item {
  @apply w-full;
}

.message-content {
  @apply flex gap-3;

  &.user-message {
    @apply flex-row-reverse;

    .message-bubble {
      @apply bg-blue-500 text-white;
      border-radius: 12px 12px 0 12px;
    }

    .message-time {
      @apply text-blue-100;
    }
  }

  &.assistant-message {
    .message-bubble {
      @apply bg-gray-100 text-gray-800;
      border-radius: 12px 12px 12px 0;
    }
  }
}

.message-avatar {
  @apply flex items-center justify-center w-10 h-10 rounded-full bg-gray-200;
  flex-shrink: 0;
}

.message-bubble {
  @apply max-w-2xl px-4 py-3;
  word-wrap: break-word;
}

.message-text {
  @apply text-sm leading-relaxed;
  white-space: pre-wrap;

  :deep(code) {
    @apply bg-black bg-opacity-10 px-1 py-0.5 rounded text-xs;
  }

  :deep(strong) {
    @apply font-semibold;
  }

  :deep(em) {
    @apply italic;
  }
}

.message-footer {
  @apply flex items-center gap-2 mt-2;
}

.message-time {
  @apply text-xs text-gray-500;
}

.typing-indicator {
  @apply flex gap-1 px-4 py-2;

  span {
    @apply w-2 h-2 bg-gray-400 rounded-full;
    animation: typing 1.4s infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.input-area {
  @apply border-t border-gray-200 px-6 py-4;
  flex-shrink: 0;

  .input-actions {
    @apply flex justify-between items-center mt-3;

    .input-hint {
      @apply text-xs text-gray-500;
    }

    .action-buttons {
      @apply flex gap-2;
    }
  }
}
</style>
