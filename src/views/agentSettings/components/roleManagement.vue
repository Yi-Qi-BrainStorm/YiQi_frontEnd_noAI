<template>
  <div class="role-management">
    <div class="header">
      <h2 class="title">Agent 角色管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          创建新 Agent
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <VirtualTable
        :data="agents"
        :columns="columns"
        :actions="actions"
        :loading="loading"
        :height="tableHeight"
        :item-height="60"
        :stripe="true"
        :border="true"
        :highlight-current-row="true"
        empty-text="暂无 Agent，点击右上角创建"
        @row-click="handleRowClick"
      >
        <!-- 自定义描述列（支持多行显示） -->
        <template #description="{ row }">
          <el-tooltip
            :content="row.description"
            placement="top"
            :disabled="!row.description || row.description.length < 50"
          >
            <div class="description-cell">
              {{ row.description || "-" }}
            </div>
          </el-tooltip>
        </template>

        <!-- 自定义模型列 -->
        <template #model="{ row }">
          <el-tag size="small" type="info">{{ row.model }}</el-tag>
        </template>

        <!-- 自定义创建时间列 -->
        <template #createdAt="{ row }">
          <span class="time-text">{{ formatTime(row.createdAt) }}</span>
        </template>
      </VirtualTable>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="delete-dialog-content">
        <el-icon class="warning-icon" color="#E6A23C" :size="48">
          <WarningFilled />
        </el-icon>
        <p class="warning-text">
          确定要删除 Agent <strong>{{ currentAgent?.name }}</strong> 吗？
        </p>
        <p class="warning-hint">此操作不可恢复</p>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting"
          >确认删除</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Plus, WarningFilled } from "@element-plus/icons-vue";
import VirtualTable from "@/components/VirtualTable/index.vue";
import { useAgentStore } from "@/stores/agent";
import type { AgentConfig } from "@/types/agent/agent";
import type {
  VirtualTableColumn,
  VirtualTableAction,
} from "@/types/components/virtualTable";

const router = useRouter();
const agentStore = useAgentStore();

// 响应式数据
const deleteDialogVisible = ref(false);
const currentAgent = ref<AgentConfig | null>(null);
const deleting = ref(false);
const tableHeight = ref(600);

// 计算属性
const agents = computed(() => agentStore.agents);
const loading = computed(() => agentStore.loading);

// 表格列配置
const columns: VirtualTableColumn<AgentConfig>[] = [
  {
    prop: "name",
    label: "Agent 名称",
    width: 200,
    align: "left",
  },
  {
    prop: "description",
    label: "描述",
    minWidth: 300,
    align: "left",
    slot: "description", // 使用自定义插槽
  },
  {
    prop: "model",
    label: "模型",
    width: 200,
    align: "center",
    slot: "model",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    width: 180,
    align: "center",
    slot: "createdAt",
  },
];

// 操作列配置
const actions: VirtualTableAction<AgentConfig>[] = [
  {
    label: "编辑",
    type: "primary",
    onClick: handleEdit,
  },
  {
    label: "删除",
    type: "danger",
    onClick: handleDelete,
    // 可选：禁用默认 Agent 的删除
    disabled: (row) => row.id === "default-assistant",
  },
];

// 方法
function handleCreate() {
  router.push("/home/agent-settings/agent-settings");
}

function handleEdit(row: AgentConfig) {
  // 跳转到编辑页面，通过 query 传递 agent id
  router.push({
    path: "/home/agent-settings/agent-settings",
    query: { id: row.id },
  });
}

function handleDelete(row: AgentConfig) {
  currentAgent.value = row;
  deleteDialogVisible.value = true;
}

async function confirmDelete() {
  if (!currentAgent.value) return;

  deleting.value = true;
  try {
    agentStore.deleteAgent(currentAgent.value.id);
    ElMessage.success("删除成功");
    deleteDialogVisible.value = false;
    currentAgent.value = null;
  } catch (error) {
    ElMessage.error(
      "删除失败：" + (error instanceof Error ? error.message : "未知错误"),
    );
  } finally {
    deleting.value = false;
  }
}

function handleRowClick(row: AgentConfig, index: number) {
  console.log("点击行:", row, "索引:", index);
  // 可以在这里添加行点击的逻辑，比如显示详情
}

function formatTime(timeString: string): string {
  const date = new Date(timeString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于1分钟
  if (diff < 60000) {
    return "刚刚";
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }

  // 超过7天，显示具体日期
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 计算表格高度（响应式）
function calculateTableHeight() {
  const windowHeight = window.innerHeight;
  // 减去页面其他元素的高度（header + padding）
  tableHeight.value = windowHeight - 200;
}

onMounted(async () => {
  calculateTableHeight();
  window.addEventListener("resize", calculateTableHeight);

  // 组件挂载时强制重新加载 agents 数据
  await agentStore.initializeAgents(true);
});

// 清理
onUnmounted(() => {
  window.removeEventListener("resize", calculateTableHeight);
});
</script>

<style lang="scss" scoped>
.role-management {
  @apply h-full flex flex-col;
  padding: 24px;
  background: #f5f7fa;

  .header {
    @apply flex justify-between items-center mb-6;

    .title {
      @apply text-2xl font-semibold text-gray-800;
      margin: 0;
    }

    .header-actions {
      @apply flex gap-3;
    }
  }

  .table-container {
    @apply flex-1 bg-white rounded-lg shadow-sm;
    padding: 16px;
    overflow: hidden;
  }

  .description-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2; /* 标准属性 */
    -webkit-box-orient: vertical;
    line-height: 1.5;
    max-height: 3em;
  }

  .time-text {
    color: #909399;
    font-size: 13px;
  }
}

.delete-dialog-content {
  @apply flex flex-col items-center text-center;
  padding: 20px 0;

  .warning-icon {
    margin-bottom: 16px;
  }

  .warning-text {
    @apply text-base text-gray-700 mb-2;
    margin: 0;

    strong {
      @apply text-gray-900 font-semibold;
    }
  }

  .warning-hint {
    @apply text-sm text-gray-500;
    margin: 0;
  }
}
</style>
