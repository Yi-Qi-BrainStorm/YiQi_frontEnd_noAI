// src/types/cache.ts
export interface CacheMessage {
  type: "SET" | "GET" | "DELETE" | "CLEAR" | "EXISTS" | "BATCH_SET" | "STATS";
  key: string;
  data?: any;
  ttl?: number; // 过期时间(秒)
}

export interface CacheResponse {
  type:
    | "SET_COMPLETE"
    | "GET_COMPLETE"
    | "DELETE_COMPLETE"
    | "CLEAR_COMPLETE"
    | "EXISTS_COMPLETE"
    | "BATCH_SET_COMPLETE"
    | "STATS_COMPLETE";
  key?: string;
  data?: any;
  exists?: boolean;
  error?: string;
}

export interface CacheItem {
  data: any;
  timestamp: number;
  ttl?: number;
}
