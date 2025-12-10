// src/composables/useWorker/cacheWorkerManager.ts
import { BaseWorkerManager } from "./baseWorkerManager";
import type { CacheMessage, CacheResponse } from "@/types/worker/cache";

// 单例模式：确保整个应用只有一个 Worker 实例
let cacheWorkerManagerInstance: CacheWorkerManager | null = null;

export class CacheWorkerManager extends BaseWorkerManager<
  CacheMessage,
  CacheResponse
> {
  constructor(workerPath: string = "../../workers/cache.worker.ts") {
    super(workerPath);
  }

  // 获取单例实例
  static getInstance(
    workerPath: string = "../../workers/cache.worker.ts",
  ): CacheWorkerManager {
    if (!cacheWorkerManagerInstance) {
      cacheWorkerManagerInstance = new CacheWorkerManager(workerPath);
    }
    return cacheWorkerManagerInstance;
  }

  protected handleMessage(response: CacheResponse): void {
    const { type, key, data, exists, id, error } = response;

    // 优先使用 id 匹配 Promise，如果没有 id 则使用 key（向后兼容）
    const messageId = id || key;

    if (!messageId) {
      console.warn("响应缺少 id 和 key:", response);
      return;
    }

    // 处理错误响应
    if (type === "ERROR" || error) {
      if (this.pendingPromises.has(messageId)) {
        const { reject, timeoutId } = this.pendingPromises.get(messageId)!;
        this.pendingPromises.delete(messageId);
        clearTimeout(timeoutId);
        reject(error || "未知错误");
      }
      this.error.value = error || "未知错误";
      this.isLoading.value = false;
      return;
    }

    // 通过 id 或 key 关联 Promise
    if (this.pendingPromises.has(messageId)) {
      switch (type) {
        case "GET_COMPLETE":
          this.resolvePromise(messageId, data);
          break;

        case "EXISTS_COMPLETE":
          this.resolvePromise(messageId, exists);
          break;

        case "SET_COMPLETE":
        case "DELETE_COMPLETE":
        case "CLEAR_COMPLETE":
        case "BATCH_SET_COMPLETE":
          this.resolvePromise(messageId, true);
          break;

        case "STATS_COMPLETE":
          this.resolvePromise(messageId, data);
          break;

        default:
          console.warn("未知的响应类型:", type);
      }
    } else {
      console.warn(`未找到匹配的 Promise，messageId: ${messageId}`, response);
    }

    this.error.value = null;
    this.isLoading.value = false;
  }

  // 公共业务方法
  public set(key: string, data: any, ttl?: number): Promise<boolean> {
    return this.sendMessage({ type: "SET", key, data, ttl });
  }

  public get(key: string): Promise<any> {
    return this.sendMessage({ type: "GET", key });
  }

  public delete(key: string): Promise<boolean> {
    return this.sendMessage({ type: "DELETE", key });
  }

  public clear(): Promise<boolean> {
    return this.sendMessage({ type: "CLEAR", key: "" });
  }

  public exists(key: string): Promise<boolean> {
    return this.sendMessage({ type: "EXISTS", key });
  }

  // 批量操作
  public async setBatch(
    items: Array<{ key: string; data: any; ttl?: number }>,
  ): Promise<boolean[]> {
    const promises = items.map((item) =>
      this.set(item.key, item.data, item.ttl),
    );
    return Promise.all(promises);
  }

  public async getBatch(keys: string[]): Promise<any[]> {
    const promises = keys.map((key) => this.get(key));
    return Promise.all(promises);
  }

  // 缓存统计
  public async getStats(): Promise<{ total: number; keys: string[] }> {
    // 这个需要在Worker中添加STATS操作
    return this.sendMessage({ type: "STATS", key: "stats" });
  }
}
