// src/composables/useWorker/baseWorkerManager.ts
import { ref, type Ref } from "vue";
import type { PendingPromise } from "@/types/worker/baseWorker";

export interface WorkerManagerOptions {
  /** 超时时间（毫秒），默认 5000ms */
  timeout?: number;
}

/**
 * Worker 管理器基类
 * 封装 Worker 的 Promise 化通信逻辑
 */
export abstract class BaseWorkerManager<TMessage = any, TResponse = any> {
  protected worker: Ref<Worker | null>;
  protected isLoading: Ref<boolean>;
  protected error: Ref<string | null>;
  protected pendingPromises: Map<string, PendingPromise>;
  protected readonly timeout: number;

  constructor(workerPath: string, options: WorkerManagerOptions = {}) {
    this.worker = ref(null);
    this.isLoading = ref(false);
    this.error = ref(null);
    this.pendingPromises = new Map();
    this.timeout = options.timeout ?? 5000;

    this.init(workerPath);
  }

  protected init(workerPath: string) {
    try {
      this.worker.value = new Worker(new URL(workerPath, import.meta.url), {
        type: "module",
      });
      this.setupMessageHandler();
      this.setupErrorHandler();
    } catch (err) {
      this.error.value = `初始化失败: ${err}`;
      console.error("Worker 初始化失败:", err);
    }
  }

  /**
   * 子类实现：处理 Worker 返回的消息
   */
  protected abstract handleMessage(response: TResponse): void;

  private setupMessageHandler() {
    if (!this.worker.value) return;

    this.worker.value.onmessage = (event: MessageEvent<TResponse>) => {
      const response = event.data;

      // 错误检查
      if (response && typeof response === "object" && "error" in response) {
        const errorMsg = (response as any).error as string;
        const messageId = (response as any).id || (response as any).taskId;

        // 如果有对应的 Promise，reject 它
        if (messageId && this.pendingPromises.has(messageId)) {
          this.rejectPromise(messageId, new Error(errorMsg));
        }

        this.error.value = errorMsg;
        this.isLoading.value = false;
        return;
      }

      this.handleMessage(response);
    };
  }

  private setupErrorHandler() {
    if (!this.worker.value) return;

    this.worker.value.onerror = (e) => {
      const errorMsg = `Worker错误: ${e.message}`;
      this.error.value = errorMsg;
      this.isLoading.value = false;

      // 拒绝所有待处理的 Promise
      this.pendingPromises.forEach(({ reject, timeoutId }) => {
        clearTimeout(timeoutId);
        reject(new Error(errorMsg));
      });
      this.pendingPromises.clear();
    };
  }

  /**
   * 发送消息给 Worker
   */
  protected sendMessage(message: TMessage & { id?: string }): Promise<any> {
    if (!this.worker.value) {
      return Promise.reject(new Error("Worker未初始化"));
    }

    this.isLoading.value = true;

    return new Promise((resolve, reject) => {
      const messageId =
        message.id ||
        (message as any).key ||
        `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // 超时处理
      const timeoutId = window.setTimeout(() => {
        if (this.pendingPromises.has(messageId)) {
          this.pendingPromises.delete(messageId);
          reject(new Error("操作超时"));
          this.isLoading.value = false;
        }
      }, this.timeout);

      this.pendingPromises.set(messageId, { resolve, reject, timeoutId });
      this.worker.value!.postMessage({ ...message, id: messageId });
    });
  }

  /**
   * 终止 Worker
   */
  public terminate() {
    // 清理所有待处理的 Promise
    this.pendingPromises.forEach(({ reject, timeoutId }) => {
      clearTimeout(timeoutId);
      reject(new Error("Worker 已终止"));
    });
    this.pendingPromises.clear();

    this.worker.value?.terminate();
    this.worker.value = null;
    this.isLoading.value = false;
  }

  /**
   * 检查 Worker 是否可用
   */
  public isAvailable(): boolean {
    return this.worker.value !== null;
  }

  public getWorker() {
    return this.worker;
  }

  public getLoading() {
    return this.isLoading;
  }

  public getError() {
    return this.error;
  }

  /**
   * 解析 Promise（成功）
   */
  protected resolvePromise(id: string, value: any) {
    if (this.pendingPromises.has(id)) {
      const { resolve, timeoutId } = this.pendingPromises.get(id)!;
      this.pendingPromises.delete(id);
      clearTimeout(timeoutId);
      resolve(value);
      this.isLoading.value = false;
    }
  }

  /**
   * 拒绝 Promise（失败）
   */
  protected rejectPromise(id: string, error: Error) {
    if (this.pendingPromises.has(id)) {
      const { reject, timeoutId } = this.pendingPromises.get(id)!;
      this.pendingPromises.delete(id);
      clearTimeout(timeoutId);
      reject(error);
      this.isLoading.value = false;
    }
  }
}
