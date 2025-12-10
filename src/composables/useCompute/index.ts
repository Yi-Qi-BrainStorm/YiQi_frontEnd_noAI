// src/composables/useCompute/index.ts
import { computed } from "vue";
import { ComputeWorkerManager } from "@/composables/useWorker/computeWorkerManager";

/**
 * useCompute composable
 * 提供计算密集型任务的后台执行能力
 *
 * @example
 * ```ts
 * const { searchMessages, aggregateStats, isLoading, error } = useCompute();
 *
 * // 搜索消息
 * const results = await searchMessages(messages, 'keyword');
 *
 * // 数据聚合
 * const stats = await aggregateStats(data, 'category');
 * ```
 */
export function useCompute() {
  const manager = ComputeWorkerManager.getInstance();

  // 响应式状态（从 manager 获取）
  const isLoading = computed(() => manager.getLoading().value);
  const error = computed(() => manager.getError().value);

  /**
   * 执行通用计算任务
   */
  const execute = <T>(
    type: Parameters<typeof manager.execute>[0],
    data: any[],
    params: Record<string, any>,
  ): Promise<T> => {
    return manager.execute<T>(type, data, params);
  };

  /**
   * 搜索消息历史
   * @param messages 消息数组
   * @param keyword 搜索关键词
   * @param fields 搜索字段（可选）
   */
  const searchMessages = (
    messages: any[],
    keyword: string,
    fields?: string[],
  ): Promise<any[]> => {
    return manager.searchMessages(messages, keyword, fields);
  };

  /**
   * 数据聚合统计
   * @param data 数据数组
   * @param groupBy 分组字段
   */
  const aggregateStats = (
    data: any[],
    groupBy: string,
  ): Promise<Record<string, number>> => {
    return manager.aggregateStats(data, groupBy);
  };

  /**
   * 数据过滤
   * @param data 数据数组
   * @param conditions 过滤条件
   */
  const filterData = (
    data: any[],
    conditions: Record<string, any>,
  ): Promise<any[]> => {
    return manager.filterData(data, conditions);
  };

  /**
   * 数据排序
   * @param data 数据数组
   * @param field 排序字段
   * @param order 排序方向
   */
  const sortData = (
    data: any[],
    field: string,
    order: "asc" | "desc" = "asc",
  ): Promise<any[]> => {
    return manager.sortData(data, field, order);
  };

  /**
   * 解析 JSON 字符串
   * @param jsonString JSON 字符串
   */
  const parseJson = <T = any>(jsonString: string): Promise<T> => {
    return manager.parseJson<T>(jsonString);
  };

  /**
   * 检查 Worker 是否可用
   */
  const isWorkerAvailable = (): boolean => {
    return manager.isAvailable();
  };

  return {
    // 状态
    isLoading,
    error,

    // 方法
    execute,
    searchMessages,
    aggregateStats,
    filterData,
    sortData,
    parseJson,
    isWorkerAvailable,
  };
}

/**
 * 终止全局 Worker 实例
 * 通常在应用卸载时调用
 */
export function terminateComputeWorker() {
  ComputeWorkerManager.destroyInstance();
}
