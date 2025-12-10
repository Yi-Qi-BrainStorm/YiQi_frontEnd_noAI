/**
 * 同步队列服务
 * 实现离线修改的入队和出队逻辑
 * Requirements: 5.5
 */

// 同步队列项类型
export interface SyncQueueItem {
  id: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
}

// 同步结果
export interface SyncResult {
  success: boolean;
  itemId: string;
  error?: string;
}

// 数据库配置
const DB_NAME = "yiqi_sync_queue_db";
const DB_VERSION = 1;
const STORE_NAME = "syncQueue";

// 默认最大重试次数
const DEFAULT_MAX_RETRIES = 5;

/**
 * 同步队列服务类
 */
export class SyncQueueService {
  private static db: IDBDatabase | null = null;
  private static initPromise: Promise<IDBDatabase> | null = null;
  private static isProcessing = false;

  /**
   * 初始化数据库
   */
  static async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("同步队列数据库打开失败:", request.error);
        this.initPromise = null;
        reject(new Error("同步队列数据库打开失败"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("同步队列数据库初始化成功");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("entityType", "entityType", { unique: false });
          store.createIndex("operation", "operation", { unique: false });
        }
      };
    });

    return this.initPromise;
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
   * 生成唯一 ID
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 11);
    return `sync_${timestamp}_${randomSuffix}`;
  }

  // ========== 入队操作 ==========

  /**
   * 添加项到同步队列 (Requirements: 5.5)
   */
  static async enqueue(
    item: Omit<SyncQueueItem, "id" | "timestamp" | "retryCount">,
  ): Promise<SyncQueueItem> {
    const db = await this.getDB();

    const queueItem: SyncQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: item.maxRetries ?? DEFAULT_MAX_RETRIES,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queueItem);

      request.onsuccess = () => {
        console.log(
          `同步队列项已入队: ${queueItem.id}, 操作: ${queueItem.operation}`,
        );
        resolve(queueItem);
      };

      request.onerror = () => {
        console.error("入队失败:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 便捷方法：添加创建操作到队列
   */
  static async enqueueCreate(
    entityType: string,
    entityId: string,
    payload: unknown,
    url: string,
    headers?: Record<string, string>,
  ): Promise<SyncQueueItem> {
    return this.enqueue({
      operation: "CREATE",
      entityType,
      entityId,
      payload,
      url,
      method: "POST",
      headers,
      maxRetries: DEFAULT_MAX_RETRIES,
    });
  }

  /**
   * 便捷方法：添加更新操作到队列
   */
  static async enqueueUpdate(
    entityType: string,
    entityId: string,
    payload: unknown,
    url: string,
    headers?: Record<string, string>,
  ): Promise<SyncQueueItem> {
    return this.enqueue({
      operation: "UPDATE",
      entityType,
      entityId,
      payload,
      url,
      method: "PUT",
      headers,
      maxRetries: DEFAULT_MAX_RETRIES,
    });
  }

  /**
   * 便捷方法：添加删除操作到队列
   */
  static async enqueueDelete(
    entityType: string,
    entityId: string,
    url: string,
    headers?: Record<string, string>,
  ): Promise<SyncQueueItem> {
    return this.enqueue({
      operation: "DELETE",
      entityType,
      entityId,
      payload: null,
      url,
      method: "DELETE",
      headers,
      maxRetries: DEFAULT_MAX_RETRIES,
    });
  }

  // ========== 出队操作 ==========

  /**
   * 从队列中移除项
   */
  static async dequeue(itemId: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(itemId);

      request.onsuccess = () => {
        console.log(`同步队列项已出队: ${itemId}`);
        resolve();
      };

      request.onerror = () => {
        console.error("出队失败:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取队列中的所有项（按时间戳排序）
   */
  static async getAll(): Promise<SyncQueueItem[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("timestamp");
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error("获取队列失败:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取队列长度
   */
  static async getQueueLength(): Promise<number> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 获取指定项
   */
  static async getItem(itemId: string): Promise<SyncQueueItem | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(itemId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // ========== 更新操作 ==========

  /**
   * 更新队列项（用于重试计数等）
   */
  static async updateItem(item: SyncQueueItem): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 增加重试计数
   */
  static async incrementRetryCount(
    itemId: string,
  ): Promise<SyncQueueItem | null> {
    const item = await this.getItem(itemId);
    if (!item) {
      return null;
    }

    item.retryCount += 1;
    await this.updateItem(item);
    return item;
  }

  // ========== 查询操作 ==========

  /**
   * 按实体类型获取队列项
   */
  static async getByEntityType(entityType: string): Promise<SyncQueueItem[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("entityType");
      const request = index.getAll(entityType);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 按操作类型获取队列项
   */
  static async getByOperation(
    operation: SyncQueueItem["operation"],
  ): Promise<SyncQueueItem[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("operation");
      const request = index.getAll(operation);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 获取已达到最大重试次数的项
   */
  static async getFailedItems(): Promise<SyncQueueItem[]> {
    const allItems = await this.getAll();
    return allItems.filter((item) => item.retryCount >= item.maxRetries);
  }

  /**
   * 获取待处理的项（未达到最大重试次数）
   */
  static async getPendingItems(): Promise<SyncQueueItem[]> {
    const allItems = await this.getAll();
    return allItems.filter((item) => item.retryCount < item.maxRetries);
  }

  // ========== 清理操作 ==========

  /**
   * 清空队列
   */
  static async clear(): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("同步队列已清空");
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 移除已达到最大重试次数的项
   */
  static async removeFailedItems(): Promise<number> {
    const failedItems = await this.getFailedItems();
    let removedCount = 0;

    for (const item of failedItems) {
      await this.dequeue(item.id);
      removedCount++;
    }

    console.log(`已移除 ${removedCount} 个失败的同步项`);
    return removedCount;
  }

  /**
   * 检查队列是否为空
   */
  static async isEmpty(): Promise<boolean> {
    const length = await this.getQueueLength();
    return length === 0;
  }

  /**
   * 检查是否正在处理
   */
  static isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * 设置处理状态
   */
  static setProcessingState(processing: boolean): void {
    this.isProcessing = processing;
  }

  /**
   * 关闭数据库连接
   */
  static close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log("同步队列数据库连接已关闭");
    }
  }
}
