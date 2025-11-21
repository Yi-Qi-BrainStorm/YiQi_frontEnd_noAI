<script lang="ts" setup>
import { ref } from "vue";
import AgentForm from "@/components/AgentForm/index.vue";
import ChatPanel from "@/components/ChatPanel/index.vue";
import type { AgentConfig } from "@/types/agent/agent";

// 当前保存的 Agent
const currentAgent = ref<AgentConfig | null>(null);

// 是否显示对话面板
const showChat = ref(false);

// 处理保存成功
const handleSaveSuccess = (agent: AgentConfig) => {
  currentAgent.value = agent;
  showChat.value = true;
};

// 处理取消
const handleCancel = () => {
  showChat.value = false;
  currentAgent.value = null;
};
</script>

<template>
  <div class="agent-setting-container">
    <!-- 左侧：表单区域 -->
    <div class="form-section" :class="{ collapsed: showChat }">
      <AgentForm @save-success="handleSaveSuccess" @cancel="handleCancel" />
    </div>

    <!-- 右侧：对话区域 -->
    <transition name="slide-fade">
      <div v-if="showChat && currentAgent" class="chat-section">
        <div class="chat-header">
          <h3>测试对话</h3>
          <el-button
            text
            @click="showChat = false"
            class="collapse-btn"
            title="收起对话面板"
          >
            <el-icon><DArrowRight /></el-icon>
          </el-button>
        </div>
        <ChatPanel :agent="currentAgent" />
      </div>
    </transition>

    <!-- 展开按钮（当对话面板收起时显示） -->
    <transition name="fade">
      <div v-if="!showChat && currentAgent" class="expand-btn-container">
        <el-button
          type="primary"
          circle
          size="large"
          @click="showChat = true"
          title="展开对话面板"
        >
          <el-icon><DArrowLeft /></el-icon>
        </el-button>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.agent-setting-container {
  @apply flex h-full gap-6 p-6 bg-gray-50;
  position: relative;
}

.form-section {
  @apply flex-shrink-0 transition-all duration-300;
  width: 600px;

  &.collapsed {
    width: 400px;
  }
}

.chat-section {
  @apply flex-1 flex flex-col bg-white rounded-lg shadow-sm;
  min-width: 500px;
  max-width: 800px;

  .chat-header {
    @apply flex justify-between items-center px-6 py-4 border-b border-gray-200;

    h3 {
      @apply text-lg font-semibold text-gray-800 m-0;
    }

    .collapse-btn {
      @apply text-gray-500;

      &:hover {
        @apply text-gray-700;
      }
    }
  }
}

.expand-btn-container {
  @apply fixed right-8 bottom-8 z-10;
}

// 动画
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
