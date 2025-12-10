// src/composables/useWorker/computeWorkerManager.ts
import { BaseWorkerManager } from "./baseWorkerManager";
import type {
  ComputeTask,
  ComputeResult,
  ComputeTaskType,
} from "@/types/worker/compute";

// 单例实例
let computeWorkerManagerInstance: ComputeWorkerManager | null = null;

/**
 * 计算 Worker 管理器
 * 继承 BaseWorkerManager，实现计算任务的消息处理
 */
export class ComputeWorkerManager extends BaseWorkerManager<
  ComputeTask,
  ComputeResult
> {
  private taskIdCounter = 0;

  constructor(workerPath: string = "../../workers/compute.worker.ts") {
    // 计算任务可能耗时较长，设置 30 秒超时
    super(workerPath, { timeout: 30000 });
  }

  /**
   * 获取单例实例
   */
  static getInstance(
    workerPath: string = "../../workers/compute.worker.ts",
  ): ComputeWorkerManager {
    if (!computeWorkerManagerInstance) {
      computeWorkerManagerInstance = new ComputeWorkerManager(workerPath);
    }
    return computeWorkerManagerInstance;
  }

  /**
   * 销毁单例实例
   */
  static destroyInstance() {
    if (computeWorkerManagerInstance) {
      computeWorkerManagerInstance.terminate();
      computeWorkerManagerInstance = null;
    }
  }

  /**
   * 处理 Worker 返回的计算结果
   */
  protected handleMessage(response: ComputeResult): void {
    const { taskId, result, error } = response;

    if (!taskId) {
      console.warn("响应缺少 taskId:", response);
      return;
    }

    // 处理错误响应
    if (error) {
      this.rejectPromise(taskId, new Error(error));
      this.error.value = error;
      return;
    }

    // 解析成功的 Promise
    this.resolvePromise(taskId, result);
    this.error.value = null;
  }

  /**
   * 生成唯一任务 ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${++this.taskIdCounter}`;
  }

  /**
   * 执行计算任务
   */
  public execute<T>(
    type: ComputeTaskType,
    data: any[],
    params: Record<string, any>,
  ): Promise<T> {
    const task: ComputeTask = {
      id: this.generateTaskId(),
      type,
      data,
      params,
    };

    return this.sendMessage(task);
  }

  /**
   * 搜索消息
   */
  public searchMessages(
    messages: any[],
    keyword: string,
    fields?: string[],
  ): Promise<any[]> {
    return this.execute("SEARCH", messages, { keyword, fields });
  }

  /**
   * 数据聚合统计
   */
  public aggregateStats(
    data: any[],
    groupBy: string,
  ): Promise<Record<string, number>> {
    return this.execute("AGGREGATE", data, { groupBy });
  }

  /**
   * 数据过滤
   */
  public filterData(
    data: any[],
    conditions: Record<string, any>,
  ): Promise<any[]> {
    return this.execute("FILTER", data, { conditions });
  }

  /**
   * 数据排序
   */
  public sortData(
    data: any[],
    field: string,
    order: "asc" | "desc" = "asc",
  ): Promise<any[]> {
    return this.execute("SORT", data, { field, order });
  }

  /**
   * 解析 JSON
   */
  public parseJson<T = any>(jsonString: string): Promise<T> {
    return this.execute("PARSE_JSON", [], { jsonString });
  }
}
