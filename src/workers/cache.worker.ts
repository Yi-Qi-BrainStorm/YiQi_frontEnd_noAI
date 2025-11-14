// src/workers/cache.worker.ts
import type {
  CacheMessage,
  CacheResponse,
  CacheItem,
} from "@/types/worker/cache.ts";

class CacheWorker {
  private cache = new Map<string, CacheItem>();

  constructor() {
    self.onmessage = (event: MessageEvent<CacheMessage>) => {
      this.handleMessage(event.data);
    };
  }

  private handleMessage(message: CacheMessage) {
    const { type, key, data, ttl, id } = message;

    try {
      let response: CacheResponse;

      switch (type) {
        case "SET": {
          this.set(key, data, ttl);
          response = { type: "SET_COMPLETE", key, id };
          break;
        }

        case "GET": {
          const result = this.get(key);
          response = { type: "GET_COMPLETE", key, data: result, id };
          break;
        }

        case "DELETE": {
          this.delete(key);
          response = { type: "DELETE_COMPLETE", key, id };
          break;
        }

        case "CLEAR": {
          this.clear();
          response = { type: "CLEAR_COMPLETE", id };
          break;
        }

        case "EXISTS": {
          const exists = this.exists(key);
          response = { type: "EXISTS_COMPLETE", key, exists, id };
          break;
        }

        // 新增：批量设置功能
        case "BATCH_SET": {
          const batchResult = this.setBatch(
            data as Array<{ key: string; data: any; ttl?: number }>,
          );
          response = { type: "BATCH_SET_COMPLETE", key: batchResult, id };
          break;
        }

        // 新增：统计功能
        case "STATS": {
          const stats = this.getStats();
          response = { type: "STATS_COMPLETE", key, data: stats, id };
          break;
        }

        default:
          throw new Error(`未知操作类型: ${type}`);
      }

      self.postMessage(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      self.postMessage({
        type: "ERROR",
        error: errorMessage,
        id, // 确保错误响应也包含 id
      });
    }
  }

  private set(key: string, data: any, ttl?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  private get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查是否过期
    if (item.ttl && Date.now() > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  private delete(key: string) {
    this.cache.delete(key);
  }

  private clear() {
    this.cache.clear();
  }

  private exists(key: string): boolean {
    return this.get(key) !== null;
  }

  // 新增：批量设置方法
  private setBatch(
    items: Array<{ key: string; data: any; ttl?: number }>,
  ): string {
    const firstKey = items[0]?.key || "";

    items.forEach((item) => {
      this.set(item.key, item.data, item.ttl);
    });

    console.log(`批量设置 ${items.length} 个缓存项`);
    return firstKey;
  }

  // 新增：统计方法
  private getStats(): { total: number; keys: string[]; expiredCount: number } {
    const keys = Array.from(this.cache.keys());
    let expiredCount = 0;
    const now = Date.now();

    keys.forEach((key) => {
      // 直接检查缓存中item的过期状态
      const item = this.cache.get(key);
      if (item) {
        // item存在，检查是否过期
        if (item.ttl && now > item.ttl) {
          expiredCount++;
        }
      }
    });

    try {
      const cleanedCount = this.cleanExpired();
      if (cleanedCount !== expiredCount)
        throw new Error(`缓存数据一致性检查失败`);
    } catch (error) {
      console.error(
        "缓存清理过程异常:",
        error instanceof Error ? error.message : String(error),
      );
    }

    return {
      total: this.cache.size,
      keys,
      expiredCount,
    };
  }

  //添加清理过期项的方法
  private cleanExpired(): number {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    let cleanedCount = 0;

    keys.forEach((key) => {
      const item = this.cache.get(key);
      if (item && item.ttl && now > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });
    return cleanedCount;
  }
}

// 启动缓存Worker
new CacheWorker();
