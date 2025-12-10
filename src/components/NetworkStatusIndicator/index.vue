<script setup lang="ts">
/**
 * 网络状态指示器组件
 * 显示当前网络状态和数据源信息
 * Requirements: 8.4
 */
import { computed } from "vue";
import { useNetworkStatus } from "@/composables/useNetworkStatus";
import {
  Connection,
  WarningFilled,
  CircleCheck,
} from "@element-plus/icons-vue";

// Props
interface Props {
  showDetails?: boolean; // 是否显示详细信息
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  autoHide?: boolean; // 是否自动隐藏（仅在状态变化时显示）
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  position: "top-right",
  autoHide: true,
});

// 使用网络状态 composable
const {
  isOnline,
  dataSource,
  connectionQuality,
  showStatusIndicator,
  statusMessage,
  statusType,
  hideNetworkIndicator,
} = useNetworkStatus();

// 计算属性：是否显示指示器
const shouldShow = computed(() => {
  if (props.autoHide) {
    // 自动隐藏模式：仅在状态变化时显示，或离线时始终显示
    return showStatusIndicator.value || !isOnline.value;
  }
  return true;
});

// 计算属性：状态图标
const statusIcon = computed(() => {
  if (!isOnline.value) return WarningFilled;
  return CircleCheck;
});

// 计算属性：状态颜色
const statusColor = computed(() => {
  if (!isOnline.value) return "#f56c6c"; // 红色 - 离线
  if (dataSource.value === "cache") return "#e6a23c"; // 橙色 - 使用缓存
  return "#67c23a"; // 绿色 - 在线
});

// 计算属性：状态文本
const statusText = computed(() => {
  if (!isOnline.value) return "离线";
  if (dataSource.value === "cache") return "缓存模式";
  return "在线";
});

// 计算属性：数据源文本
const dataSourceText = computed(() => {
  return dataSource.value === "network" ? "网络数据" : "缓存数据";
});

// 计算属性：位置样式
const positionStyle = computed(() => {
  const styles: Record<string, string> = {
    position: "fixed",
    zIndex: "9999",
  };

  switch (props.position) {
    case "top-right":
      styles.top = "70px";
      styles.right = "20px";
      break;
    case "top-left":
      styles.top = "70px";
      styles.left = "20px";
      break;
    case "bottom-right":
      styles.bottom = "20px";
      styles.right = "20px";
      break;
    case "bottom-left":
      styles.bottom = "20px";
      styles.left = "20px";
      break;
  }

  return styles;
});

// 关闭指示器
const handleClose = () => {
  hideNetworkIndicator();
};
</script>

<template>
  <Transition name="slide-fade">
    <div
      v-if="shouldShow"
      class="network-status-indicator"
      :style="positionStyle"
    >
      <!-- 紧凑模式 -->
      <div v-if="!showDetails" class="compact-indicator">
        <el-tag
          :type="
            isOnline
              ? dataSource === 'cache'
                ? 'warning'
                : 'success'
              : 'danger'
          "
          effect="dark"
          size="small"
          closable
          @close="handleClose"
        >
          <el-icon class="status-icon">
            <component :is="statusIcon" />
          </el-icon>
          <span class="status-text">{{ statusText }}</span>
        </el-tag>

        <!-- 状态消息提示 -->
        <Transition name="fade">
          <div
            v-if="statusMessage && showStatusIndicator"
            class="status-message"
          >
            <el-alert
              :title="statusMessage"
              :type="statusType"
              show-icon
              :closable="true"
              @close="handleClose"
            />
          </div>
        </Transition>
      </div>

      <!-- 详细模式 -->
      <div v-else class="detailed-indicator">
        <el-card shadow="hover" class="status-card">
          <template #header>
            <div class="card-header">
              <el-icon :color="statusColor" size="20">
                <Connection />
              </el-icon>
              <span>网络状态</span>
              <el-button type="text" size="small" @click="handleClose">
                关闭
              </el-button>
            </div>
          </template>

          <div class="status-details">
            <div class="detail-row">
              <span class="label">连接状态:</span>
              <el-tag :type="isOnline ? 'success' : 'danger'" size="small">
                {{ statusText }}
              </el-tag>
            </div>

            <div class="detail-row">
              <span class="label">数据源:</span>
              <el-tag
                :type="dataSource === 'network' ? 'primary' : 'warning'"
                size="small"
              >
                {{ dataSourceText }}
              </el-tag>
            </div>

            <div class="detail-row">
              <span class="label">连接质量:</span>
              <span class="value">{{ connectionQuality }}</span>
            </div>
          </div>

          <!-- 状态消息 -->
          <div v-if="statusMessage" class="status-alert">
            <el-alert
              :title="statusMessage"
              :type="statusType"
              show-icon
              :closable="false"
            />
          </div>
        </el-card>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.network-status-indicator {
  .compact-indicator {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;

    .status-icon {
      margin-right: 4px;
    }

    .status-text {
      font-size: 12px;
    }

    .status-message {
      max-width: 300px;
    }
  }

  .detailed-indicator {
    .status-card {
      width: 280px;

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;

        span {
          flex: 1;
          font-weight: 600;
        }
      }

      .status-details {
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #ebeef5;

          &:last-child {
            border-bottom: none;
          }

          .label {
            color: #909399;
            font-size: 13px;
          }

          .value {
            color: #303133;
            font-size: 13px;
          }
        }
      }

      .status-alert {
        margin-top: 12px;
      }
    }
  }
}

// 过渡动画
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
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
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
