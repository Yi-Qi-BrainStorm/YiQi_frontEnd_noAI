import { defineStore } from "pinia";
import { AgentStorageService } from "@/services";
import type { AgentConfig } from "@/types/agent/agent";
import type { AgentFormData } from "@/types/agent/form";
import { ref, computed } from "vue";

export const useAgentStore = defineStore("agent", () => {
  const agents = ref<AgentConfig[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const agentNumber = computed(() => agents.value.length);

  // 初始化加载
  const initializeAgents = (): void => {
    loading.value = true;
    try {
      agents.value = AgentStorageService.loadAgents();
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "初始化失败";
    } finally {
      loading.value = false;
    }
  };

  const getAgentById = (id: string): AgentConfig | null => {
    return AgentStorageService.getAgentById(id);
  };

  const createAgent = (formData: AgentFormData): AgentConfig => {
    try {
      const newAgent = AgentStorageService.createAgent(formData);
      agents.value = AgentStorageService.loadAgents(); // 重新加载
      error.value = null;
      return newAgent;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "创建失败";
      throw err;
    }
  };

  const updateAgent = (id: string, formData: AgentFormData): AgentConfig => {
    try {
      const updatedAgent = AgentStorageService.updateAgent(id, formData);
      agents.value = AgentStorageService.loadAgents(); // 重新加载
      error.value = null;
      return updatedAgent;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "更新失败";
      throw err;
    }
  };

  const deleteAgent = (id: string): void => {
    try {
      AgentStorageService.deleteAgent(id);
      agents.value = AgentStorageService.loadAgents(); // 重新加载
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
    initializeAgents,
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent,
    filterAgents,
  };
});
