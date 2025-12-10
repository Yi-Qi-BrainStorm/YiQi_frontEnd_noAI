// src/types/worker/compute.ts

/**
 * 计算任务类型
 */
export type ComputeTaskType =
  | "SEARCH"
  | "AGGREGATE"
  | "FILTER"
  | "SORT"
  | "PARSE_JSON";

/**
 * 计算任务消息
 */
export interface ComputeTask {
  id: string;
  type: ComputeTaskType;
  data: any[];
  params: Record<string, any>;
}

/**
 * 计算结果响应
 */
export interface ComputeResult {
  taskId: string;
  type: ComputeTaskType;
  result: any;
  duration: number;
  error?: string;
}

/**
 * 搜索参数
 */
export interface SearchParams {
  keyword: string;
  fields?: string[];
}

/**
 * 聚合参数
 */
export interface AggregateParams {
  groupBy: string;
}

/**
 * 过滤参数
 */
export interface FilterParams {
  conditions: Record<string, any>;
}

/**
 * 排序参数
 */
export interface SortParams {
  field: string;
  order: "asc" | "desc";
}

/**
 * JSON 解析参数
 */
export interface ParseJsonParams {
  jsonString: string;
}
