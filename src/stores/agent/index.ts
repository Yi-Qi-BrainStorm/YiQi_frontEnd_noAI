import { defineStore } from "pinia";
import { AgentStorageService } from "@/services/agent/storageService";
import { useAuthStore } from "@/stores/auth";
import type { AgentConfig } from "@/types/agent/agent";
import type { AgentFormData } from "@/types/agent/form";
import { ref, computed } from "vue";

let initialized = false;

export const useAgentStore = defineStore("agent", () => {
  const agents = ref<AgentConfig[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const agentNumber = computed(() => agents.value.length);

  // 获取当前用户ID
  const getUserId = (): string | undefined => {
    const authStore = useAuthStore();
    return authStore.user?.id;
  };

  // 初始化加载（支持强制刷新）
  const initializeAgents = async (force: boolean = false): Promise<void> => {
    // 如果已初始化且不是强制刷新，则跳过
    if (initialized && !force) {
      return;
    }

    loading.value = true;
    try {
      const userId = getUserId();
      agents.value = await AgentStorageService.loadAgents(userId);
      error.value = null;
      initialized = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "初始化失败";
    } finally {
      loading.value = false;
    }
  };

  // 移除自动初始化，改为手动初始化
  // 原因：自动初始化时 authStore.user 可能还未恢复，导致使用错误的 storage key

  const getAgentById = (id: string): AgentConfig | null => {
    const userId = getUserId();
    return AgentStorageService.getAgentById(id, userId);
  };

  const createAgent = (formData: AgentFormData): AgentConfig => {
    try {
      const userId = getUserId();
      const newAgent = AgentStorageService.createAgent(formData, userId);
      agents.value = AgentStorageService.loadAgents(userId); // 重新加载
      error.value = null;
      return newAgent;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "创建失败";
      throw err;
    }
  };

  const updateAgent = (id: string, formData: AgentFormData): AgentConfig => {
    try {
      const userId = getUserId();
      const updatedAgent = AgentStorageService.updateAgent(
        id,
        formData,
        userId,
      );
      agents.value = AgentStorageService.loadAgents(userId); // 重新加载
      error.value = null;
      return updatedAgent;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "更新失败";
      throw err;
    }
  };

  const deleteAgent = (id: string): void => {
    try {
      const userId = getUserId();
      AgentStorageService.deleteAgent(id, userId);
      agents.value = AgentStorageService.loadAgents(userId); // 重新加载
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "删除失败";
      throw err;
    }
  };

  const filterAgents = (
    predicate: (agent: AgentConfig) => boolean,
  ): AgentConfig[] => {
    return agents.value.filter(predicate);
  };

  return {
    agents,
    loading,
    error,
    agentNumber,
    initializeAgents, // 暴露初始化方法
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent,
    filterAgents,
  };
});
