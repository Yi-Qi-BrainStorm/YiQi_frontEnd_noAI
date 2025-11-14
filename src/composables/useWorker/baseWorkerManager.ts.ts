// src/composables/useWorker/WorkerManager.ts
import { ref, type Ref } from "vue";
import type { PendingPromise } from "@/types/worker/baseWorker.ts";

export abstract class BaseWorkerManager<TMessage = any, TResponse = any> {
  protected worker: Ref<Worker | null>;
  protected isLoading: Ref<boolean>;
  protected error: Ref<string | null>;
  protected pendingPromises: Map<string, PendingPromise>;

  constructor(workerPath: string) {
    this.worker = ref(null);
    this.isLoading = ref(false);
    this.error = ref(null);
    this.pendingPromises = new Map();

    this.init(workerPath);
  }

  protected init(workerPath: string) {
    try {
      this.worker.value = new Worker(new URL(workerPath, import.meta.url));
      this.setupMessageHandler();
      this.setupErrorHandler();
    } catch (err) {
      this.error.value = `初始化失败: ${err}`;
    }
  }

  protected abstract handleMessage(response: TResponse): void;

  private setupMessageHandler() {
    if (!this.worker.value) return;

    this.worker.value.onmessage = (event: MessageEvent<TResponse>) => {
      const response = event.data;

      // 错误检查
      if (response && typeof response === "object" && "error" in response) {
        this.error.value = response.error as string;
        this.isLoading.value = false;
        return;
      }

      this.handleMessage(response);
    };
  }

  private setupErrorHandler() {
    if (!this.worker.value) return;

    this.worker.value.onerror = (e) => {
      this.error.value = `Worker错误: ${e.message}`;
      this.isLoading.value = false;
    };
  }

  protected sendMessage(message: TMessage & { id?: string }): Promise<any> {
    if (!this.worker.value) {
      return Promise.reject("Worker未初始化");
    }

    this.isLoading.value = true;

    return new Promise((resolve, reject) => {
      const messageId =
        message.id || (message as any).key || Date.now().toString();

      // 超时处理
      const timeoutId = setTimeout(() => {
        if (this.pendingPromises.has(messageId)) {
          this.pendingPromises.delete(messageId);
          reject("操作超时");
          this.isLoading.value = false;
        }
      }, 5000);

      this.pendingPromises.set(messageId, { resolve, reject, timeoutId });
      this.worker.value!.postMessage({ ...message, id: messageId });
    });
  }

  public terminate() {
    this.worker.value?.terminate();
    this.worker.value = null;
    this.pendingPromises.clear();
    this.isLoading.value = false;
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

  protected resolvePromise(id: string, value: any) {
    if (this.pendingPromises.has(id)) {
      const { resolve, timeoutId } = this.pendingPromises.get(id)!;
      this.pendingPromises.delete(id);
      clearTimeout(timeoutId);
      resolve(value);
    }
  }
}
