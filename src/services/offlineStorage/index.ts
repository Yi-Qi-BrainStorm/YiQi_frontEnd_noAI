/**
 * IndexedDB 离线存储服务
 * 实现用户数据、Agent 数据的本地存储
 * Requirements: 5.1, 5.2
 */

import type { User } from "@/types/api/auth";
import type { AgentConfig } from "@/types/agent/agent";

// 数据库配置
const DB_NAME = "yiqi_offline_db";
const DB_VERSION = 1;

// 存储对象名称
export const STORES = {
  USER_DATA: "userData",
  AGENT_DATA: "agentData",
  CACHED_RESPONSES: "cachedResponses",
} as const;

// 缓存数据结构
export interface CachedData<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // 过期时间(秒)
  version: number;
}

// 用户数据缓存
export interface CachedUserData extends CachedData<User> {
  userId: string;
}

// Agent 数据缓存
export interface CachedAgentData extends CachedData<AgentConfig[]> {
  userId: string;
}

// 默认 TTL: 24小时
const DEFAULT_TTL = 24 * 60 * 60;

/**
 * IndexedDB 离线存储服务类
 */
export class OfflineStorageService {
  private static db: IDBDatabase | null = null;
  private static initPromise: Promise<IDBDatabase> | null = null;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<IDBDatabase> {
    // 如果已经初始化，直接返回
    if (this.db) {
      return this.db;
    }

    // 如果正在初始化，等待完成
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("IndexedDB 打开失败:", request.error);
        this.initPromise = null;
        reject(new Error("IndexedDB 打开失败"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB 初始化成功");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });

    return this.initPromise;
  }

  /**
   * 创建存储对象
   */
  private static createStores(db: IDBDatabase): void {
    // 用户数据存储
    if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
      const userStore = db.createObjectStore(STORES.USER_DATA, {
        keyPath: "userId",
      });
      userStore.createIndex("timestamp", "timestamp", { unique: false });
    }

    // Agent 数据存储
    if (!db.objectStoreNames.contains(STORES.AGENT_DATA)) {
      const agentStore = db.createObjectStore(STORES.AGENT_DATA, {
        keyPath: "userId",
      });
      agentStore.createIndex("timestamp", "timestamp", { unique: false });
    }

    // 通用缓存响应存储
    if (!db.objectStoreNames.contains(STORES.CACHED_RESPONSES)) {
      const cacheStore = db.createObjectStore(STORES.CACHED_RESPONSES, {
        keyPath: "key",
      });
      cacheStore.createIndex("timestamp", "timestamp", { unique: false });
    }
  }

  /**
   * 获取数据库实例
   */
  private static async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      return this.init();
    }
    return this.db;
  }

  /**
   * 执行事务操作
   */
  private static async executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ========== 用户数据操作 ==========

  /**
   * 缓存用户数据 (Requirements: 5.1)
   */
  static async cacheUserData(
    userId: string,
    userData: User,
    ttl: number = DEFAULT_TTL,
  ): Promise<void> {
    const cachedData: CachedUserData = {
      key: `user_${userId}`,
      userId,
      data: userData,
      timestamp: Date.now(),
      ttl,
      version: 1,
    };

    await this.executeTransaction(STORES.USER_DATA, "readwrite", (store) =>
      store.put(cachedData),
    );

    console.log(`用户数据已缓存: ${userId}`);
  }

  /**
   * 获取缓存的用户数据
   */
  static async getCachedUserData(userId: string): Promise<User | null> {
    try {
      const cachedData = await this.executeTransaction<
        CachedUserData | undefined
      >(STORES.USER_DATA, "readonly", (store) => store.get(userId));

      if (!cachedData) {
        return null;
      }

      // 检查是否过期
      if (this.isExpired(cachedData)) {
        console.log(`用户数据已过期: ${userId}`);
        await this.deleteUserData(userId);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error("获取缓存用户数据失败:", error);
      return null;
    }
  }

  /**
   * 删除用户数据缓存
   */
  static async deleteUserData(userId: string): Promise<void> {
    await this.executeTransaction(STORES.USER_DATA, "readwrite", (store) =>
      store.delete(userId),
    );
  }

  // ========== Agent 数据操作 ==========

  /**
   * 缓存 Agent 数据 (Requirements: 5.2)
   */
  static async cacheAgentData(
    userId: string,
    agents: AgentConfig[],
    ttl: number = DEFAULT_TTL,
  ): Promise<void> {
    const cachedData: CachedAgentData = {
      key: `agents_${userId}`,
      userId,
      data: agents,
      timestamp: Date.now(),
      ttl,
      version: 1,
    };

    await this.executeTransaction(STORES.AGENT_DATA, "readwrite", (store) =>
      store.put(cachedData),
    );

    console.log(`Agent 数据已缓存: ${userId}, 数量: ${agents.length}`);
  }

  /**
   * 获取缓存的 Agent 数据
   */
  static async getCachedAgentData(
    userId: string,
  ): Promise<AgentConfig[] | null> {
    try {
      const cachedData = await this.executeTransaction<
        CachedAgentData | undefined
      >(STORES.AGENT_DATA, "readonly", (store) => store.get(userId));

      if (!cachedData) {
        return null;
      }

      // 检查是否过期
      if (this.isExpired(cachedData)) {
        console.log(`Agent 数据已过期: ${userId}`);
        await this.deleteAgentData(userId);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error("获取缓存 Agent 数据失败:", error);
      return null;
    }
  }

  /**
   * 删除 Agent 数据缓存
   */
  static async deleteAgentData(userId: string): Promise<void> {
    await this.executeTransaction(STORES.AGENT_DATA, "readwrite", (store) =>
      store.delete(userId),
    );
  }

  // ========== 通用缓存操作 ==========

  /**
   * 缓存通用数据
   */
  static async cacheData<T>(
    key: string,
    data: T,
    ttl: number = DEFAULT_TTL,
  ): Promise<void> {
    const cachedData: CachedData<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      version: 1,
    };

    await this.executeTransaction(
      STORES.CACHED_RESPONSES,
      "readwrite",
      (store) => store.put(cachedData),
    );
  }

  /**
   * 获取缓存的通用数据
   */
  static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await this.executeTransaction<
        CachedData<T> | undefined
      >(STORES.CACHED_RESPONSES, "readonly", (store) => store.get(key));

      if (!cachedData) {
        return null;
      }

      // 检查是否过期
      if (this.isExpired(cachedData)) {
        await this.deleteCachedData(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error("获取缓存数据失败:", error);
      return null;
    }
  }

  /**
   * 删除缓存数据
   */
  static async deleteCachedData(key: string): Promise<void> {
    await this.executeTransaction(
      STORES.CACHED_RESPONSES,
      "readwrite",
      (store) => store.delete(key),
    );
  }

  // ========== 工具方法 ==========

  /**
   * 检查数据是否过期
   */
  private static isExpired(cachedData: CachedData): boolean {
    const now = Date.now();
    const expirationTime = cachedData.timestamp + cachedData.ttl * 1000;
    return now > expirationTime;
  }

  /**
   * 获取缓存数据的元信息
   */
  static async getCacheMetadata(
    storeName: string,
    key: string,
  ): Promise<{ timestamp: number; ttl: number; isExpired: boolean } | null> {
    try {
      const cachedData = await this.executeTransaction<CachedData | undefined>(
        storeName,
        "readonly",
        (store) => store.get(key),
      );

      if (!cachedData) {
        return null;
      }

      return {
        timestamp: cachedData.timestamp,
        ttl: cachedData.ttl,
        isExpired: this.isExpired(cachedData),
      };
    } catch (error) {
      console.error("获取缓存元信息失败:", error);
      return null;
    }
  }

  /**
   * 清除所有过期数据
   */
  static async clearExpiredData(): Promise<void> {
    const db = await this.getDB();
    const storeNames = [
      STORES.USER_DATA,
      STORES.AGENT_DATA,
      STORES.CACHED_RESPONSES,
    ];

    for (const storeName of storeNames) {
      await this.clearExpiredFromStore(db, storeName);
    }

    console.log("过期数据清理完成");
  }

  /**
   * 清除指定存储中的过期数据
   */
  private static async clearExpiredFromStore(
    db: IDBDatabase,
    storeName: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const cachedData = cursor.value as CachedData;
          if (this.isExpired(cachedData)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 清除所有缓存数据
   */
  static async clearAllData(): Promise<void> {
    const storeNames = [
      STORES.USER_DATA,
      STORES.AGENT_DATA,
      STORES.CACHED_RESPONSES,
    ];

    for (const storeName of storeNames) {
      await this.executeTransaction(storeName, "readwrite", (store) =>
        store.clear(),
      );
    }

    console.log("所有缓存数据已清除");
  }

  /**
   * 关闭数据库连接
   */
  static close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log("IndexedDB 连接已关闭");
    }
  }
}
