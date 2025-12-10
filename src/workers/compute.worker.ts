// src/workers/compute.worker.ts
import type {
  ComputeTask,
  ComputeResult,
  SearchParams,
  AggregateParams,
  FilterParams,
  SortParams,
  ParseJsonParams,
} from "@/types/worker/compute";

/**
 * 计算 Worker
 * 用于在后台线程执行计算密集型任务，避免阻塞主线程
 * 支持消息搜索、数据聚合、排序过滤等功能
 */
class ComputeWorker {
  constructor() {
    self.onmessage = (event: MessageEvent<ComputeTask>) => {
      this.handleTask(event.data);
    };

    self.onerror = (error) => {
      console.error("ComputeWorker error:", error);
    };
  }

  /**
   * 处理计算任务
   */
  private handleTask(task: ComputeTask) {
    const startTime = performance.now();

    try {
      let result: any;

      switch (task.type) {
        case "SEARCH":
          result = this.searchMessages(task.data, task.params as SearchParams);
          break;
        case "AGGREGATE":
          result = this.aggregateStats(
            task.data,
            task.params as AggregateParams,
          );
          break;
        case "FILTER":
          result = this.filterData(task.data, task.params as FilterParams);
          break;
        case "SORT":
          result = this.sortData(task.data, task.params as SortParams);
          break;
        case "PARSE_JSON":
          result = this.parseJson(task.params as ParseJsonParams);
          break;
        default:
          throw new Error(`未知任务类型: ${task.type}`);
      }

      const response: ComputeResult = {
        taskId: task.id,
        type: task.type,
        result,
        duration: performance.now() - startTime,
      };

      self.postMessage(response);
    } catch (error) {
      const response: ComputeResult = {
        taskId: task.id,
        type: task.type,
        result: null,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };

      self.postMessage(response);
    }
  }

  /**
   * 消息搜索 - 支持多字段模糊匹配
   * @param messages 消息数组
   * @param params 搜索参数
   */
  private searchMessages(messages: any[], params: SearchParams): any[] {
    const keyword = params.keyword.toLowerCase().trim();

    if (!keyword) {
      return messages;
    }

    const fields = params.fields || ["content", "sender", "title", "name"];

    return messages.filter((msg) => {
      return fields.some((field) => {
        const value = msg[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(keyword);
        }
        return false;
      });
    });
  }

  /**
   * 数据聚合统计
   * @param data 数据数组
   * @param params 聚合参数
   */
  private aggregateStats(
    data: any[],
    params: AggregateParams,
  ): Record<string, number> {
    const groups = new Map<string, number>();

    data.forEach((item) => {
      const key = String(item[params.groupBy] ?? "unknown");
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return Object.fromEntries(groups);
  }

  /**
   * 数据过滤
   * @param data 数据数组
   * @param params 过滤参数
   */
  private filterData(data: any[], params: FilterParams): any[] {
    const { conditions } = params;

    if (!conditions || Object.keys(conditions).length === 0) {
      return data;
    }

    return data.filter((item) =>
      Object.entries(conditions).every(([key, value]) => {
        // 支持数组值的匹配（任一匹配即可）
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      }),
    );
  }

  /**
   * 数据排序
   * @param data 数据数组
   * @param params 排序参数
   */
  private sortData(data: any[], params: SortParams): any[] {
    const { field, order } = params;

    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      // 处理 null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === "asc" ? -1 : 1;
      if (bVal == null) return order === "asc" ? 1 : -1;

      // 数字比较
      if (typeof aVal === "number" && typeof bVal === "number") {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }

      // 字符串比较
      const comparison = String(aVal).localeCompare(String(bVal));
      return order === "desc" ? -comparison : comparison;
    });
  }

  /**
   * JSON 解析
   * @param params JSON 解析参数
   */
  private parseJson(params: ParseJsonParams): any {
    return JSON.parse(params.jsonString);
  }
}

// 启动计算 Worker
new ComputeWorker();
