/**
 * 网络恢复同步服务
 * 监听 online 事件，触发同步队列处理
 * 实现指数退避重试机制
 * Requirements: 4.4, 5.4
 */

import {
  SyncQueueService,
  type SyncQueueItem,
  type SyncResult,
} from "@/services/syncQueue";

// 同步配置
export interface SyncConfig {
  baseDelay: number; // 基础延迟（毫秒）
  maxDelay: number; // 最大延迟（毫秒）
  maxRetries: number; // 最大重试次数
  batchSize: number; // 批量处理大小
}

// 默认配置
const DEFAULT_CONFIG: SyncConfig = {
  baseDelay: 1000, // 1秒
  maxDelay: 60000, // 60秒
  maxRetries: 5,
  batchSize: 5,
};

// 同步状态
export interface SyncState {
  isProcessing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime: number | null;
  lastError: string | null;
}

// 同步事件回调
export interface SyncCallbacks {
  onSyncStart?: () => void;
  onSyncComplete?: (results: SyncResult[]) => void;
  onSyncError?: (error: Error) => void;
  onItemSynced?: (item: SyncQueueItem, success: boolean) => void;
  onNetworkStatusChange?: (isOnline: boolean) => void;
}

/**
 * 网络同步服务类
 */
export class NetworkSyncService {
  private static config: SyncConfig = DEFAULT_CONFIG;
  private static callbacks: SyncCallbacks = {};
  private static state: SyncState = {
    isProcessing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncTime: null,
    lastError: null,
  };
  private static isInitialized = false;
  private static retryTimeouts: Map<string, ReturnType<typeof setTimeout>> =
    new Map();

  /**
   * 初始化网络同步服务
   */
  static init(config?: Partial<SyncConfig>, callbacks?: SyncCallbacks): void {
    if (this.isInitialized) {
      console.warn("NetworkSyncService 已经初始化");
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks || {};

    // 初始化同步队列
    SyncQueueService.init();

    // 添加网络状态监听
    this.addNetworkListeners();

    this.isInitialized = true;
    console.log("NetworkSyncService 初始化完成");

    // 如果当前在线，尝试处理队列
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * 添加网络状态监听器 (Requirements: 4.4)
   */
  private static addNetworkListeners(): void {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  /**
   * 移除网络状态监听器
   */
  private static removeNetworkListeners(): void {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  /**
   * 处理网络恢复事件 (Requirements: 4.4, 5.4)
   */
  private static handleOnline = async (): Promise<void> => {
    console.log("网络已恢复，开始同步队列");
    this.callbacks.onNetworkStatusChange?.(true);

    // 延迟一小段时间确保网络稳定
    await this.delay(500);

    // 处理同步队列
    await this.processQueue();
  };

  /**
   * 处理网络断开事件
   */
  private static handleOffline = (): void => {
    console.log("网络已断开");
    this.callbacks.onNetworkStatusChange?.(false);

    // 取消所有待处理的重试
    this.cancelAllRetries();
  };

  /**
   * 处理同步队列 (Requirements: 4.4, 5.4)
   */
  static async processQueue(): Promise<SyncResult[]> {
    // 检查是否在线
    if (!navigator.onLine) {
      console.log("当前离线，跳过同步");
      return [];
    }

    // 检查是否正在处理
    if (this.state.isProcessing) {
      console.log("同步正在进行中，跳过");
      return [];
    }

    this.state.isProcessing = true;
    SyncQueueService.setProcessingState(true);
    this.callbacks.onSyncStart?.();

    const results: SyncResult[] = [];

    try {
      // 获取待处理的项
      const pendingItems = await SyncQueueService.getPendingItems();
      this.state.pendingCount = pendingItems.length;

      if (pendingItems.length === 0) {
        console.log("同步队列为空");
        return results;
      }

      console.log(`开始处理 ${pendingItems.length} 个同步项`);

      // 批量处理
      for (let i = 0; i < pendingItems.length; i += this.config.batchSize) {
        const batch = pendingItems.slice(i, i + this.config.batchSize);
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);

        // 如果网络断开，停止处理
        if (!navigator.onLine) {
          console.log("网络断开，停止同步");
          break;
        }
      }

      // 更新状态
      this.state.lastSyncTime = Date.now();
      this.state.failedCount = results.filter((r) => !r.success).length;
      this.state.lastError = null;

      console.log(
        `同步完成: 成功 ${results.filter((r) => r.success).length}, 失败 ${this.state.failedCount}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.state.lastError = errorMessage;
      console.error("同步队列处理失败:", error);
      this.callbacks.onSyncError?.(
        error instanceof Error ? error : new Error(errorMessage),
      );
    } finally {
      this.state.isProcessing = false;
      SyncQueueService.setProcessingState(false);
      this.callbacks.onSyncComplete?.(results);
    }

    return results;
  }

  /**
   * 批量处理同步项
   */
  private static async processBatch(
    items: SyncQueueItem[],
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const item of items) {
      const result = await this.processItem(item);
      results.push(result);
      this.callbacks.onItemSynced?.(item, result.success);
    }

    return results;
  }

  /**
   * 处理单个同步项
   */
  private static async processItem(item: SyncQueueItem): Promise<SyncResult> {
    try {
      // 发送请求
      const response = await this.sendRequest(item);

      if (response.ok) {
        // 成功，从队列中移除
        await SyncQueueService.dequeue(item.id);
        return { success: true, itemId: item.id };
      } else {
        // 请求失败，处理重试
        return await this.handleFailure(
          item,
          `HTTP ${response.status}: ${response.statusText}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return await this.handleFailure(item, errorMessage);
    }
  }

  /**
   * 发送同步请求
   */
  private static async sendRequest(item: SyncQueueItem): Promise<Response> {
    const options: RequestInit = {
      method: item.method,
      headers: {
        "Content-Type": "application/json",
        ...item.headers,
      },
    };

    // 添加请求体（非 GET/DELETE 请求）
    if (item.payload && item.method !== "GET" && item.method !== "DELETE") {
      options.body = JSON.stringify(item.payload);
    }

    return fetch(item.url, options);
  }

  /**
   * 处理同步失败 - 指数退避重试 (Requirements: 4.4)
   */
  private static async handleFailure(
    item: SyncQueueItem,
    errorMessage: string,
  ): Promise<SyncResult> {
    // 增加重试计数
    const updatedItem = await SyncQueueService.incrementRetryCount(item.id);

    if (!updatedItem) {
      return { success: false, itemId: item.id, error: "项目不存在" };
    }

    // 检查是否达到最大重试次数
    if (updatedItem.retryCount >= updatedItem.maxRetries) {
      console.error(`同步项 ${item.id} 达到最大重试次数，标记为失败`);
      return {
        success: false,
        itemId: item.id,
        error: `达到最大重试次数: ${errorMessage}`,
      };
    }

    // 计算指数退避延迟
    const delay = this.calculateBackoffDelay(updatedItem.retryCount);
    console.log(
      `同步项 ${item.id} 失败，将在 ${delay}ms 后重试 (${updatedItem.retryCount}/${updatedItem.maxRetries})`,
    );

    // 设置重试定时器
    this.scheduleRetry(updatedItem, delay);

    return {
      success: false,
      itemId: item.id,
      error: `重试中: ${errorMessage}`,
    };
  }

  /**
   * 计算指数退避延迟
   */
  private static calculateBackoffDelay(retryCount: number): number {
    // 指数退避: baseDelay * 2^retryCount
    const delay = this.config.baseDelay * Math.pow(2, retryCount);
    // 添加随机抖动 (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    // 限制最大延迟
    return Math.min(delay + jitter, this.config.maxDelay);
  }

  /**
   * 安排重试
   */
  private static scheduleRetry(item: SyncQueueItem, delay: number): void {
    // 取消之前的重试定时器
    this.cancelRetry(item.id);

    const timeout = setTimeout(async () => {
      this.retryTimeouts.delete(item.id);

      // 检查是否在线
      if (!navigator.onLine) {
        console.log(`重试 ${item.id} 时网络离线，等待网络恢复`);
        return;
      }

      // 重新处理该项
      const result = await this.processItem(item);
      this.callbacks.onItemSynced?.(item, result.success);
    }, delay);

    this.retryTimeouts.set(item.id, timeout);
  }

  /**
   * 取消单个重试
   */
  private static cancelRetry(itemId: string): void {
    const timeout = this.retryTimeouts.get(itemId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(itemId);
    }
  }

  /**
   * 取消所有重试
   */
  private static cancelAllRetries(): void {
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();
  }

  // ========== 工具方法 ==========

  /**
   * 延迟函数
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取当前同步状态
   */
  static getState(): SyncState {
    return { ...this.state };
  }

  /**
   * 获取待同步数量
   */
  static async getPendingCount(): Promise<number> {
    return SyncQueueService.getQueueLength();
  }

  /**
   * 手动触发同步
   */
  static async triggerSync(): Promise<SyncResult[]> {
    return this.processQueue();
  }

  /**
   * 更新配置
   */
  static updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 更新回调
   */
  static updateCallbacks(callbacks: Partial<SyncCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 检查是否在线
   */
  static isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * 检查是否正在同步
   */
  static isSyncing(): boolean {
    return this.state.isProcessing;
  }

  /**
   * 销毁服务
   */
  static destroy(): void {
    this.removeNetworkListeners();
    this.cancelAllRetries();
    SyncQueueService.close();
    this.isInitialized = false;
    this.state = {
      isProcessing: false,
      pendingCount: 0,
      failedCount: 0,
      lastSyncTime: null,
      lastError: null,
    };
    console.log("NetworkSyncService 已销毁");
  }
}

/**
 * 创建网络同步服务的 Vue composable
 */
export function useNetworkSync(
  config?: Partial<SyncConfig>,
  callbacks?: SyncCallbacks,
) {
  // 初始化服务
  NetworkSyncService.init(config, callbacks);

  return {
    // 状态
    getState: () => NetworkSyncService.getState(),
    isOnline: () => NetworkSyncService.isOnline(),
    isSyncing: () => NetworkSyncService.isSyncing(),
    getPendingCount: () => NetworkSyncService.getPendingCount(),

    // 操作
    triggerSync: () => NetworkSyncService.triggerSync(),
    updateConfig: (cfg: Partial<SyncConfig>) =>
      NetworkSyncService.updateConfig(cfg),
    updateCallbacks: (cbs: Partial<SyncCallbacks>) =>
      NetworkSyncService.updateCallbacks(cbs),

    // 清理
    destroy: () => NetworkSyncService.destroy(),
  };
}
