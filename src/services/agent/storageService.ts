// services/agent/storageService.ts
import { useAuthStore } from "@/stores/auth";
import type { AgentConfig } from "@/types/agent/agent";
import type { AgentFormData } from "@/types/agent/form";

export class AgentStorageService {
  private static readonly BASE_STORAGE_KEY = "yiqi_agents";

  // 获取当前用户的存储key
  private static getUserStorageKey(): string {
    const authStore = useAuthStore();
    const userId = authStore.user?.id;

    if (!userId) {
      console.warn("用户未登录，使用默认存储key");
      return this.BASE_STORAGE_KEY;
    }

    return `${this.BASE_STORAGE_KEY}_${userId}`;
  }

  private static generateId(): string {
    // 使用 BigInt + 随机数确保高精度时间戳和随机性的结合
    const timestamp = Date.now().toString(36);
    // Math.random().toString(36) 生成的字符串可能在不同平台上长度不一致，
    // 优化为更标准的随机数生成。
    const randomSuffix = Math.random().toString(36).substring(2, 11);

    // 拼接格式：agent_时间戳(36进制)_随机数(36进制)
    return `agent_${timestamp}_${randomSuffix}`;
  }

  // ========== 基础存储操作 ==========

  // 保存agents到localStorage
  static saveAgents(agents: AgentConfig[]): void {
    try {
      const storageKey = this.getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(agents));
    } catch (error) {
      console.error("保存agents失败:", error);
      throw new Error("数据保存失败");
    }
  }

  // 从localStorage加载agents
  static loadAgents(): AgentConfig[] {
    try {
      const storageKey = this.getUserStorageKey();
      const data = localStorage.getItem(storageKey);
      const parsed = data?.length ? JSON.parse(data) : null;
      if (parsed?.length) {
        return parsed;
      }
      return [];
    } catch (error) {
      console.error("加载agents失败:", error);
      return [];
    }
  }

  // ========== 单个agent操作 - CRUD ==========

  // CREATE: 创建单个agent
  static createAgent(formData: AgentFormData): AgentConfig {
    try {
      const agents = this.loadAgents();

      const newAgent: AgentConfig = {
        id: this.generateId(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        systemPrompt: formData.systemPrompt.trim(),
        model: formData.model,
        temperature: formData.temperature,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      agents.push(newAgent);
      this.saveAgents(agents);

      return newAgent;
    } catch (error) {
      console.error("创建agent失败:", error);
      throw error;
    }
  }

  // READ: 根据ID获取单个agent
  static getAgentById(id: string): AgentConfig | null {
    try {
      const agents = this.loadAgents();
      return agents.find((agent) => agent.id === id) || null;
    } catch (error) {
      console.error("获取agent失败:", error);
      return null;
    }
  }

  // UPDATE: 更新单个agent
  static updateAgent(id: string, formData: AgentFormData): AgentConfig {
    try {
      const agents = this.loadAgents();
      const index = agents.findIndex((agent) => agent.id === id);

      if (index === -1) {
        throw new Error("Agent不存在");
      }

      // 使用非空断言，告诉TypeScript这里一定有值
      const existingAgent = agents[index]!;

      const updatedAgent: AgentConfig = {
        id: existingAgent.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        systemPrompt: formData.systemPrompt.trim(),
        model: formData.model,
        temperature: formData.temperature,
        createdAt: existingAgent.createdAt,
        updatedAt: new Date().toISOString(),
      };
      agents[index] = updatedAgent;
      this.saveAgents(agents);

      return agents[index];
    } catch (error) {
      console.error("更新agent失败:", error);
      throw error;
    }
  }

  // DELETE: 删除单个agent
  static deleteAgent(id: string): void {
    try {
      const agents = this.loadAgents();
      const agentToDelete = agents.find((agent) => agent.id === id);

      if (!agentToDelete) {
        throw new Error("Agent不存在");
      }

      const filteredAgents = agents.filter((agent) => agent.id !== id);
      this.saveAgents(filteredAgents);
    } catch (error) {
      console.error("删除agent失败:", error);
      throw error;
    }
  }
}
