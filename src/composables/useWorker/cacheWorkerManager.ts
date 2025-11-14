// src/composables/useWorker/CacheWorkerManager.ts
import { BaseWorkerManager } from "./baseWorkerManager.ts";
import type { CacheMessage, CacheResponse } from "@/types/worker/cache.ts";

export class CacheWorkerManager extends BaseWorkerManager<
  CacheMessage,
  CacheResponse
> {
  constructor(workerPath: string = "@/workers/cache.worker.ts") {
    super(workerPath);
  }

  protected handleMessage(response: CacheResponse): void {
    const { type, key, data, exists } = response;

    // 通过key关联Promise
    if (key && this.pendingPromises.has(key)) {
      switch (type) {
        case "GET_COMPLETE":
          this.resolvePromise(key, data);
          break;

        case "EXISTS_COMPLETE":
          this.resolvePromise(key, exists);
          break;

        case "SET_COMPLETE":
        case "DELETE_COMPLETE":
        case "CLEAR_COMPLETE":
          this.resolvePromise(key, true);
          break;

        default:
          console.warn("未知的响应类型:", type);
      }
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
